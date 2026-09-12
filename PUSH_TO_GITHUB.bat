@echo off
title Wysylanie kodu na GitHub
color 0A
cd /d "%~dp0"
echo ========================================
echo   Wysylanie projektu 77RP Tube na GitHub
echo ========================================
echo.
git push -u origin main
echo.
if %errorlevel% equ 0 (
    echo [SUKCES] Kod zostal pomyslnie wyslany na Twoj GitHub!
) else (
    echo [INFO] Jesli pojawilo sie okno logowania, zaloguj sie do GitHuba.
)
echo.
pause
