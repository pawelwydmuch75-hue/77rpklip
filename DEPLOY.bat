@echo off
title 77RP Tube - Deploy na Surge
color 0B

echo.
echo  ╔══════════════════════════════════════╗
echo  ║     77RP Tube - DEPLOY na Surge      ║
echo  ╚══════════════════════════════════════╝
echo.

cd /d "%~dp0"

:: Zapytaj o URL tunelu
echo Podaj publiczny URL backendu (z okna cloudflared):
echo Przykład: https://xyz-abc-123.trycloudflare.com
echo.
set /p TUNNEL_URL="URL tunelu: "

if "%TUNNEL_URL%"=="" (
    echo BŁĄD: Nie podano URL!
    pause
    exit /b 1
)

:: Zapisz do .env.production i .env.local frontendu
echo NEXT_PUBLIC_API_URL=%TUNNEL_URL%/api> frontend\.env.production
echo BACKEND_URL=%TUNNEL_URL%>> frontend\.env.production
echo NEXT_PUBLIC_API_URL=%TUNNEL_URL%/api> frontend\.env.local
echo BACKEND_URL=%TUNNEL_URL%>> frontend\.env.local

echo.
echo [1/3] Zapisano URL: %TUNNEL_URL%
echo [2/3] Buduję frontend (static export)...

cd frontend
set NEXT_EXPORT=true
call npm run build

if %errorlevel% neq 0 (
    echo BŁĄD podczas budowania!
    pause
    exit /b 1
)

copy /y out\index.html out\200.html >nul

echo [3/3] Wdrażam na Surge...
call npx surge out/ 77rptube.surge.sh

echo.
echo  ✅ Gotowe! Strona dostępna na: https://77rptube.surge.sh
echo.
pause
