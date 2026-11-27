
/**
 * meal_calendar.js — calendário de refeições no terminal (semana a semana, segunda a domingo)
 * node meal_calendar.js
 * node meal_calendar.js --help
 */
'use strict'

const fs = require('fs')
const path = require('path')
const util = require('util')
const readline = require('readline')

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================
const STATE_FILE = path.join(__dirname, 'meals_state.json')

// CHANGE COLORS
// DEV_MODE = true -> a pergunta de calendário expirado aparece SEMPRE (ignora a data de hoje)
const DEV_MODE = false

const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MEAL_COLUMNS = [{ key: 'lunch', title: 'Lunch' }, { key: 'dinner', title: 'Dinner' }]
const MEAL_KEYS = MEAL_COLUMNS.map(function (column) { return column.key })

// ============================================================================
// CONSTANTES E UTILITÁRIOS DE CORES
// ============================================================================
function hexToRgb(hex) {
    const h = hex.replace('#', '')
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function getLuminance(hex) {
    const [r, g, b] = hexToRgb(hex).map(function (v) {
        const s = v / 255
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function getContrastText(bgHex, threshold = 0.5) {
    return getLuminance(bgHex) < threshold ? '#ffffff' : '#000000'
}

function c(format, text) {
    if (!process.stdout.isTTY) return text

    if (format && typeof format === 'object' && !Array.isArray(format)) {
        const { bg, fg, styles = [] } = format
        const effectiveFg = fg ?? (bg ? getContrastText(bg) : null)
        const fgStyles = effectiveFg ? [effectiveFg, ...styles] : styles
        const styled = util.styleText(fgStyles.length ? fgStyles : ['reset'], text)
        if (!bg) return styled
        const [r, g, b] = hexToRgb(bg)
        return `\x1b[48;2;${r};${g};${b}m${styled}\x1b[0m`
    }

    return util.styleText(format, text)
}

function color(hex, text, options = {}) {
    const { bg = false, styles = ['bold'] } = options
    if (!process.stdout.isTTY) return text
    if (bg) return c({ bg: hex, styles }, text)
    return c([hex, ...styles], text)
}

function clrWhite(text, options) { return color('#ffffff', text, options) }
function clrGreen(text, options) { return color('#4caf50', text, options) }
function clrRed(text, options) { return color('#f44336', text, options) }
function clrDim(text, options) { return color('#888888', text, options) }
function clrCyan(text, options) { return color('#00bcd4', text, options) }
function clrYellow(text, options) { return color('#ffeb3b', text, options) }
function clrBlue(text, options) { return color('#2196f3', text, options) }
function clrPurple(text, options) { return color('#9c27b0', text, options) }
function noColor(text) { return text }

// ============================================================================
// DATAS
// ============================================================================
function parseDate(text) {
    if (typeof text !== 'string') {
        throw new Error(`Data inválida: esperava string 'dd/mm/yyyy', recebi ${typeof text}.`)
    }
    const parts = text.split('/').map(Number)
    if (parts.length !== 3 || parts.some(Number.isNaN)) {
        throw new Error(`Data inválida "${text}". Usa dd/mm/yyyy.`)
    }
    const [day, month, year] = parts
    return new Date(year, month - 1, day)
}

function toDate(value) {
    if (value instanceof Date) return value
    if (typeof value === 'number') return new Date(value)
    return parseDate(value)
}

function addDays(date, amount) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount)
}

function getWeekdayIndex(date) {
    return (date.getDay() + 6) % 7
}

function getMondayOfWeek(date) {
    return addDays(date, -getWeekdayIndex(date))
}

function formatShortDate(date) {
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatFullDate(date) {
    return `${formatShortDate(date)}/${date.getFullYear()}`
}

// ============================================================================
// SEMANAS
// ============================================================================
function formatMealText(value) {
    return String(value ?? '').trim() || '-'
}

function buildWeeks(startDate, weekList) {
    startDate = toDate(startDate)

    const firstMonday = getMondayOfWeek(startDate)
    return weekList.map(function (week, weekIndex) {
        const monday = addDays(firstMonday, weekIndex * 7)
        const firstDayOffset = weekIndex === 0 ? getWeekdayIndex(startDate) : 0
        const maxDays = 7 - firstDayOffset

        if (week.meals.length > maxDays) {
            throw new Error(`${week.name}: tem ${week.meals.length} dias mas só cabem ${maxDays} nessa semana.`)
        }

        const days = WEEKDAY_NAMES.map(function (weekdayName, weekdayIndex) {
            return {
                weekdayName,
                date: addDays(monday, weekdayIndex),
                dayMeals: week.meals[weekdayIndex - firstDayOffset]
            }
        })
        return { monday, days }
    })
}

// ============================================================================
// ESTADO (tudo vive no meals_state.json)
// ============================================================================
function getMealKey(date, mealKey) {
    return `${formatFullDate(date)}|${mealKey}`
}

function isMealDone(doneList, date, mealKey) {
    const dateStr = formatFullDate(date)
    const entry = doneList.find(function (item) { return item.date === dateStr })
    return entry ? Boolean(entry.meals?.[mealKey]) : false
}

function markMealDone(doneList, date, mealKey) {
    const dateStr = formatFullDate(date)
    let entry = doneList.find(function (item) { return item.date === dateStr })
    if (!entry) {
        entry = { date: dateStr, meals: { lunch: false, dinner: false } }
        doneList.push(entry)
    }
    entry.meals[mealKey] = true
}

function unmarkMealDone(doneList, date, mealKey) {
    const dateStr = formatFullDate(date)
    const entry = doneList.find(function (item) { return item.date === dateStr })
    if (entry) {
        entry.meals[mealKey] = false
    }
}

function loadState() {
    if (!fs.existsSync(STATE_FILE)) return { startDate: null, meals: [], done: [] }
    try {
        const rawState = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))

        if (Array.isArray(rawState)) {
            return { startDate: null, meals: [], done: [] }
        }

        if (!rawState || typeof rawState !== 'object') throw new Error('o ficheiro devia conter um objeto')
        let done = rawState.done ?? []
        if (!Array.isArray(done)) throw new Error('"done" devia ser uma lista')

        // Converter formato antigo de done (array de strings "dd/mm/yyyy|lunch") para novo formato
        if (done.length > 0 && typeof done[0] === 'string') {
            const converted = []
            for (const key of done) {
                const [dateStr, mealKey] = key.split('|')
                if (dateStr && mealKey) {
                    let entry = converted.find(function (item) { return item.date === dateStr })
                    if (!entry) {
                        entry = { date: dateStr, meals: { lunch: false, dinner: false } }
                        converted.push(entry)
                    }
                    entry.meals[mealKey] = true
                }
            }
            done = converted
        }

        const rawMeals = Array.isArray(rawState.meals)
            ? { startDate: rawState.startDate, weeks: rawState.meals }
            : (rawState.meals ?? {})
        const weeks = rawMeals.weeks ?? []
        if (!Array.isArray(weeks)) throw new Error('"meals.weeks" devia ser uma lista')
        if (weeks.length > 0 && !rawMeals.startDate) throw new Error('falta o "meals.startDate"')

        return { startDate: rawMeals.startDate ?? null, meals: weeks, done: done }
    } catch (error) {
        throw new Error(`Não consegui ler ${path.basename(STATE_FILE)}: ${error.message}`)
    }
}

function saveState(state) {
    const fileContent = {
        meals: {
            startDate: state.startDate,
            weeks: state.meals
        },
        done: state.done
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(fileContent, null, 4) + '\n')
}

// ============================================================================
// ARGUMENTOS
// ============================================================================
function printHelp() {
    // Função auxiliar para alinhar as colunas (Comando | Argumentos | Descrição)
    function helpLine(cmd, args, desc) {
        const col1 = cmd.padEnd(12);
        const col2 = args.padEnd(32);

        const styledCmd = clrYellow(col1);
        const styledArgs = args ? clrPurple(col2) : ' '.repeat(32);
        const styledDesc = clrWhite(desc); // <-- A COR DA DESCRIÇÃO MUDOU AQUI

        return '  ' + styledCmd + styledArgs + styledDesc;
    }

    // Função para as linhas de descrição extra (alinhadas e com +4 espaços)
    function helpExtra(text) {
        return ' '.repeat(50) + clrDim(text); // <-- 50 espaços (46 + 4) e cor branca
    }

    // Função para alinhar os exemplos (Comando e Argumentos | Comentário)
    function helpExample(cmdArgs, comment) {
        // Como os comandos dos exemplos são muito longos, damos-lhes mais espaço
        const col1 = cmdArgs.padEnd(64);
        const styledCmd = clrDim(col1);
        const styledComment = clrGreen(comment); // Cor verde para os comentários/exemplos

        return '  ' + styledCmd + styledComment;
    }

    console.log('\n' + clrWhite('OPÇÕES DISPONÍVEIS:'));

    console.log(helpLine('--complete', '<dd/mm> [refeição]', 'marca como feito (fica verde). refeição = lunch ou dinner;'));
    console.log(helpExtra('sem refeição marca o almoço e o jantar desse dia'));

    console.log(helpLine('--undo', '<dd/mm> [refeição]', 'desmarca (mesma lógica do --complete)'));
    console.log(helpLine('--reset', '', 'apaga todas as refeições marcadas como feitas'));

    console.log(helpLine('--create', '"weekX | data | ..."', 'cria/atualiza semanas no meals_state.json.'));
    console.log(helpExtra('podes usar vários --create no mesmo comando.'));
    console.log(helpExtra('Uma semana com o mesmo nome é substituída; as outras ficam como estão.'));
    console.log(helpExtra('O separador de dias é o ' + clrCyan('|') + ', e a divisão lunch/dinner é o ' + clrCyan(';')));
    console.log(helpExtra('A data (dd/mm/yyyy) só é aceite na week1 e define o início do calendário.'));
    console.log(helpExtra('Com uma data no início ("04/12 | ...") altera só esse dia (e os seguintes, um por parte).'));
    console.log(helpExtra('Nesse modo, um lado vazio mantém o que lá estava e ' + clrCyan('-') + ' apaga essa refeição.'));

    console.log(helpLine('--edit', '"data | refeição | nome"', 'edita uma refeição específica.'));
    console.log(helpExtra('Se a refeição não existir, cria-a; se existir, substitui.'));
    console.log(helpExtra('Se usares ' + clrYellow('--edit') + ' sem argumentos, abre o modo interativo.'));

    console.log(helpLine('--help', '', 'mostra este menu de ajuda'));

    console.log('\n' + clrWhite('EXEMPLOS DE --complete e --undo:'));
    console.log(helpExample('node alone_time.js --complete 16/11 lunch', ''));
    console.log(helpExample('node alone_time.js --complete 16/11', ''));
    console.log(helpExample('node alone_time.js --undo 16/11 lunch', ''));
    console.log(helpExample('node alone_time.js --undo 16/11', ''));

    console.log('\n' + clrWhite('EXEMPLOS DE --create:'));
    console.log(helpExample('# Criar apenas a week1 (com data de início):', ''));
    console.log(helpExample('node alone_time.js --create "week1 | 16/11/2026 | cachorro; sopa | lasanha; sopa"', ''));
    console.log(helpExample('# Criar a week1 e a week2 ao mesmo tempo:', ''));
    console.log(helpExample('node alone_time.js --create "week1 | 16/11/2026 | cachorro; sopa" --create "week2 | massa; peixe"', ''));
    console.log(helpExample('# Mais tarde, juntar a week3 ao que já está guardado:', ''));
    console.log(helpExample('node alone_time.js --create "week3 | arroz; sopa | peixe; sopa"', ''));
    console.log(helpExample('# Alterar só um dia (almoço e jantar de 04/12):', ''));
    console.log(helpExample('node alone_time.js --create "04/12 | teste; teste"', ''));
    console.log(helpExample('node alone_time.js --create "04/12 | ; jantar nova"', '(só o jantar)'));
    console.log(helpExample('node alone_time.js --create "04/12 | -; -"', '(apaga o dia)'));

    console.log('\n' + clrWhite('EXEMPLOS DE --edit:'));
    console.log(helpExample('# Editar o almoço de 30/11 para "arroz de pato":', ''));
    console.log(helpExample('node alone_time.js --edit "30/11/2026 | lunch | arroz de pato"', ''));
    console.log(helpExample('# Editar vários dias ao mesmo tempo:', ''));
    console.log(helpExample('node alone_time.js --edit "30/11/2026 | lunch | frango" --edit "01/12/2026 | dinner | peixe"', ''));
    console.log(helpExample('# Apagar uma refeição (usar "-" como nome):', ''));
    console.log(helpExample('node alone_time.js --edit "30/11/2026 | dinner | -"', ''));
    console.log(helpExample('# Abrir o modo interativo (mostra a tabela só com dias preenchidos):', ''));
    console.log(helpExample('node alone_time.js --edit', ''));
    console.log()
}

function findDay(weeks, dateText) {
    const match = /^(\d{1,2})\/(\d{1,2})$/.exec(dateText ?? '')
    if (!match) throw new Error(`Data inválida "${dateText ?? ''}". Usa dd/mm (ex: 16/11).`)
    const day = Number(match[1])
    const month = Number(match[2])
    const foundDay = weeks.flatMap(function (week) { return week.days }).find(function (item) {
        return item.date.getDate() === day && item.date.getMonth() + 1 === month
    })
    if (!foundDay) throw new Error(`O dia ${dateText} não está em nenhuma semana do calendário.`)
    return foundDay
}

function applyMarkCommand(command, weeks, doneList, dateText, mealName) {
    const day = findDay(weeks, dateText)
    const normalizedMealName = mealName?.toLowerCase()

    if (normalizedMealName && !MEAL_KEYS.includes(normalizedMealName)) {
        throw new Error(`Refeição inválida "${mealName}". Usa ${MEAL_KEYS.join(' ou ')}.`)
    }

    const requestedMealKeys = normalizedMealName ? [normalizedMealName] : MEAL_KEYS
    const shortDate = formatShortDate(day.date)
    const mealLabel = normalizedMealName ?? 'refeições'

    if (command === '--complete') {
        const existingMealKeys = requestedMealKeys.filter(function (mealKey) {
            return formatMealText(day.dayMeals?.[mealKey]) !== '-'
        })
        if (existingMealKeys.length === 0) throw new Error(`${shortDate} não tem ${mealLabel} no calendário.`)
        for (const mealKey of existingMealKeys) markMealDone(doneList, day.date, mealKey)
        return `✔  ${shortDate} ${existingMealKeys.join(' + ')} marcado como feito.`
    }

    for (const mealKey of requestedMealKeys) unmarkMealDone(doneList, day.date, mealKey)
    return `↩  ${shortDate} ${requestedMealKeys.join(' + ')} desmarcado.`
}

// ============================================================================
// TABELA
// ============================================================================
function centerText(text, width) {
    const totalPadding = Math.max(0, width - text.length)
    const leftPadding = Math.floor(totalPadding / 2)
    return ' '.repeat(leftPadding) + text + ' '.repeat(totalPadding - leftPadding)
}

// Adicionado o parâmetro `onlyWithMeals` e `showWeekHeader`
function renderWeek(week, doneList, onlyWithMeals = false, showWeekHeader = false) {
    let days = week.days.map(function (day) {
        const cells = MEAL_COLUMNS.map(function (column) {
            const text = formatMealText(day.dayMeals?.[column.key])
            const hasMeal = text !== '-'
            return {
                text,
                hasMeal,
                isCompleted: hasMeal && isMealDone(doneList, day.date, column.key)
            }
        })
        return { weekdayName: day.weekdayName, dateText: formatShortDate(day.date), cells }
    })

    // Se for para filtrar, só mostra os dias que têm pelo menos 1 refeição
    if (onlyWithMeals) {
        days = days.filter(day => day.cells.some(cell => cell.hasMeal))
    }

    if (days.length === 0) return

    const dateWidth = 'dd/mm'.length + 2
    const labelWidth = Math.max(...WEEKDAY_NAMES.map(function (name) { return name.length })) + 2
    const columnWidths = MEAL_COLUMNS.map(function (column, columnIndex) {
        return Math.max(column.title.length, ...days.map(function (day) { return day.cells[columnIndex].text.length })) + 2
    })
    const tableWidth = dateWidth + labelWidth + columnWidths.reduce(function (sum, width) { return sum + width }, 0) + MEAL_COLUMNS.length

    // Barra da semana (Print #2)
    if (showWeekHeader) {
        const weekTitle = `${formatShortDate(week.monday)} - ${formatShortDate(addDays(week.monday, 6))}`
        console.log(clrPurple(centerText(weekTitle, tableWidth), { bg: true }))
    } else {
        const weekTitle = `${formatShortDate(week.monday)} - ${formatShortDate(addDays(week.monday, 6))}`
        console.log(clrPurple(centerText(weekTitle, tableWidth), { bg: true }))
        console.log()
    }

    const headerCells = MEAL_COLUMNS.map(function (column, columnIndex) {
        return clrPurple(centerText(column.title, columnWidths[columnIndex]), { bg: true })
    })
    console.log(' '.repeat(dateWidth + labelWidth + 1) + headerCells.join(' '))

    for (const day of days) {
        const dateLabel = clrBlue(centerText(day.dateText, dateWidth), { bg: true })
        const weekdayLabel = clrPurple(centerText(day.weekdayName, labelWidth), { bg: true })
        const cells = day.cells.map(function (cell, columnIndex) {
            const centered = centerText(cell.text, columnWidths[columnIndex])
            if (!cell.hasMeal) return clrDim(centered, { bg: true })
            if (cell.isCompleted) return clrGreen(centered, { bg: true })
            return clrRed(centered, { bg: true })
        })
        console.log(dateLabel + weekdayLabel + ' ' + cells.join(' '))
    }
}

// ============================================================================
// VERIFICAÇÃO DE CALENDÁRIO EXPIRADO
// ============================================================================
function getLastCalendarDay(startDate, weekList) {
    const weeks = buildWeeks(startDate, weekList)
    const lastWeek = weeks[weeks.length - 1]
    if (!lastWeek) return null
    const lastDay = [...lastWeek.days].reverse().find(function (day) { return day.dayMeals })
    if (!lastDay) return null
    const lastMealText = MEAL_KEYS
        .map(function (key) { return formatMealText(lastDay.dayMeals?.[key]) })
        .filter(function (text) { return text !== '-' })
        .pop() || '-'
    return { date: lastDay.date, meal: lastMealText }
}

function askYesNoKey(questionText) {
    return new Promise(function (resolve) {
        if (!(process.stdin.isTTY && process.stdout.isTTY && typeof process.stdin.setRawMode === 'function')) {
            return resolve(false)
        }
        process.stdout.write(questionText + ' ')
        process.stdin.setRawMode(true)
        process.stdin.setEncoding('utf8')
        process.stdin.resume()
        function onKey(ch) {
            const key = ch.toLowerCase()
            if (ch === '\x03') { // Ctrl+C
                process.stdout.write('\n')
                process.exit(130)
            }
            if (key === 'y' || key === 'n') {
                process.stdin.removeListener('data', onKey)
                process.stdin.setRawMode(false)
                process.stdin.pause()
                process.stdout.write('\r\x1b[K' + questionText + ' ' + (key === 'y' ? clrGreen('y') : clrRed('n')) + '\n')
                resolve(key === 'y')
            }
        }
        process.stdin.on('data', onKey)
    })
}

function resetCalendar(state) {
    state.startDate = null
    state.meals = []
    state.done = []
    saveState(state)
}

async function checkCalendarExpired(state) {
    const last = getLastCalendarDay(state.startDate, state.meals)
    if (!last) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const lastDate = new Date(last.date.getFullYear(), last.date.getMonth(), last.date.getDate())
    const expired = DEV_MODE || today > lastDate

    if (!expired) return null

    console.log()
    console.log(clrYellow(`⚠ O calendário terminou a ${formatShortDate(lastDate)} ("${last.meal}").`))
    if (DEV_MODE) console.log(clrDim('  (DEV_MODE ativo — a pergunta aparece sempre)'))
    console.log()

    const wantsReset = await askYesNoKey('Queres resetar o calendário? [y/n]')
    if (!wantsReset) {
        console.log()
        return null
    }

    resetCalendar(state)

    console.log()
    console.log(clrDim('Usa --create para criar o novo calendário.'))
    console.log()

    return { message: '🗑 Calendário resetado. As refeições e as marcações foram apagadas.' }
}

function parseArguments() {
    const args = process.argv.slice(2)
    const parsed = {
        command: null,
        dateText: null,
        mealName: null,
        createRawList: null,
        editRawList: null,
        isInteractiveEdit: false
    }

    if (args.length === 0) return parsed

    if (args.includes('--create')) {
        parsed.command = '--create'
        const createArgs = []
        let currentCreate = []

        for (let i = 0; i < args.length; i++) {
            if (args[i] === '--create') {
                if (currentCreate.length > 0) createArgs.push(currentCreate.join(' '))
                currentCreate = []
            } else if (args[i].startsWith('--')) {
                continue
            } else {
                currentCreate.push(args[i])
            }
        }
        if (currentCreate.length > 0) createArgs.push(currentCreate.join(' '))

        parsed.createRawList = createArgs
    } else if (args.includes('--edit')) {
        parsed.command = '--edit'

        // Se for só `--edit` sem mais nada, ativa o modo interativo
        if (args.length === 1) {
            parsed.isInteractiveEdit = true
            return parsed
        }

        const editArgs = []
        let currentEdit = []

        for (let i = 0; i < args.length; i++) {
            if (args[i] === '--edit') {
                if (currentEdit.length > 0) editArgs.push(currentEdit.join(' '))
                currentEdit = []
            } else if (args[i].startsWith('--')) {
                continue
            } else {
                currentEdit.push(args[i])
            }
        }
        if (currentEdit.length > 0) editArgs.push(currentEdit.join(' '))

        parsed.editRawList = editArgs
    } else if (args[0] === '--complete' || args[0] === '--undo') {
        parsed.command = args[0]
        parsed.dateText = args[1] || null
        parsed.mealName = args[2] || null
    } else if (args[0] === '--help' || args[0] === '--reset') {
        parsed.command = args[0]
    } else {
        parsed.command = '--unknown'
        parsed.dateText = args[0]
    }

    return parsed
}

// ============================================================================
// CRIAR CALENDÁRIO (--create)
// ============================================================================
const DATE_LIKE_PATTERN = /^\d[\d/]*$/
const DAY_DATE_PATTERN = /^\d{1,2}\/\d{1,2}(\/\d{4})?$/

function parseDayText(dayText) {
    const mealParts = dayText.split(';').map(function (part) { return part.trim() })
    return { lunch: mealParts[0] || '', dinner: mealParts[1] || '' }
}

function parseDayDate(dateText, startDate) {
    const parts = dateText.split('/').map(Number)
    if (parts.length === 3) return parseDate(dateText)
    if (parts.length !== 2 || parts.some(Number.isNaN)) {
        throw new Error(`Data inválida "${dateText}". Usa dd/mm ou dd/mm/yyyy.`)
    }
    const [day, month] = parts
    const dateInStartYear = new Date(startDate.getFullYear(), month - 1, day)
    if (dateInStartYear >= startDate) return dateInStartYear

    const dateInNextYear = new Date(startDate.getFullYear() + 1, month - 1, day)
    const millisecondsPerDay = 24 * 60 * 60 * 1000
    const daysAfterStart = (dateInNextYear - startDate) / millisecondsPerDay
    return daysAfterStart <= 60 ? dateInNextYear : dateInStartYear
}

function setDayMeals(weeksByName, startDate, date, dayMeals) {
    if (date < startDate) {
        throw new Error(`${formatShortDate(date)} é antes do início do calendário (${formatShortDate(startDate)}).`)
    }

    const millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000
    const weekIndex = Math.round((getMondayOfWeek(date) - getMondayOfWeek(startDate)) / millisecondsPerWeek)
    const firstDayOffset = weekIndex === 0 ? getWeekdayIndex(startDate) : 0
    const dayIndex = getWeekdayIndex(date) - firstDayOffset

    for (let index = 0; index <= weekIndex; index++) {
        const weekName = `week${index + 1}`
        if (!weeksByName.has(weekName)) weeksByName.set(weekName, { name: weekName, meals: [] })
    }

    const week = weeksByName.get(`week${weekIndex + 1}`)
    while (week.meals.length <= dayIndex) week.meals.push({ lunch: '', dinner: '' })

    for (const mealKey of MEAL_KEYS) {
        const newText = dayMeals[mealKey]
        if (!newText) continue
        week.meals[dayIndex][mealKey] = newText === '-' ? '' : newText
    }
}

function createCalendar(rawArgumentList) {
    const state = loadState()
    const weeksByName = new Map(state.meals.map(function (week) { return [week.name, week] }))

    for (const rawArgument of rawArgumentList) {
        const parts = rawArgument.split('|').map(function (part) { return part.trim() })

        if (parts.length < 2) {
            throw new Error('Formato inválido. Usa: "week1 | [16/11/2026] | lunch; dinner" ou "04/12 | lunch; dinner"')
        }

        if (DAY_DATE_PATTERN.test(parts[0])) {
            if (!state.startDate) {
                throw new Error('Cria primeiro a week1 (com data de início) antes de alterar um dia.')
            }
            const startDate = parseDate(state.startDate)
            const firstDate = parseDayDate(parts[0], startDate)

            if (parts.length === 2 && (parts[1].toLowerCase() === 'remove' || parts[1] === '-')) {
                const millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000
                const weekIndex = Math.round((getMondayOfWeek(firstDate) - getMondayOfWeek(startDate)) / millisecondsPerWeek)
                const firstDayOffset = weekIndex === 0 ? getWeekdayIndex(startDate) : 0
                const dayIndex = getWeekdayIndex(firstDate) - firstDayOffset

                const week = weeksByName.get(`week${weekIndex + 1}`)
                if (week && week.meals[dayIndex]) {
                    week.meals[dayIndex] = { lunch: '', dinner: '' }
                }
            } else {
                parts.slice(1).forEach(function (dayText, dayOffset) {
                    setDayMeals(weeksByName, startDate, addDays(firstDate, dayOffset), parseDayText(dayText))
                })
            }
            continue
        }

        const weekName = parts[0].toLowerCase()
        const weekMatch = /^week(\d+)$/.exec(weekName)
        if (!weekMatch) {
            throw new Error(`Nome inválido "${parts[0]}". Usa week1, week2, week3, etc. ou uma data (ex: 04/12).`)
        }
        const weekNumber = parseInt(weekMatch[1], 10)

        const hasDate = DATE_LIKE_PATTERN.test(parts[1])
        const dateText = hasDate ? parts[1] : null
        const dayTexts = hasDate ? parts.slice(2) : parts.slice(1)

        if (dateText && weekNumber !== 1) {
            throw new Error(`Só a week1 leva data de início (recebi "${dateText}" na ${weekName}).`)
        }
        if (dateText) state.startDate = formatFullDate(parseDate(dateText))

        if (weekNumber === 1 && !state.startDate) {
            throw new Error(`A week1 precisa de uma data de início (ex: "week1 | 16/11/2026 | ...").`)
        }
        if (dayTexts.length === 0) {
            throw new Error(`A ${weekName} não tem nenhum dia.`)
        }

        weeksByName.set(weekName, { name: weekName, meals: dayTexts.map(parseDayText) })
    }

    const sortedWeeks = [...weeksByName.values()].sort(function (a, b) {
        return Number(a.name.slice(4)) - Number(b.name.slice(4))
    })
    sortedWeeks.forEach(function (week, weekIndex) {
        if (week.name !== `week${weekIndex + 1}`) {
            throw new Error(`Falta a week${weekIndex + 1} (as semanas têm de ser seguidas: week1, week2, ...).`)
        }
    })
    state.meals = sortedWeeks

    const weeks = buildWeeks(state.startDate, state.meals)
    saveState(state)

    console.log()
    console.log(clrGreen(`✔ ${rawArgumentList.length} alteração(ões) guardada(s) em ${path.basename(STATE_FILE)}.`))
    console.log()

    for (const week of weeks) {
        renderWeek(week, state.done)
        console.log()
    }
}

// ============================================================================
// EDITAR REFEIÇÃO (--edit)
// ============================================================================
function editMeal(rawArgumentList) {
    const state = loadState()

    if (!state.startDate) {
        throw new Error('Cria primeiro a week1 (com data de início) antes de editar uma refeição.')
    }

    const startDate = parseDate(state.startDate)
    const weeksByName = new Map(state.meals.map(function (week) { return [week.name, week] }))

    for (const rawArgument of rawArgumentList) {
        const parts = rawArgument.split('|').map(function (part) { return part.trim() })

        if (parts.length < 3) {
            throw new Error('Formato inválido. Usa: "dd/mm/yyyy | lunch/dinner | nome da refeição"')
        }

        const dateText = parts[0]
        const mealType = parts[1].toLowerCase()
        const mealText = parts.slice(2).join('|').trim()

        if (!MEAL_KEYS.includes(mealType)) {
            throw new Error(`Tipo de refeição inválido "${parts[1]}". Usa ${MEAL_KEYS.join(' ou ')}.`)
        }

        const date = parseDayDate(dateText, startDate)
        if (date < startDate) {
            throw new Error(`${formatShortDate(date)} é antes do início do calendário (${formatShortDate(startDate)}).`)
        }

        const millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000
        const weekIndex = Math.round((getMondayOfWeek(date) - getMondayOfWeek(startDate)) / millisecondsPerWeek)
        const firstDayOffset = weekIndex === 0 ? getWeekdayIndex(startDate) : 0
        const dayIndex = getWeekdayIndex(date) - firstDayOffset

        for (let index = 0; index <= weekIndex; index++) {
            const weekName = `week${index + 1}`
            if (!weeksByName.has(weekName)) weeksByName.set(weekName, { name: weekName, meals: [] })
        }

        const week = weeksByName.get(`week${weekIndex + 1}`)
        while (week.meals.length <= dayIndex) week.meals.push({ lunch: '', dinner: '' })

        if (mealText === '-') {
            week.meals[dayIndex][mealType] = ''
            console.log()
            console.log(clrYellow(`🗑 ${formatShortDate(date)} ${mealType} apagado.`))
        } else {
            week.meals[dayIndex][mealType] = mealText
            console.log()
            console.log(clrGreen(`✔ ${formatShortDate(date)} ${mealType} atualizado para "${mealText}".`))
        }
    }

    const sortedWeeks = [...weeksByName.values()].sort(function (a, b) {
        return Number(a.name.slice(4)) - Number(b.name.slice(4))
    })
    sortedWeeks.forEach(function (week, weekIndex) {
        if (week.name !== `week${weekIndex + 1}`) {
            throw new Error(`Falta a week${weekIndex + 1} (as semanas têm de ser seguidas: week1, week2, ...).`)
        }
    })
    state.meals = sortedWeeks

    const weeks = buildWeeks(state.startDate, state.meals)
    saveState(state)

    console.log()
    for (const week of weeks) {
        renderWeek(week, state.done)
        console.log()
    }
}

// ============================================================================
// MODO INTERATIVO DE EDIÇÃO
// ============================================================================
async function interactiveEdit() {
    const state = loadState()

    if (!state.startDate || state.meals.length === 0) {
        console.log()
        console.log(clrYellow(`⚠ O calendário está vazio. Usa --create para o criar primeiro.`))
        console.log()
        return
    }

    const weeks = buildWeeks(state.startDate, state.meals)

    console.log()
    for (const week of weeks) {
        renderWeek(week, state.done, true, true)
        console.log()
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true
    })

    console.log(clrDim('  (Prime Enter sem escrever nada, ou Ctrl+D, para cancelar)'))
    console.log()

    let isExiting = false
    let answerReceived = false

    function cancelAndExit() {
        if (isExiting) return
        isExiting = true

        console.log() 
        console.log(clrDim('Edição cancelada.'))
        console.log()
        for (const week of weeks) {
            renderWeek(week, state.done)
            console.log()
        }
        rl.close()
        process.exit(0)
    }

    rl.on('SIGINT', () => {
        console.log('') 
        cancelAndExit()
    })

    rl.on('close', () => {
        // Só cancela se o utilizador não tiver submetido uma resposta
        if (!isExiting && !answerReceived) {
            console.log('') 
            cancelAndExit()
        }
    })

    const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve))

    try {
        const answer = await askQuestion(clrYellow('editar aqui: '))
        
        // Se o utilizador pressionou Enter sem escrever nada
        if (!answer || !answer.trim()) {
            console.log('\n') 
            cancelAndExit()
        }

        // Se chegou aqui, o utilizador escreveu algo e deu Enter
        answerReceived = true
        rl.close()

        const rawArg = answer.trim()
        
        let finalArg = rawArg
        if (/^\d{1,2}\/\d{1,2}\s*\|/.test(rawArg)) {
            const startDate = parseDate(state.startDate)
            const match = /^(\d{1,2}\/\d{1,2})(.*)$/.exec(rawArg)
            if (match) {
                const d = match[1]
                const rest = match[2]
                const dateStr = `${d}/${startDate.getFullYear()}`
                finalArg = `${dateStr}${rest}`
            }
        }

        // Chama a função de edição normal
        editMeal([finalArg])

    } catch (error) {
        // Se o readline fechar abruptamente (ex: Ctrl+D)
        if (!isExiting && !answerReceived) {
            console.log('') 
            cancelAndExit()
        }
        throw error
    }
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
    const args = parseArguments()

    if (args.command === '--help') return printHelp()

    if (args.command === '--create') {
        if (!args.createRawList || args.createRawList.length === 0) {
            throw new Error('Falta o argumento. Usa: node alone_time.js --create "week1 | 16/11/2026 | lunch; dinner"')
        }
        return createCalendar(args.createRawList)
    }

    if (args.command === '--edit') {
        if (args.isInteractiveEdit) {
            return interactiveEdit()
        }
        if (!args.editRawList || args.editRawList.length === 0) {
            throw new Error('Falta o argumento. Usa: node alone_time.js --edit "30/11/2026 | lunch | arroz de pato"')
        }
        return editMeal(args.editRawList)
    }

    if (args.command === '--unknown') {
        throw new Error(`Argumento desconhecido "${args.dateText}". Usa --help para ver as opções.`)
    }

    const state = loadState()
    const completedMeals = state.done

    if (state.meals.length === 0 && args.command !== '--reset') {
        console.log()
        console.log(clrYellow(`⚠ O calendário está vazio. Usa --create para o criar (vê --help).`))
        console.log()
        return
    }

    const weeks = buildWeeks(state.startDate, state.meals)
    let message = null

    const expiredResult = await checkCalendarExpired(state)
    if (expiredResult) {
        console.log(clrGreen(expiredResult.message))
        console.log()
        return
    }

    if (args.command === '--reset') {
        state.done = []
        saveState(state)
        message = '🗑 Todas as refeições marcadas foram apagadas.'
    } else if (args.command === '--complete' || args.command === '--undo') {
        message = applyMarkCommand(args.command, weeks, completedMeals, args.dateText, args.mealName)
        saveState(state)
    }

    console.log()
    if (message) {
        console.log(clrGreen(message))
        console.log()
    }
    for (const week of weeks) {
        renderWeek(week, completedMeals)
        console.log()
    }
}

main().catch(function (error) {
    console.log('\n' + clrRed(error.message) + '\n')
    process.exitCode = 1
})
