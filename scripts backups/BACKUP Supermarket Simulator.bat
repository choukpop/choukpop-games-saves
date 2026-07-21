
@echo off
setlocal enabledelayedexpansion

:: ============================================================
:: CONFIGURATION - EDIT HERE
:: ============================================================
set "GAME_SAVE_PATH=C:\Users\ChouKpop\AppData\LocalLow\Nokta Games"
set "GITHUB_BASE_PATH=D:\Bibliotecas\Others\GitHub\choukpop-games-saves"

:: ============================================================
:: Items: type|path (type: folder or file)
:: ============================================================
set "game_save[1]=folder|C:\Users\ChouKpop\AppData\LocalLow\Nokta Games\Supermarket Simulator"

:: ============================================================
:: Backup destinations (must match the same index)
:: ============================================================
set "github_copy_save[1]=%GITHUB_BASE_PATH%\Single Player Games\Simulation\Supermarket Simulator/Nokta Games"

:: ============================================================
:: Subfolder mode: true = save inside subfolder with original name
:: ============================================================
set "USE_SUBFOLDER=true"

:: ============================================================
:: SHOW PALETTE COLORS (true = show, false = hide)
:: ============================================================
set "SHOW_PALETTE_COLORS=false"

:: ============================================================
:: COLORS (ANSI)
:: ============================================================
for /f %%a in ('"prompt $E$S & echo on & for %%b in (1) do rem"') do set "ESC=%%a"

set "CYAN=%ESC%[38;5;51m"
set "YELLOW=%ESC%[38;5;226m"
set "GREEN=%ESC%[38;5;46m"
set "RED=%ESC%[38;5;196m"
set "WHITE=%ESC%[38;5;231m"
set "MAGENTA=%ESC%[38;5;201m"
set "BLUE=%ESC%[38;5;21m"
set "RESET=%ESC%[0m"

set "ORANGE=%ESC%[38;5;214m"
set "PINK=%ESC%[38;5;205m"
set "PURPLE=%ESC%[38;5;129m"
set "GOLD=%ESC%[38;5;220m"
set "TEAL=%ESC%[38;5;37m"
set "CORAL=%ESC%[38;5;209m"
set "LAVENDER=%ESC%[38;5;183m"
set "LIME=%ESC%[38;5;154m"
set "TOMATO=%ESC%[38;5;203m"
set "SKY_BLUE=%ESC%[38;5;117m"





set "CLR_HEADERS=%ESC%[38;5;129m"
set "CLR_SUBTITLES=%ESC%[38;5;220m"

set "CLR_SUCCESS=%ESC%[38;5;46m"
set "CLR_WARNING=%ESC%[38;5;226m"
set "CLR_ERROR=%ESC%[38;5;196m"

set "CLR_PATHS=%ESC%[38;5;37m"
set "CLR_SUMMARY=%ESC%[38;5;37m"
set "CLR_SEPARATOR=%ESC%[38;5;37m"
set "CLR_HIGHLIGHT=%ESC%[38;5;129m"
set "CLR_TEXT=%ESC%[38;5;231m"



:: ============================================================
:: COLOR PALETTE (if enabled)
:: ============================================================
if /i "%SHOW_PALETTE_COLORS%"=="true" (
    cls
    echo.
    echo %CLR_HEADERS%===========================================%RESET%
    echo %CLR_HEADERS%               COLOR PALETTE%RESET%
    echo %CLR_HEADERS%===========================================%RESET%
    echo.
    echo [MAIN COLORS]
    echo %CYAN%  CYAN         %RESET%%CYAN%This text is in CYAN%RESET%
    echo %YELLOW%  YELLOW       %RESET%%YELLOW%This text is in YELLOW%RESET%
    echo %GREEN%  GREEN        %RESET%%GREEN%This text is in GREEN%RESET%
    echo %RED%  RED          %RESET%%RED%This text is in RED%RESET%
    echo %WHITE%  WHITE        %RESET%%WHITE%This text is in WHITE%RESET%
    echo %MAGENTA%  MAGENTA      %RESET%%MAGENTA%This text is in MAGENTA%RESET%
    echo %BLUE%  BLUE         %RESET%%BLUE%This text is in BLUE%RESET%
    echo.
    echo [ADDITIONAL COLORS]
    echo %ORANGE%  ORANGE       %RESET%%ORANGE%This text is in ORANGE%RESET%
    echo %PINK%  PINK         %RESET%%PINK%This text is in PINK%RESET%
    echo %PURPLE%  PURPLE       %RESET%%PURPLE%This text is in PURPLE%RESET%
    echo %GOLD%  GOLD         %RESET%%GOLD%This text is in GOLD%RESET%
    echo %TEAL%  TEAL         %RESET%%TEAL%This text is in TEAL%RESET%
    echo %CORAL%  CORAL        %RESET%%CORAL%This text is in CORAL%RESET%
    echo %LAVENDER%  LAVENDER     %RESET%%LAVENDER%This text is in LAVENDER%RESET%
    echo %LIME%  LIME         %RESET%%LIME%This text is in LIME%RESET%
    echo %TOMATO%  TOMATO       %RESET%%TOMATO%This text is in TOMATO%RESET%
    echo %SKY_BLUE%  SKY_BLUE     %RESET%%SKY_BLUE%This text is in SKY_BLUE%RESET%
    echo.
    echo %CYAN%========================================%RESET%
    echo.
    echo %CLR_HEADERS%Press any key to continue...%RESET%
    pause >nul
)

:: ============================================================
:: MAIN SCRIPT
:: ============================================================

:: ============================================================
:: PAGE 1: HEADER + GAME SAVE FOLDER
:: Description: Shows the main title and game save folder info
:: Example output (folder exists):
::   ===========================================
::                BACKUP SCRIPT
::   ===========================================
::   
::   [GAME SAVE FOLDER]
::       C:\Users\ChouKpop\Desktop\save game
::       [OK] Folder found
::   
::   Copy files to backup? (y/n):
::   > y
::
:: Example output (folder not found):
::   ===========================================
::                BACKUP SCRIPT
::   ===========================================
::   
::   [GAME SAVE FOLDER]
::       C:\Users\ChouKpop\Desktop\save game
::   
::   [SUMMARY]
::       [ERROR] Folder not found
::   
::       The script will now close.
::   
::   Press any key to exit...
:: ============================================================
cls
echo.
echo %CLR_HEADERS%===========================================%RESET%
echo %CLR_HEADERS%               BACKUP SCRIPT%RESET%
echo %CLR_HEADERS%===========================================%RESET%
echo.
echo %CLR_SUBTITLES%[GAME SAVE FOLDER]%RESET%
echo %CLR_PATHS%    %GAME_SAVE_PATH%%RESET%

:: Check if the game save folder exists
if not exist "%GAME_SAVE_PATH%\" (
    echo.
    echo %CLR_SUBTITLES%[SUMMARY]%RESET%
    echo %CLR_ERROR%    [ERROR] Folder not found%RESET%
    echo.
    echo %CLR_ERROR%    The script will now close.%RESET%
    echo.
    echo %CLR_HEADERS%Press any key to exit...%RESET%
    pause >nul
    exit /b
) else (
    echo %CLR_SUCCESS%    [OK] Folder found%RESET%
)
echo.

:: Ask if want to copy (only if folder exists)
echo %CLR_TEXT%Copy files to backup? (y/n):%RESET%
set /p "do_copy=> "

:: ============================================================
:: PAGE 2: CHECK EXISTING BACKUP ITEMS
:: Description: Checks if each backup item exists in the backup folder
:: Example output:
::   [CHECKING BACKUP ITEMS]
::   
::   [1] [FOLDER] save game - EXISTS
::       C:\Users\ChouKpop\Desktop\backup\save game
::   
::   [2] [FOLDER] config game - NOT FOUND
::       C:\Users\ChouKpop\Desktop\backup\config game
::   
::   [3] [FILE] config.json - EXISTS
::       C:\Users\ChouKpop\Desktop\backup\config.json
::   
::   Press any key to continue...
:: ============================================================
cls
echo.
echo %CLR_HEADERS%===========================================%RESET%
echo %CLR_HEADERS%               BACKUP SCRIPT%RESET%
echo %CLR_HEADERS%===========================================%RESET%
echo.

set "count=0"
for /f "tokens=2 delims==" %%a in ('set game_save[') do set /a "count+=1"

echo %CLR_SUBTITLES%[CHECKING BACKUP ITEMS]%RESET%
echo.

for /l %%i in (1,1,%count%) do (
    call :ParseItem %%i
    call :GetFullPath %%i dest_path
    
    if /i "!item_type!"=="folder" (
        if exist "!dest_path!\" (
            echo %CLR_SUCCESS%[%%i] [FOLDER] !item_name! - EXISTS%RESET%
            echo %CLR_PATHS%    !dest_path!%RESET%
            set "exists[%%i]=1"
        ) else (
            echo %CLR_ERROR%[%%i] [FOLDER] !item_name! - NOT FOUND%RESET%
            echo %CLR_PATHS%    !dest_path!%RESET%
            set "exists[%%i]=0"
        )
    ) else (
        set "file_path=!dest_path!\!item_name!"
        if exist "!file_path!" (
            echo %CLR_SUCCESS%[%%i] [FILE] !item_name! - EXISTS%RESET%
            echo %CLR_PATHS%    !file_path!%RESET%
            set "exists[%%i]=1"
        ) else (
            echo %CLR_ERROR%[%%i] [FILE] !item_name! - NOT FOUND%RESET%
            echo %CLR_PATHS%    !file_path!%RESET%
            set "exists[%%i]=0"
        )
    )
    echo.
)

echo %CLR_HEADERS%Press any key to continue...%RESET%
pause >nul

:: ============================================================
:: PAGE 3: DELETE OLD BACKUP ITEMS
:: Description: Asks the user which items to delete (only if they exist)
:: Example output:
::   [DELETE OLD BACKUP ITEMS]
::   
::   [1] FOLDER: save game
::   Delete? (y/n): y
::       [TO DELETE]
::   
::   [2] FOLDER: config game - NOT FOUND
::       [AUTO KEPT]
::   
::   [3] FILE: config.json
::   Delete? (y/n): n
::       [KEPT]
::   
::   Press any key to exit...
:: ============================================================
cls
echo.
echo %CLR_HEADERS%===========================================%RESET%
echo %CLR_HEADERS%               BACKUP SCRIPT%RESET%
echo %CLR_HEADERS%===========================================%RESET%
echo.

echo %CLR_SUBTITLES%[DELETE OLD BACKUP ITEMS]%RESET%
echo.

for /l %%i in (1,1,%count%) do (
    set "delete[%%i]=n"
    call :ParseItem %%i
    call :GetFullPath %%i full_path
    
    if /i "!item_type!"=="folder" (
        if !exists[%%i]! equ 1 (
            echo %CLR_PATHS%[%%i] FOLDER: !item_name!%RESET%
            set /p "del=Delete? (y/n): "
            if /i "!del!"=="y" ( 
                set "delete[%%i]=y" 
                echo %CLR_ERROR%    [TO DELETE]%RESET%
            ) else ( 
                echo %CLR_SUCCESS%    [KEPT]%RESET%
            )
        ) else (
            echo %CLR_ERROR%[%%i] FOLDER: !item_name! - NOT FOUND%RESET%
        )
    ) else (
        set "file_path=!full_path!\!item_name!"
        if !exists[%%i]! equ 1 (
            echo %CLR_PATHS%[%%i] FILE: !item_name!%RESET%
            set /p "del=Delete? (y/n): "
            if /i "!del!"=="y" ( 
                set "delete[%%i]=y" 
                echo %CLR_ERROR%    [TO DELETE]%RESET%
            ) else ( 
                echo %CLR_SUCCESS%    [KEPT]%RESET%
            )
        ) else (
            echo %CLR_ERROR%[%%i] FILE: !item_name! - NOT FOUND%RESET%
        )
    )
    echo.
)

echo %CLR_HEADERS%Press any key to exit...%RESET%
pause >nul

:: ============================================================
:: PAGE 4: SUMMARY
:: Description: Shows a summary of the copy and delete plan
:: Example output:
::   [SUMMARY]
::   - Copy: Yes
::   - Subfolder: true
::   
::   [DELETE PLAN]
::   - [1] folder save game - DELETE
::   - [2] folder config game - KEEP
::   - [3] file config.json - KEEP
::   
::   ===========================================
:: ============================================================
cls
echo.
echo %CLR_HEADERS%===========================================%RESET%
echo %CLR_HEADERS%               BACKUP SCRIPT%RESET%
echo %CLR_HEADERS%===========================================%RESET%
echo.
echo %CLR_SUBTITLES%[SUMMARY]%RESET%

if /i "%do_copy%"=="y" ( set "copy_status=Yes" ) else ( set "copy_status=No" )

echo %CLR_SUMMARY%- Copy: %copy_status%%RESET%
echo %CLR_SUMMARY%- Subfolder: %USE_SUBFOLDER%%RESET%

echo.
echo %CLR_SUBTITLES%[DELETE PLAN]%RESET%
for /l %%i in (1,1,%count%) do (
    call :ParseItem %%i
    if /i "!delete[%%i]!"=="y" ( echo %CLR_ERROR%- [%%i] !item_type! !item_name! - DELETE%RESET% ) else ( echo %CLR_SUCCESS%- [%%i] !item_type! !item_name! - KEEP%RESET% )
)
echo.
echo %CLR_SEPARATOR%===========================================%RESET%
echo.

:: ============================================================
:: PAGE 5: DELETING SELECTED ITEMS
:: Description: Deletes the selected items and shows the result
:: Example output:
::   [DELETING...]
::   
::   - [1] Folder: save game - Deleted
::   - [2] Folder: config game - Not found
::   
::   ===========================================
:: ============================================================
echo %CLR_SUBTITLES%[DELETING...]%RESET%
echo.

set "any_deleted=0"
for /l %%i in (1,1,%count%) do (
    if /i "!delete[%%i]!"=="y" (
        set "any_deleted=1"
        call :ParseItem %%i
        call :GetFullPath %%i del_path
        
        if /i "!item_type!"=="folder" (
            if exist "!del_path!\" ( 
                rd /s /q "!del_path!" >nul 
                echo %CLR_ERROR%- [%%i] Folder: !item_name! - Deleted%RESET%
            ) else ( 
                echo %CLR_WARNING%- [%%i] Folder: !item_name! - Not found%RESET%
            )
        ) else (
            set "del_file=!del_path!\!item_name!"
            if exist "!del_file!" ( 
                del /q "!del_file!" >nul 
                echo %CLR_ERROR%- [%%i] File: !item_name! - Deleted%RESET%
            ) else ( 
                echo %CLR_WARNING%- [%%i] File: !item_name! - Not found%RESET%
            )
        )
    )
)
if !any_deleted! equ 0 ( echo %CLR_SUCCESS%    [INFO] Nothing to delete%RESET% )

echo.
echo %CLR_SEPARATOR%===========================================%RESET%
echo.

:: ============================================================
:: PAGE 6: COPYING FILES
:: Description: Copies files first, then folders
:: Example output:
::   [COPYING...]
::   
::   [STEP 1] Copying FILES...
::   
::   [3] [FILE] config.json
::       From: C:\Users\ChouKpop\Desktop\config.json
::       To:   C:\Users\ChouKpop\Desktop\backup
::       [OK] Copied
::   
::   ----------------------------------------
::   
::   [STEP 2] Copying FOLDERS...
::   
::   [1] [FOLDER] save game
::       From: C:\Users\ChouKpop\Desktop\save game
::       To:   C:\Users\ChouKpop\Desktop\backup\save game
::       [OK] Copied
::   
::   ----------------------------------------
:: ============================================================
if /i "%do_copy%"=="y" (
    echo %CLR_SUBTITLES%[COPYING...]%RESET%
    echo.
    
    :: Exists Files
    set "has_files=0"
    for /l %%i in (1,1,%count%) do (
        call :ParseItem %%i
        if /i "!item_type!"=="file" (
            set "has_files=1"
        )
    )
    
    :: Exists Folders
    set "has_folders=0"
    for /l %%i in (1,1,%count%) do (
        call :ParseItem %%i
        if /i "!item_type!"=="folder" (
            set "has_folders=1"
        )
    )
    
    :: STEP 1: Files
    if !has_files! equ 1 (
        echo %CLR_SUCCESS%[STEP 1] Copying FILES...%RESET%
        echo.
        
        set "file_counter=0"
        for /l %%i in (1,1,%count%) do (
            call :ParseItem %%i
            if /i "!item_type!"=="file" (
                set /a "file_counter+=1"
                call :CopyFile %%i !file_counter!
            )
        )
    )
    
    :: STEP 2: Folders
    if !has_folders! equ 1 (
        echo %CLR_SUCCESS%[STEP 2] Copying FOLDERS...%RESET%
        echo.
        
        set "folder_counter=0"
        for /l %%i in (1,1,%count%) do (
            call :ParseItem %%i
            if /i "!item_type!"=="folder" (
                set /a "folder_counter+=1"
                call :CopyFolder %%i !folder_counter!
            )
        )
    )
    
    :: No files/folders
    if !has_files! equ 0 if !has_folders! equ 0 (
        echo %CLR_WARNING%    [WARNING] No items to copy%RESET%
        echo.
    )
    
) else (
    echo %CLR_ERROR%[SKIP] Copy cancelled%RESET%
    echo.
)

:: ============================================================
:: PAGE 7: FINISH
:: Description: Shows the final completion message
:: Example output:
::   [PROCESS FINISHED]
::   
::   Press any key to exit...
:: ============================================================
echo %CLR_SUCCESS%[PROCESS FINISHED]%RESET%
echo.
echo %CLR_HEADERS%Press any key to exit...%RESET%
pause >nul

:: ============================================================
:: FUNCTIONS
:: ============================================================

:ParseItem
    for /f "tokens=1,* delims=|" %%a in ("!game_save[%1]!") do (
        set "item_type=%%a"
        set "item_source=%%b"
    )
    for %%f in ("!item_source!") do set "item_name=%%~nxf"
exit /b

:GetFullPath
    set "%2=!github_copy_save[%1]!"
    if /i "!item_type!"=="folder" (
        if /i "%USE_SUBFOLDER%"=="true" (
            set "%2=!%2!\!item_name!"
        )
    )
exit /b

:CopyFile
    if not exist "!item_source!" (
        echo %CLR_ERROR%[%1] [FILE] ERROR: !item_name! not found%RESET%
        echo.
        echo ----------------------------------------
        echo.
        exit /b
    )

    set "dest=!github_copy_save[%1]!"
    if not exist "!dest!\" mkdir "!dest!" >nul

    echo %CLR_HIGHLIGHT%[%2] [FILE] !item_name!%RESET%
    echo %CLR_PATHS%    From: !item_source!%RESET%
    echo %CLR_PATHS%    To:   !dest!%RESET%

    copy /y "!item_source!" "!dest!\" >nul
    if !errorlevel! equ 0 (
        echo %CLR_SUCCESS%    [OK] Copied%RESET%
    ) else (
        echo %CLR_ERROR%    [FAILED]%RESET%
    )

    echo.
    echo ----------------------------------------
    echo.
exit /b

:CopyFolder
    if not exist "!item_source!\" (
        echo %CLR_ERROR%[%1] [FOLDER] ERROR: !item_name! not found%RESET%
        echo.
        echo ----------------------------------------
        echo.
        exit /b
    )

    set "dest=!github_copy_save[%1]!"
    if /i "%USE_SUBFOLDER%"=="true" ( set "dest=!dest!\!item_name!" )
    
    if not exist "!dest!\" mkdir "!dest!" >nul

    echo %CLR_HIGHLIGHT%[%2] [FOLDER] !item_name!%RESET%
    echo %CLR_PATHS%    From: !item_source!%RESET%
    echo %CLR_PATHS%    To:   !dest!%RESET%

    xcopy /s /i /q /y "!item_source!" "!dest!" >nul
    if !errorlevel! equ 0 (
        echo %CLR_SUCCESS%    [OK] Copied%RESET%
    ) else (
        echo %CLR_ERROR%    [FAILED]%RESET%
    )

    echo.
    echo ----------------------------------------
    echo.
exit /b
