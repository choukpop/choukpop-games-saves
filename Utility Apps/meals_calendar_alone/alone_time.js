
/**
 * meal_calendar.js — calendário de refeições no terminal (semana a semana, segunda a domingo)
 * node meal_calendar.js
 * node meal_calendar.js --help
 */
'use strict'

const fs = require('fs')
const path = require('path')
const util = require('util')

// ============================================================================
// BASE DE DADOS
// ============================================================================
// Dia em que começam as refeições (dd/mm/yyyy). Tudo o resto é calculado a partir daqui.
const MEALS_START_DATE = '16/11/2026'

// Cada semana tem uma lista de dias seguidos (começando no MEALS_START_DATE).
// A semana 1 começa no dia acima e vai até domingo no máximo; as seguintes começam sempre numa segunda.
// Cada dia tem lunch e dinner (texto). Sem valor aparece "-" e a célula fica cinzenta.
const MEALS = [
    {
        name: 'week1',
        meals: [
            { lunch: 'cachorro', dinner: 'sopa' },
            { lunch: 'frango, arroz', dinner: 'sopa' },
            { lunch: 'lasanha', dinner: 'sopa' },
            { lunch: 'cachorro', dinner: 'sopa' },
            { lunch: 'cachorro', dinner: 'leite cereais' }
        ]
    }
    // Exemplo de semana seguinte (descomenta para adicionar):
    // {
    //     name: 'week2',
    //     meals: [
    //         { lunch: 'massa', dinner: 'sopa' },
    //         { lunch: 'peixe', dinner: '' }
    //     ]
    // }
]

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
// Converte uma cor hexadecimal (#rrggbb) para um array [r, g, b]
function hexToRgb(hex) {
    const h = hex.replace('#', '')
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

// Calcula a luminância relativa de uma cor (0 = preto, 1 = branco). Usado para contraste.
function getLuminance(hex) {
    const [r, g, b] = hexToRgb(hex).map(function (v) {
        const s = v / 255
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// Devolve '#ffffff' se o fundo for escuro, '#000000' se for claro
function getContrastText(bgHex, threshold = 0.5) {
    return getLuminance(bgHex) < threshold ? '#ffffff' : '#000000'
}

// Função central de aplicação de cores e estilos (aceita arrays ou objetos)
// c({ bg: '#800080', fg: '#ffffff', styles: ['bold'] }, text)  -> fg explícito
// c({ bg: '#800080', styles: ['bold'] }, text)                -> fg automático (contraste)
// c(['bgMagenta', 'white', 'bold'], text)                     -> forma antiga, continua a funcionar
// c('#ff0000', text)                                          -> só letra
function c(format, text) {
    if (!process.stdout.isTTY) return text

    // Forma objeto: { bg, fg, styles }
    if (format && typeof format === 'object' && !Array.isArray(format)) {
        const { bg, fg, styles = [] } = format
        const effectiveFg = fg ?? (bg ? getContrastText(bg) : null)
        const fgStyles = effectiveFg ? [effectiveFg, ...styles] : styles
        const styled = util.styleText(fgStyles.length ? fgStyles : ['reset'], text)
        if (!bg) return styled
        const [r, g, b] = hexToRgb(bg)
        return `\x1b[48;2;${r};${g};${b}m${styled}\x1b[0m`
    }

    // Forma antiga (array / string)
    return util.styleText(format, text)
}

// Função auxiliar para cores: por defeito aplica só na letra (foreground), com { bg: true } aplica no fundo.
function color(hex, text, options = {}) {
    const { bg = false, styles = ['bold'] } = options
    if (!process.stdout.isTTY) return text
    if (bg) return c({ bg: hex, styles }, text)
    return c([hex, ...styles], text)
}

// CHANGE COLORS
function clrWhite(text, options) { return color('#ffffff', text, options) }
// CHANGE COLORS
function clrGreen(text, options) { return color('#4caf50', text, options) }
// CHANGE COLORS
function clrRed(text, options) { return color('#f44336', text, options) }
// CHANGE COLORS
function clrDim(text, options) { return color('#888888', text, options) }
// CHANGE COLORS
function clrCyan(text, options) { return color('#00bcd4', text, options) }
// CHANGE COLORS
function clrYellow(text, options) { return color('#ffeb3b', text, options) }
// CHANGE COLORS
function clrBlue(text, options) { return color('#2196f3', text, options) }
// CHANGE COLORS
function clrPurple(text, options) { return color('#9c27b0', text, options) }
// CHANGE COLORS
function noColor(text) { return text }

// ============================================================================
// DATAS
// ============================================================================
// Converte uma string 'dd/mm/yyyy' num objeto Date. Valida o formato e avisa se for inválido.
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

// Normaliza qualquer entrada (Date, timestamp ou string) para um objeto Date válido.
function toDate(value) {
    if (value instanceof Date) return value
    if (typeof value === 'number') return new Date(value)
    return parseDate(value)
}

// Adiciona (ou subtrai, se for negativo) uma quantidade de dias a uma data.
function addDays(date, amount) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount)
}

// Devolve o índice do dia da semana, onde 0 = Segunda-feira e 6 = Domingo.
function getWeekdayIndex(date) {
    return (date.getDay() + 6) % 7
}

// Descobre a data da Segunda-feira da semana em que a data fornecida se encontra.
function getMondayOfWeek(date) {
    return addDays(date, -getWeekdayIndex(date))
}

// Formata uma data para o formato curto 'dd/mm'.
function formatShortDate(date) {
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
}

// Formata uma data para o formato completo 'dd/mm/yyyy'.
function formatFullDate(date) {
    return `${formatShortDate(date)}/${date.getFullYear()}`
}

// ============================================================================
// SEMANAS
// ============================================================================
// Formata o texto de uma refeição, devolvendo '-' se estiver vazio.
function formatMealText(value) {
    return String(value ?? '').trim() || '-'
}

// Constrói a estrutura de semanas com as datas correspondentes e associa as refeições do MEALS.
function buildWeeks(startDate) {
    startDate = toDate(startDate)   // normaliza aqui

    const firstMonday = getMondayOfWeek(startDate)
    return MEALS.map(function (week, weekIndex) {
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
// ESTADO (refeições feitas, guardadas no meals_state.json)
// ============================================================================
// Cria a chave única de uma refeição (data + tipo).
function getMealKey(date, mealKey) {
    return `${formatFullDate(date)}|${mealKey}`
}

// Lê o ficheiro meals_state.json e devolve um Set com as refeições que já foram marcadas como feitas.
function loadCompletedMeals() {
    if (!fs.existsSync(STATE_FILE)) return new Set()
    try {
        const completedList = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
        if (!Array.isArray(completedList)) throw new Error('o ficheiro devia conter uma lista')
        return new Set(completedList)
    } catch (error) {
        throw new Error(`Não consegui ler ${path.basename(STATE_FILE)}: ${error.message}`)
    }
}

// Guarda o estado atual das refeições feitas no ficheiro meals_state.json.
function saveCompletedMeals(completedMeals) {
    fs.writeFileSync(STATE_FILE, JSON.stringify([...completedMeals], null, 2) + '\n')
}

// ============================================================================
// ARGUMENTOS
// ============================================================================
// Imprime o menu de ajuda no terminal com as opções disponíveis.
function printHelp() {
    // CHANGE COLORS
    console.log('\n' + clrWhite('OPÇÕES DISPONÍVEIS:'))
    // CHANGE COLORS
    console.log('  ' + clrYellow('--complete') + ' ' + clrDim('<dd/mm> [refeição]') + '  = marca como feito (fica verde). refeição = lunch ou dinner;')
    // CHANGE COLORS
    console.log('                                       sem refeição marca o almoço e o jantar desse dia')
    // CHANGE COLORS
    console.log('  ' + clrYellow('--undo') + ' ' + clrDim('<dd/mm> [refeição]') + '      = desmarca (mesma lógica do --complete)')
    // CHANGE COLORS
    console.log('  ' + clrYellow('--reset') + '                        = apaga todas as refeições marcadas como feitas')
    // CHANGE COLORS
    console.log('  ' + clrYellow('--create') + ' ' + clrDim('"weekX | data | ..."') + ' = cria uma nova semana formatada para copiares para o MEALS.')
    // CHANGE COLORS
    console.log('                                       podes usar vários --create no mesmo comando.')
    // CHANGE COLORS
    console.log('                                       O separador de dias é o ' + clrCyan('|') + ', e a divisão lunch/dinner é o ' + clrCyan(';'))
    // CHANGE COLORS
    console.log('                                       A data só é obrigatória na week1.')
    // CHANGE COLORS
    console.log('  ' + clrYellow('--help') + '                         = mostra este menu de ajuda')
    // CHANGE COLORS
    console.log('\n' + clrWhite('EXEMPLOS:'))
    // CHANGE COLORS
    console.log('  ' + clrDim('node alone_time.js --complete 16/11 lunch'))
    console.log('  ' + clrDim('node alone_time.js --undo 16/11 lunch'))
    // CHANGE COLORS
    console.log('\n  ' + clrDim('# Criar apenas a week1 (com data):'))
    // CHANGE COLORS
    console.log('  ' + clrDim('node alone_time.js --create "week1 | 16/11/2026 | cachorro; sopa | lasanha; sopa"'))
    // CHANGE COLORS
    console.log('\n  ' + clrDim('# Criar a week1 e a week2 ao mesmo tempo (a week2 já não precisa de data):'))
    // CHANGE COLORS
    console.log('  ' + clrDim('node alone_time.js --create "week1 | 16/11/2026 | cachorro; sopa" --create "week2 | massa; peixe"'))
    console.log()
}

// Procura um dia específico (dd/mm) dentro de todas as semanas do calendário.
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

// Aplica o comando de marcar (--complete) ou desmarcar (--undo) refeições no estado.
function applyMarkCommand(command, weeks, completedMeals, dateText, mealName) {
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
        for (const mealKey of existingMealKeys) completedMeals.add(getMealKey(day.date, mealKey))
        return `✔  ${shortDate} ${existingMealKeys.join(' + ')} marcado como feito.`
    }

    for (const mealKey of requestedMealKeys) completedMeals.delete(getMealKey(day.date, mealKey))
    return `↩  ${shortDate} ${requestedMealKeys.join(' + ')} desmarcado.`
}

// ============================================================================
// TABELA
// ============================================================================
// Centra um texto dentro de uma largura específica adicionando espaços à esquerda e à direita.
function centerText(text, width) {
    const totalPadding = Math.max(0, width - text.length)
    const leftPadding = Math.floor(totalPadding / 2)
    return ' '.repeat(leftPadding) + text + ' '.repeat(totalPadding - leftPadding)
}

// Desenha a tabela de uma semana inteira no terminal, aplicando as cores consoante o estado das refeições.
function renderWeek(week, completedMeals) {
    const days = week.days.map(function (day) {
        const cells = MEAL_COLUMNS.map(function (column) {
            const text = formatMealText(day.dayMeals?.[column.key])
            const hasMeal = text !== '-'
            return { text, hasMeal, isCompleted: hasMeal && completedMeals.has(getMealKey(day.date, column.key)) }
        })
        return { weekdayName: day.weekdayName, dateText: formatShortDate(day.date), cells }
    })

    const dateWidth = 'dd/mm'.length + 2
    const labelWidth = Math.max(...WEEKDAY_NAMES.map(function (name) { return name.length })) + 2
    const columnWidths = MEAL_COLUMNS.map(function (column, columnIndex) {
        return Math.max(column.title.length, ...days.map(function (day) { return day.cells[columnIndex].text.length })) + 2
    })
    const tableWidth = dateWidth + labelWidth + columnWidths.reduce(function (sum, width) { return sum + width }, 0) + MEAL_COLUMNS.length

    const weekTitle = `${formatShortDate(week.monday)} - ${formatShortDate(addDays(week.monday, 6))}`
    // CHANGE COLORS
    console.log(clrPurple(centerText(weekTitle, tableWidth), { bg: true }))
    console.log()

    // CHANGE COLORS
    const headerCells = MEAL_COLUMNS.map(function (column, columnIndex) {
        return clrPurple(centerText(column.title, columnWidths[columnIndex]), { bg: true })
    })
    console.log(' '.repeat(dateWidth + labelWidth + 1) + headerCells.join(' '))

    for (const day of days) {
        // CHANGE COLORS
        const dateLabel = clrBlue(centerText(day.dateText, dateWidth), { bg: true })
        // CHANGE COLORS
        const weekdayLabel = clrPurple(centerText(day.weekdayName, labelWidth), { bg: true })
        const cells = day.cells.map(function (cell, columnIndex) {
            const centered = centerText(cell.text, columnWidths[columnIndex])
            // CHANGE COLORS
            if (!cell.hasMeal) return clrDim(centered, { bg: true })
            // CHANGE COLORS
            if (cell.isCompleted) return clrGreen(centered, { bg: true })
            // CHANGE COLORS
            return clrRed(centered, { bg: true })
        })
        console.log(dateLabel + weekdayLabel + ' ' + cells.join(' '))
    }
}

// ============================================================================
// VERIFICAÇÃO DE CALENDÁRIO EXPIRADO
// ============================================================================
// Obtém o último dia do calendário definido no MEALS (último dia da última semana).
function getLastCalendarDay(startDate) {
    const weeks = buildWeeks(startDate)   // buildWeeks já normaliza
    const lastWeek = weeks[weeks.length - 1]
    const lastDay = [...lastWeek.days].reverse().find(function (day) { return day.dayMeals })
    if (!lastDay) return null
    const lastMealText = MEAL_KEYS
        .map(function (key) { return formatMealText(lastDay.dayMeals?.[key]) })
        .filter(function (text) { return text !== '-' })
        .pop() || '-'
    return { date: lastDay.date, meal: lastMealText }
}

// Pergunta y/n ao utilizador (basta premir a tecla, sem Enter).
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
                // CHANGE COLORS
                process.stdout.write('\r\x1b[K' + questionText + ' ' + (key === 'y' ? clrGreen('y') : clrRed('n')) + '\n')
                resolve(key === 'y')
            }
        }
        process.stdin.on('data', onKey)
    })
}

// Limpa as refeições marcadas como feitas (reset ao estado).
function resetCalendar(completedMeals) {
    completedMeals.clear()
    saveCompletedMeals(completedMeals)
    return '🗑 Calendário resetado. As refeições marcadas foram apagadas.'
}

// Verifica se a data de hoje já ultrapassou o último dia do calendário. Se sim, pergunta se quer resetar.
async function checkCalendarExpired(startDate, completedMeals) {
    const last = getLastCalendarDay(startDate)
    if (!last) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const lastDate = new Date(last.date.getFullYear(), last.date.getMonth(), last.date.getDate())
    const expired = DEV_MODE || today > lastDate

    if (!expired) return null

    console.log()
    // CHANGE COLORS
    console.log(clrYellow(`⚠ O calendário terminou a ${formatShortDate(lastDate)} ("${last.meal}").`))
    // CHANGE COLORS
    if (DEV_MODE) console.log(clrDim('  (DEV_MODE ativo — a pergunta aparece sempre)'))
    console.log()

    const wantsReset = await askYesNoKey('Queres resetar o calendário? [y/n]')
    if (!wantsReset) {
        console.log()
        return null
    }

    resetCalendar(completedMeals)

    // CHANGE COLORS
    console.log(clrDim('Agora edita a variável const MEALS no ficheiro para o novo calendário.'))

    return { message: '🗑 Calendário resetado. As refeições marcadas foram apagadas.' }
}

// Lê e organiza os argumentos passados na linha de comandos.
function parseArguments() {
    const args = process.argv.slice(2)
    const parsed = {
        command: null,
        dateText: null,
        mealName: null,
        createRawList: null // Agora guardamos uma lista de comandos --create
    }

    // Se não houver argumentos, corre o script normal (mostra o calendário)
    if (args.length === 0) return parsed

    // Se o comando --create estiver presente
    if (args.includes('--create')) {
        parsed.command = '--create'
        const createArgs = []
        let currentCreate = []

        for (let i = 0; i < args.length; i++) {
            if (args[i] === '--create') {
                if (currentCreate.length > 0) createArgs.push(currentCreate.join(' '))
                currentCreate = []
            } else if (args[i].startsWith('--')) {
                // Se aparecer outra flag desconhecida, ignoramos no --create
                continue
            } else {
                currentCreate.push(args[i])
            }
        }
        if (currentCreate.length > 0) createArgs.push(currentCreate.join(' '))

        parsed.createRawList = createArgs
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
// Cria uma ou mais semanas no formato JSON a partir de strings, mostra o preview e imprime o bloco final.
async function createCalendar(rawArgumentList) {
    const finalWeeks = []
    
    // 1. Processa cada argumento --create que foi passado
    for (const rawArgument of rawArgumentList) {
        // Separa por '|' e limpa os espaços em branco
        let parts = rawArgument.split('|').map(function (p) { return p.trim() })

        if (parts.length < 2) {
            throw new Error('Formato inválido. Usa: "week1 | [16/11/2026] | lunch; dinner | lunch; dinner"')
        }

        const weekName = parts[0].toLowerCase()
        
        // Verifica se a segunda parte é uma data (se tiver barras)
        let dateText = null
        let daysData = []
        
        if (parts[1].includes('/')) {
            // Tem data
            dateText = parts[1]
            daysData = parts.slice(2)
        } else {
            // Não tem data, então o daysData começa logo no índice 1
            daysData = parts.slice(1)
        }

        // Extrai o número da semana (ex: 'week2' -> 2)
        const weekMatch = /^week(\d+)$/.exec(weekName)
        if (!weekMatch) {
            throw new Error(`Nome de semana inválido "${parts[0]}". Usa week1, week2, week3, etc.`)
        }
        const weekNumber = parseInt(weekMatch[1], 10)

        // Se for a week1 e não tiver data, dá erro (a week1 precisa sempre de data)
        if (weekNumber === 1 && !dateText) {
            throw new Error(`A week1 precisa sempre de uma data de início (ex: "week1 | 16/11/2026 | ...").`)
        }

        // Se não tiver data (e não for a week1), usa o MEALS_START_DATE para calcular a data certa
        const startDateForWeek = dateText ? parseDate(dateText) : parseDate(MEALS_START_DATE)

        // Calcula quantos dias cabem nesta semana
        let maxDays = 7
        if (weekNumber === 1) {
            const offset = getWeekdayIndex(startDateForWeek)
            maxDays = 7 - offset
        }

        // Verifica se ultrapassou o limite de dias
        if (daysData.length > maxDays) {
            throw new Error(`A ${weekName} tem ${daysData.length} dias, mas só cabem ${maxDays} dias nesta semana.`)
        }

        // Constrói o array de meals
        const meals = daysData.map(function (dayStr) {
            const mealParts = dayStr.split(';').map(function (m) { return m.trim() })
            return {
                lunch: mealParts[0] || '',
                dinner: mealParts[1] || ''
            }
        })

        finalWeeks.push({
            name: weekName,
            meals: meals,
            dateText: dateText, // Pode ser null se não foi fornecida
            weekNumber: weekNumber
        })
    }

    // Ordena as semanas por número (week1, week2, etc.)
    finalWeeks.sort(function (a, b) {
        return a.weekNumber - b.weekNumber
    })

    console.log()
    // CHANGE COLORS
    console.log(clrGreen(`✔ ${finalWeeks.length} semana(s) gerada(s) com sucesso!`))
    console.log()

    // 2. PREVIEW NO TERMINAL
    // CHANGE COLORS
    console.log(clrCyan('PREVIEW:'))
    
    // Descobre a primeira segunda-feira do calendário base (usando a data base do ficheiro)
    const baseStartDate = parseDate(MEALS_START_DATE)
    const firstMonday = getMondayOfWeek(baseStartDate)
    
    for (const week of finalWeeks) {
        if (week.weekNumber === 1) {
            // CHANGE COLORS
            console.log(clrDim(`  ⚠ Atualiza o MEALS_START_DATE para '${week.dateText}'`))
        }
        
        // Cria uma cópia temporária do MEALS para o renderWeek conseguir ler a semana
        const originalMeals = MEALS.slice()
        MEALS.length = 0
        MEALS.push({ name: week.name, meals: week.meals })
        
        // 1. Descobre a data exata em que esta semana começa
        let previewStartDate
        if (week.weekNumber === 1 && week.dateText) {
            previewStartDate = parseDate(week.dateText)
        } else {
            // Se for week2, week3, etc., calcula a segunda-feira correspondente (primeira segunda + (semana - 1) * 7)
            previewStartDate = addDays(firstMonday, (week.weekNumber - 1) * 7)
        }
        
        // 2. Gera as semanas temporárias com a data correta
        const previewWeeks = buildWeeks(previewStartDate)
        
        // 3. Renderiza a tabela bonita da semana
        renderWeek(previewWeeks[0], new Set()) 
        
        // Restaura o MEALS original
        MEALS.length = 0
        MEALS.push(...originalMeals)
        console.log()
    }

    // 3. GERA O JSON FINAL PARA COPIAR
    // CHANGE COLORS
    console.log(clrCyan('Copia e cola isto para substituir o teu const MEALS:'))
    console.log()

    let finalString = ''

    for (let i = 0; i < finalWeeks.length; i++) {
        const week = finalWeeks[i]

        // Gera o formato exato do ficheiro (uma refeição por linha, indentada)
        const mealsLines = week.meals.map(function (m) {
            return `            { lunch: '${m.lunch}', dinner: '${m.dinner}' }`
        }).join(',\n')

        // Monta o objeto da semana
        finalString += `    {
        name: '${week.name}',
        meals: [
${mealsLines}
        ]
    }`

        // Adiciona a vírgula entre as semanas, mas não na última
        if (i < finalWeeks.length - 1) {
            finalString += ',\n'
        }
    }

    // CHANGE COLORS
    console.log(clrYellow(`[\n${finalString}\n]`))

    console.log()
}

// ============================================================================
// MAIN
// ============================================================================
// Ponto de entrada do script: decide o que fazer com base nos argumentos e gere o fluxo principal.
async function main() {
    // Usa a função separada para ler os argumentos
    const args = parseArguments()

    if (args.command === '--help') return printHelp()

    if (args.command === '--create') {
        if (!args.createRawList || args.createRawList.length === 0) {
            throw new Error('Falta o argumento. Usa: node alone_time.js --create "week1 | 16/11/2026 | lunch; dinner"')
        }
        return await createCalendar(args.createRawList)
    }

    if (args.command === '--unknown') {
        throw new Error(`Argumento desconhecido "${args.dateText}". Usa --help para ver as opções.`)
    }

    // A partir daqui é o fluxo normal (tabela e verificações)
    const weeks = buildWeeks(MEALS_START_DATE)
    const completedMeals = loadCompletedMeals()
    let message = null

    // Verificação de calendário expirado
    const expiredResult = await checkCalendarExpired(MEALS_START_DATE, completedMeals)
    if (expiredResult) message = expiredResult.message

    if (args.command === '--reset') {
        completedMeals.clear()
        saveCompletedMeals(completedMeals)
        message = '🗑 Todas as refeições marcadas foram apagadas.'
    } else if (args.command === '--complete' || args.command === '--undo') {
        message = applyMarkCommand(args.command, weeks, completedMeals, args.dateText, args.mealName)
        saveCompletedMeals(completedMeals)
    }

    console.log()
    if (message) {
        // CHANGE COLORS
        console.log(clrGreen(message))
        console.log()
    }
    for (const week of weeks) {
        renderWeek(week, completedMeals)
        console.log()
    }
}

main().catch(function (error) {
    // CHANGE COLORS
    console.log('\n' + clrRed(error.message) + '\n')
    process.exitCode = 1
})
