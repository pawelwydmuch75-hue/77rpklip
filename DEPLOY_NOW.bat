@echo off
title 77RP Tube - Wdrozenie na Surge
color 0A

cd /d "%~dp0frontend"

echo.
echo ========================================
echo   Wdrozenie 77RP Tube na Surge.sh
echo ========================================
echo.
echo [1/3] Budowanie frontendu...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo BLAD: Budowanie frontendu nie powiodlo sie!
    pause
    exit /b 1
)

echo.
echo [2/3] Przygotowanie routingu SPA dla Surge (200.html)...
copy /y out\index.html out\200.html >nul

echo.
echo [3/3] Logowanie i wysylanie do: 77rptube.surge.sh...
echo.

call npx surge out/ 77rptube.surge.sh

echo.
if %errorlevel% equ 0 (
    echo ========================================
    echo   SUKCES! Strona opublikowana!
    echo   https://77rptube.surge.sh
    echo ========================================
) else (
    echo.
    echo Wystapil problem z wdrozeniem.
)
echo.
pause
