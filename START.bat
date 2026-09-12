@echo off
title 77RP Tube - Start
color 0A

echo.
echo  ╔══════════════════════════════════════╗
echo  ║        77RP Tube - START             ║
echo  ╚══════════════════════════════════════╝
echo.

:: Przejdź do folderu projektu
cd /d "%~dp0"

:: Zabij stare procesy node
echo [1/4] Zatrzymuję stare procesy...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM cloudflared.exe >nul 2>&1
timeout /t 2 >nul

:: Uruchom backend w tle
echo [2/4] Uruchamiam backend...
start "77RP Backend" cmd /c "cd backend && npm run dev"
timeout /t 4 >nul

:: Uruchom tunel Cloudflare i zapisz URL
echo [3/4] Uruchamiam tunel Cloudflare (publiczny URL backendu)...
start "77RP Cloudflare Tunnel" cmd /c "cloudflared.exe tunnel --url http://localhost:5000 2>&1 | tee tunnel.log"
timeout /t 8 >nul

:: Pobierz URL z loga tunelu
for /f "tokens=*" %%i in ('findstr /c:"trycloudflare.com" tunnel.log 2^>nul') do (
    set TUNNEL_LINE=%%i
)

echo.
echo [4/4] Informacje o sesji:
echo  - Backend lokalny:  http://localhost:5000
echo  - Sieć lokalna:     http://192.168.100.5:5000
echo  - Surge hosting:    https://77rptube.surge.sh
echo.
echo  WAŻNE: Tunel Cloudflare uruchomiony w osobnym oknie.
echo  Po uruchomieniu tunelu - zaktualizuj .env.production
echo  i uruchom DEPLOY.bat żeby wdrożyć nowy URL na Surge!
echo.
echo  Naciśnij dowolny klawisz aby zamknąć...
pause >nul
