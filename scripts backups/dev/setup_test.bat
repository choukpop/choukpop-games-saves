
@echo off
setlocal enabledelayedexpansion

:: ============================================================
:: SETUP TEST ENVIRONMENT
:: ============================================================

echo.
echo ========================================
echo    SETUP TEST ENVIRONMENT
echo ========================================
echo.
echo This script will create test folders and files on your Desktop
echo with the same structure used in the backup script.
echo.

:: ============================================================
:: CONFIGURATION
:: ============================================================
set "DESKTOP=%USERPROFILE%\Desktop"

:: Main game save folder
set "GAME_SAVE_PATH=%DESKTOP%\save game"

:: Test folders
set "FOLDER1=%DESKTOP%\save game"
set "FOLDER2=%DESKTOP%\config game"
set "FOLDER3=%DESKTOP%\removed game"
set "FOLDER4=%DESKTOP%\config.json"

:: ============================================================
:: CREATE FOLDERS AND FILES
:: ============================================================

echo [1] Creating main game save folder...
if not exist "%GAME_SAVE_PATH%\" (
    mkdir "%GAME_SAVE_PATH%" >nul
    echo     %GAME_SAVE_PATH% - Created
) else (
    echo     %GAME_SAVE_PATH% - Already exists
)

echo.
echo [2] Creating test files in save game folder...
echo This is a test save file > "%GAME_SAVE_PATH%\save_01.sav"
echo This is another test save file > "%GAME_SAVE_PATH%\save_02.sav"
echo This is a test config file > "%GAME_SAVE_PATH%\config.ini"
echo     Created 3 test files in save game folder

echo.
echo [3] Creating config game folder...
if not exist "%FOLDER2%\" (
    mkdir "%FOLDER2%" >nul
    echo     %FOLDER2% - Created
) else (
    echo     %FOLDER2% - Already exists
)

echo.
echo [4] Creating test files in config game folder...
echo This is a config file > "%FOLDER2%\settings.ini"
echo This is another config file > "%FOLDER2%\game.ini"
echo     Created 2 test files in config game folder

echo.
echo [5] Creating removed game folder...
if not exist "%FOLDER3%\" (
    mkdir "%FOLDER3%" >nul
    echo     %FOLDER3% - Created
) else (
    echo     %FOLDER3% - Already exists
)

echo.
echo [6] Creating test files in removed game folder...
echo This is a removed save file > "%FOLDER3%\removed_01.sav"
echo This is another removed save file > "%FOLDER3%\removed_02.sav"
echo     Created 2 test files in removed game folder

echo.
echo [7] Creating config.json file...
echo { "test": "config", "version": "1.0" } > "%FOLDER4%"
echo     %FOLDER4% - Created

:: ============================================================
:: SHOW SUMMARY
:: ============================================================
echo.
echo ========================================
echo    SETUP COMPLETE!
echo ========================================
echo.
echo Test environment created successfully!
echo.
echo [FOLDERS CREATED]
echo   - %FOLDER1%
echo   - %FOLDER2%
echo   - %FOLDER3%
echo.
echo [FILES CREATED]
echo   save game folder:
echo     - save_01.sav
echo     - save_02.sav
echo     - config.ini
echo   config game folder:
echo     - settings.ini
echo     - game.ini
echo   removed game folder:
echo     - removed_01.sav
echo     - removed_02.sav
echo   Desktop:
echo     - config.json
echo.
echo IMPORTANT: The backup folder was NOT created.
echo The backup script will create it when you run it.
echo.
echo Now you can run the backup script to test!
echo.
