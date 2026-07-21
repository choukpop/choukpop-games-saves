
@echo off
setlocal enabledelayedexpansion

:: ORIGINAL save game folder
set "GAME_SAVE_PATH=C:\Users\ChouKpop\Desktop\save game"

:: ========================================
:: ORIGINAL GAME SAVES (FOLDER OR FILE)
:: ========================================
:: Format: type|path
:: type can be: "folder" or "file"
:: ========================================
set "game_save[1]=folder|C:\Users\ChouKpop\Desktop\save game"
set "game_save[2]=folder|C:\Users\ChouKpop\Desktop\config game"
set "game_save[3]=folder|C:\Users\ChouKpop\Desktop\removed game"
set "game_save[4]=file|D:\SteamLibrary\steamapps\common\wallpaper_engine\config.json"

:: BACKUP folders
set "github_copy_save[1]=C:\Users\ChouKpop\Desktop\backup"
set "github_copy_save[2]=C:\Users\ChouKpop\Desktop\backup"
set "github_copy_save[3]=C:\Users\ChouKpop\Desktop\backup"
set "github_copy_save[4]=C:\Users\ChouKpop\Desktop\backup"

:: Set to "true" if you want to save inside subfolder with original name
:: Set to "false" if you want to save directly to backup folder
set "USE_SUBFOLDER=true"

:: ========================================
:: VERSION 13 - GAME_SAVE[] WITH TYPE|PATH FORMAT
:: ========================================

cls
echo ========================================
echo              BACKUP SCRIPT
echo ========================================
echo.
echo [GAME SAVE FOLDER CONFIGURATION]
echo ----------------------------------------
echo The game save folder is: %GAME_SAVE_PATH%
echo.
if not exist "%GAME_SAVE_PATH%\" (
    echo [WARNING] This folder does not exist or is inaccessible
    echo.
) else (
    echo [OK] Folder found
    echo.
)

:: ========================================
:: STEP 1: ASK IF WANT TO COPY
:: ========================================
set /p do_copy="Do you want to COPY new game files to backup? (y/n): "

:: ========================================
:: STEP 2: COUNT ITEMS
:: ========================================
set "count=0"
for /f "tokens=2 delims==" %%a in ('set game_save[') do (
    set /a "count+=1"
)

:: ========================================
:: STEP 3: CHECK EXISTING BACKUP ITEMS
:: ========================================
echo.
echo [CHECKING EXISTING BACKUP ITEMS...]
echo.

for /l %%i in (1,1,%count%) do (
    :: Extrair tipo e origem do game_save
    for /f "tokens=1,* delims=|" %%a in ("!game_save[%%i]!") do (
        set "item_type=%%a"
        set "item_source=%%b"
    )
    
    :: Extrair nome do item
    for %%f in ("!item_source!") do set "item_name=%%~nxf"
    
    set "check_path=!github_copy_save[%%i]!"
    
    :: Se for pasta e USE_SUBFOLDER for true, adiciona o nome da pasta ao caminho
    if /i "!item_type!"=="folder" (
        if /i "%USE_SUBFOLDER%"=="true" (
            set "check_path=!check_path!\!item_name!"
        )
        
        if exist "!check_path!\" (
            echo [%%i] [FOLDER] !item_name! - EXISTS at: !check_path!
            set "exists[%%i]=1"
        ) else (
            echo [%%i] [FOLDER] !item_name! - DOES NOT EXIST at: !check_path!
            set "exists[%%i]=0"
        )
    ) else if /i "!item_type!"=="file" (
        :: Para ficheiros, o destino é o caminho completo
        set "check_path=!github_copy_save[%%i]!\!item_name!"
        
        if exist "!check_path!" (
            echo [%%i] [FILE] !item_name! - EXISTS at: !check_path!
            set "exists[%%i]=1"
        ) else (
            echo [%%i] [FILE] !item_name! - DOES NOT EXIST at: !check_path!
            set "exists[%%i]=0"
        )
    )
)
echo.

:: ========================================
:: STEP 4: ASK FOR EACH ITEM IF WANT TO DELETE (only if exists)
:: ========================================
echo [DELETE OLD BACKUP ITEMS - Individual choice]
echo.

for /l %%i in (1,1,%count%) do (
    set "delete_item[%%i]=n"
    
    :: Extrair tipo e origem do game_save
    for /f "tokens=1,* delims=|" %%a in ("!game_save[%%i]!") do (
        set "item_type=%%a"
        set "item_source=%%b"
    )
    
    :: Extrair nome do item
    for %%f in ("!item_source!") do set "item_name=%%~nxf"
    
    set "full_path=!github_copy_save[%%i]!"
    
    if /i "!item_type!"=="folder" (
        if /i "%USE_SUBFOLDER%"=="true" (
            set "full_path=!full_path!\!item_name!"
        )
        
        if "!exists[%%i]!"=="1" (
            echo [%%i] [FOLDER] Item: !item_name!
            echo     Path: !full_path!
            echo     [STATUS: EXISTS]
            set /p "delete_choice=     Delete this folder? (y/n): "
            
            if /i "!delete_choice!"=="y" (
                set "delete_item[%%i]=y"
                echo     [MARKED FOR DELETION]
            ) else (
                echo     [KEPT]
            )
        ) else (
            echo [%%i] [FOLDER] Item: !item_name!
            echo     Path: !full_path!
            echo     [STATUS: DOES NOT EXIST - Nothing to delete]
            set "delete_item[%%i]=n"
            echo     [AUTOMATICALLY KEPT]
        )
    ) else if /i "!item_type!"=="file" (
        set "full_path=!github_copy_save[%%i]!\!item_name!"
        
        if "!exists[%%i]!"=="1" (
            echo [%%i] [FILE] Item: !item_name!
            echo     Path: !full_path!
            echo     [STATUS: EXISTS]
            set /p "delete_choice=     Delete this file? (y/n): "
            
            if /i "!delete_choice!"=="y" (
                set "delete_item[%%i]=y"
                echo     [MARKED FOR DELETION]
            ) else (
                echo     [KEPT]
            )
        ) else (
            echo [%%i] [FILE] Item: !item_name!
            echo     Path: !full_path!
            echo     [STATUS: DOES NOT EXIST - Nothing to delete]
            set "delete_item[%%i]=n"
            echo     [AUTOMATICALLY KEPT]
        )
    )
    echo.
)

:: ========================================
:: CLEAR SCREEN - START ACTIONS
:: ========================================
cls
echo ========================================
echo              BACKUP SCRIPT
echo ========================================
echo.
echo [CONFIGURATION SUMMARY]
echo - Copy files:      %do_copy%
echo - Subfolder mode:  %USE_SUBFOLDER% (only for folders)
echo.
echo [DELETE SUMMARY]
for /l %%i in (1,1,%count%) do (
    for /f "tokens=1,* delims=|" %%a in ("!game_save[%%i]!") do (
        set "item_type=%%a"
        set "item_source=%%b"
    )
    for %%f in ("!item_source!") do set "item_name=%%~nxf"
    
    if /i "!delete_item[%%i]!"=="y" (
        echo - [%%i] [!item_type!] !item_name! - WILL BE DELETED
    ) else (
        echo - [%%i] [!item_type!] !item_name! - WILL BE KEPT
    )
)
echo.
echo ========================================
echo.

:: ========================================
:: PROCESS DELETE (ONLY MARKED ONES AND THAT EXIST)
:: ========================================
echo [DELETING SELECTED OLD BACKUP ITEMS...]
echo.

set "deleted_any=0"
for /l %%i in (1,1,%count%) do (
    if /i "!delete_item[%%i]!"=="y" (
        set "deleted_any=1"
        
        for /f "tokens=1,* delims=|" %%a in ("!game_save[%%i]!") do (
            set "item_type=%%a"
            set "item_source=%%b"
        )
        
        for %%f in ("!item_source!") do set "item_name=%%~nxf"
        set "dest_path=!github_copy_save[%%i]!"
        
        if /i "!item_type!"=="folder" (
            if /i "%USE_SUBFOLDER%"=="true" (
                set "dest_path=!dest_path!\!item_name!"
            )
            
            echo [%%i] Deleting folder: !item_name!
            echo     Path: !dest_path!
            
            if exist "!dest_path!\" (
                @RD /S /Q "!dest_path!" >nul
                echo     [OK] Deleted successfully!
            ) else (
                echo     [INFO] Folder doesn't exist - nothing to delete
            )
        ) else if /i "!item_type!"=="file" (
            set "dest_path=!github_copy_save[%%i]!\!item_name!"
            
            echo [%%i] Deleting file: !item_name!
            echo     Path: !dest_path!
            
            if exist "!dest_path!" (
                del /q "!dest_path!" >nul
                echo     [OK] Deleted successfully!
            ) else (
                echo     [INFO] File doesn't exist - nothing to delete
            )
        )
        echo.
    )
)

if "!deleted_any!"=="0" (
    echo [INFO] No items were marked for deletion.
    echo.
)

:: ========================================
:: PROCESS COPY (IF CONFIRMED) - FILES FIRST, THEN FOLDERS
:: ========================================
if /i "%do_copy%"=="y" (
    echo [COPYING NEW FILES...]
    echo.
    
    :: PRIMEIRO LOOP: Copiar apenas FILES
    echo [STEP 1] Copying FILES first...
    echo.
    for /l %%i in (1,1,%count%) do (
        for /f "tokens=1,* delims=|" %%a in ("!game_save[%%i]!") do (
            set "item_type=%%a"
            set "item_source=%%b"
        )
        
        if /i "!item_type!"=="file" (
            for %%f in ("!item_source!") do set "item_name=%%~nxf"
            
            if exist "!item_source!" (
                set "src_path=!item_source!"
                set "dest_path=!github_copy_save[%%i]!"
                
                echo [%%i] [FILE] Source: !item_name!
                echo     From: !src_path!
                echo     To:   !dest_path!
                echo.
                
                if not exist "!dest_path!\" mkdir "!dest_path!"
                copy /y "!src_path!" "!dest_path!\" >nul
                
                if !errorlevel! equ 0 (
                    echo     [OK] File copied successfully!
                ) else (
                    echo     [WARNING] Copy failed!
                )
                echo ----------------------------------------
                echo.
            ) else (
                echo [%%i] [FILE] ERROR: Source file doesn't exist - "!item_source!"
                echo ----------------------------------------
                echo.
            )
        )
    )
    
    :: SEGUNDO LOOP: Copiar apenas FOLDERS
    echo [STEP 2] Copying FOLDERS...
    echo.
    for /l %%i in (1,1,%count%) do (
        for /f "tokens=1,* delims=|" %%a in ("!game_save[%%i]!") do (
            set "item_type=%%a"
            set "item_source=%%b"
        )
        
        if /i "!item_type!"=="folder" (
            for %%f in ("!item_source!") do set "item_name=%%~nxf"
            
            if exist "!item_source!\" (
                set "src_path=!item_source!"
                set "dest_path=!github_copy_save[%%i]!"
                
                echo [%%i] [FOLDER] Source: !item_name!
                
                if /i "%USE_SUBFOLDER%"=="true" (
                    set "dest_path=!dest_path!\!item_name!"
                    echo     Mode: Saving inside subfolder "!item_name!"
                ) else (
                    echo     Mode: Saving directly to backup folder
                )
                
                echo     From: !src_path!
                echo     To:   !dest_path!
                echo.
                
                if not exist "!dest_path!\" mkdir "!dest_path!"
                xcopy /s /i /q /y "!src_path!" "!dest_path!" >nul
                
                if !errorlevel! equ 0 (
                    echo     [OK] Copy completed successfully!
                ) else (
                    echo     [WARNING] Copy completed with errors!
                )
            ) else (
                echo [%%i] [FOLDER] ERROR: Source folder doesn't exist - "!item_source!"
            )
            echo ----------------------------------------
            echo.
        )
    )
    
    echo [COPY PROCESS COMPLETED]
    echo.
) else (
    echo [SKIP] Copy cancelled.
    echo.
)

echo ========================================
echo [PROCESS FINISHED]
echo ========================================
echo.
pause
