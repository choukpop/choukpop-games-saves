
@echo off
setlocal enabledelayedexpansion

:: ============================================================
:: CLEANUP TEST ENVIRONMENT (NO CONFIRMATION)
:: ============================================================

echo.
echo ========================================
echo    CLEANUP TEST ENVIRONMENT
echo ========================================
echo.
echo Removing all test folders and files...
echo.

set "DESKTOP=%USERPROFILE%\Desktop"

:: Folders to remove
set "FOLDER1=%DESKTOP%\save game"
set "FOLDER2=%DESKTOP%\config game"
set "FOLDER3=%DESKTOP%\removed game"
set "FOLDER4=%DESKTOP%\config.json"
set "BACKUP=%DESKTOP%\backup"

echo [DELETING...]

if exist "%FOLDER1%\" ( rd /s /q "%FOLDER1%" >nul & echo   - Deleted: %FOLDER1% ) else ( echo   - Not found: %FOLDER1% )
if exist "%FOLDER2%\" ( rd /s /q "%FOLDER2%" >nul & echo   - Deleted: %FOLDER2% ) else ( echo   - Not found: %FOLDER2% )
if exist "%FOLDER3%\" ( rd /s /q "%FOLDER3%" >nul & echo   - Deleted: %FOLDER3% ) else ( echo   - Not found: %FOLDER3% )
if exist "%FOLDER4%" ( del /q "%FOLDER4%" >nul & echo   - Deleted: %FOLDER4% ) else ( echo   - Not found: %FOLDER4% )
if exist "%BACKUP%\" ( rd /s /q "%BACKUP%" >nul & echo   - Deleted: %BACKUP% ) else ( echo   - Not found: %BACKUP% )

echo.
echo [CLEANUP COMPLETE]
echo.
