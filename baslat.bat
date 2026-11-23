@echo off
chcp 65001 > nul
title DigiAkademi LMS Baslatici
echo ===================================================
echo   DigiAkademi LMS - Gelistirme Sunucusu
echo ===================================================
echo.

cd /d "%~dp0"

echo Sunucu baslatiliyor: http://localhost:3000
echo.

timeout /t 2 /nobreak > nul
start http://localhost:3000

call npm.cmd run dev

pause
