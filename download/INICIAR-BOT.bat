@echo off
chcp 65001 >nul 2>&1
title SynthTrade Pro
color 0A

echo.
echo  =============================================
echo    SYNTHTRADE PRO - INICIANDO BOT
echo  =============================================
echo.

cd /d "%~dp0"

echo  Arreglando archivo de configuracion...
powershell -Command "(gc package.json) -replace ' 2>&1 \| tee dev.log','' -replace 'cp -r .next/static .next/standalone/.next/','' -replace 'cp -r public .next/standalone/','' -replace 'NODE_ENV=production bun .next/standalone/server.js 2>&1 \| tee server.log','next start' | Set-Content package.json"

echo  Iniciando servidor...
echo  Abre tu navegador en: http://localhost:3000
echo  Para detener: presiona Ctrl+C
echo.
bun run dev
pause
