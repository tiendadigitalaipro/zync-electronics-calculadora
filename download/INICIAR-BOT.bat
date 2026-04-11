@echo off
title SynthTrade Pro - A2K DIGITAL STUDIO
color 0A

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║                                                        ║
echo  ║          SynthTrade Pro v1.0                           ║
echo  ║          Powered by A2K DIGITAL STUDIO                 ║
echo  ║                                                        ║
echo  ║          Bot de Trading Automatizado                   ║
echo  ║          para Indices Sinteticos de Deriv              ║
echo  ║                                                        ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

:: Verificar si Node.js esta instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  [!] Node.js no encontrado.
    echo  [!] Descargalo de: https://nodejs.org
    echo.
    pause
    exit
)

echo  [OK] Node.js encontrado.
echo.

:: Verificar si bun esta instalado
where bun >nul 2>nul
if %errorlevel% neq 0 (
    echo  [!] Bun no encontrado. Instalando...
    npm install -g bun
    echo  [OK] Bun instalado.
    echo.
) else (
    echo  [OK] Bun encontrado.
    echo.
)

:: Instalar dependencias
echo  [1/2] Instalando dependencias...
call bun install
echo  [OK] Dependencias instaladas.
echo.

:: Iniciar el servidor
echo  [2/2] Iniciando SynthTrade Pro...
echo.
echo  ═══════════════════════════════════════════════════════════
echo  Abre tu navegador y ve a: http://localhost:3000
echo  Presiona Ctrl+C para detener el servidor
echo  ═══════════════════════════════════════════════════════════
echo.

call bun run dev
pause
