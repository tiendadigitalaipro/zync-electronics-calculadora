@echo off
title A2K DIGITAL STUDIO - SynthTrade Pro Deploy
color 0A
echo ============================================
echo    A2K DIGITAL STUDIO
echo    SynthTrade Pro - Firebase Deploy
echo ============================================
echo.

set BASE=https://preview-5ff1bba5-06eb-4c94-a7d4-b43fdda1ffc6.space.chatglm.site
set DIR=synthtrade-deploy

echo [1/4] Creando carpetas...
mkdir %DIR%\_next\static\chunks 2>nul
mkdir %DIR%\_next\static\media 2>nul
mkdir %DIR%\_next\static\dprM6_grQdUGSszN6fUDE 2>nul
mkdir %DIR%\404 2>nul

echo [2/4] Descargando archivos del bot...
echo Esto puede tardar 1-2 minutos...
echo.

powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12"

echo   - index.html
powershell -Command "Invoke-WebRequest -Uri '%BASE%/index.html' -OutFile '%DIR%\index.html'" 2>nul

echo   - 404.html
powershell -Command "Invoke-WebRequest -Uri '%BASE%/404.html' -OutFile '%DIR%\404.html'" 2>nul

echo   - Archivos JS y CSS...
powershell -Command "Invoke-WebRequest -Uri '%BASE%/_next/static/chunks/b14620cfbf6f2481.js' -OutFile '%DIR%\_next\static\chunks\b14620cfbf6f2481.js'" 2>nul
powershell -Command "Invoke-WebRequest -Uri '%BASE%/_next/static/chunks/turbopack-979f305e5cb781c4.js' -OutFile '%DIR%\_next\static\chunks\turbopack-979f305e5cb781c4.js'" 2>nul
powershell -Command "Invoke-WebRequest -Uri '%BASE%/_next/static/chunks/164523eb4661b623.css' -OutFile '%DIR%\_next\static\chunks\164523eb4661b623.css'" 2>nul
powershell -Command "Invoke-WebRequest -Uri '%BASE%/_next/static/chunks/a6dad97d9634a72d.js' -OutFile '%DIR%\_next\static\chunks\a6dad97d9634a72d.js'" 2>nul
powershell -Command "Invoke-WebRequest -Uri '%BASE%/_next/static/chunks/d12eb619654412dc.js' -OutFile '%DIR%\_next\static\chunks\d12eb619654412dc.js'" 2>nul
powershell -Command "Invoke-WebRequest -Uri '%BASE%/_next/static/chunks/d68b387a08693f57.js' -OutFile '%DIR%\_next\static\chunks\d68b387a08693f57.js'" 2>nul
powershell -Command "Invoke-WebRequest -Uri '%BASE%/_next/static/chunks/771dedee3f5e1621.js' -OutFile '%DIR%\_next\static\chunks\771dedee3f5e1621.js'" 2>nul
powershell -Command "Invoke-WebRequest -Uri '%BASE%/_next/static/chunks/3ce5c412301dead0.js' -OutFile '%DIR%\_next\static\chunks\3ce5c412301dead0.js'" 2>nul
powershell -Command "Invoke-WebRequest -Uri '%BASE%/_next/static/chunks/58c60a5fa6b544da.js' -OutFile '%DIR%\_next\static\chunks\58c60a5fa6b544da.js'" 2>nul
powershell -Command "Invoke-WebRequest -Uri '%BASE%/_next/static/chunks/2473c16c0c2f6b5f.css' -OutFile '%DIR%\_next\static\chunks\2473c16c0c2f6b5f.css'" 2>nul
powershell -Command "Invoke-WebRequest -Uri '%BASE%/_next/static/chunks/74f1b9da08b28ae5.js' -OutFile '%DIR%\_next\static\chunks\74f1b9da08b28ae5.js'" 2>nul

echo   - Manifestos...
powershell -Command "Invoke-WebRequest -Uri '%BASE%/_next/static/dprM6_grQdUGSszN6fUDE/_buildManifest.js' -OutFile '%DIR%\_next\static\dprM6_grQdUGSszN6fUDE\_buildManifest.js'" 2>nul
powershell -Command "Invoke-WebRequest -Uri '%BASE%/_next/static/dprM6_grQdUGSszN6fUDE/_ssgManifest.js' -OutFile '%DIR%\_next\static\dprM6_grQdUGSszN6fUDE\_ssgManifest.js'" 2>nul
powershell -Command "Invoke-WebRequest -Uri '%BASE%/_next/static/dprM6_grQdUGSszN6fUDE/_clientMiddlewareManifest.json' -OutFile '%DIR%\_next\static\dprM6_grQdUGSszN6fUDE\_clientMiddlewareManifest.json'" 2>nul

echo   - Fuentes...
powershell -Command "Invoke-WebRequest -Uri '%BASE%/_next/static/media/797e433ab948586e-s.p.dbea232f.woff2' -OutFile '%DIR%\_next\static\media\797e433ab948586e-s.p.dbea232f.woff2'" 2>nul
powershell -Command "Invoke-WebRequest -Uri '%BASE%/_next/static/media/caa3a2e1cccd8315-s.p.853070df.woff2' -OutFile '%DIR%\_next\static\media\caa3a2e1cccd8315-s.p.853070df.woff2'" 2>nul
powershell -Command "Invoke-WebRequest -Uri '%BASE%/_next/static/media/4fa387ec64143e14-s.c1fdd6c2.woff2' -OutFile '%DIR%\_next\static\media\4fa387ec64143e14-s.c1fdd6c2.woff2'" 2>nul
powershell -Command "Invoke-WebRequest -Uri '%BASE%/_next/static/media/7178b3e590c64307-s.b97b3418.woff2' -OutFile '%DIR%\_next\static\media\7178b3e590c64307-s.b97b3418.woff2'" 2>nul
powershell -Command "Invoke-WebRequest -Uri '%BASE%/_next/static/media/8a480f0b521d4e75-s.8e0177b5.woff2' -OutFile '%DIR%\_next\static\media\8a480f0b521d4e75-s.8e0177b5.woff2'" 2>nul
powershell -Command "Invoke-WebRequest -Uri '%BASE%/_next/static/media/bbc41e54d2fcbd21-s.799d8ef8.woff2' -OutFile '%DIR%\_next\static\media\bbc41e54d2fcbd21-s.799d8ef8.woff2'" 2>nul

echo   - Imagenes y logos...
powershell -Command "Invoke-WebRequest -Uri '%BASE%/favicon-a2k.png' -OutFile '%DIR%\favicon-a2k.png'" 2>nul
powershell -Command "Invoke-WebRequest -Uri '%BASE%/logo-a2k-pro.png' -OutFile '%DIR%\logo-a2k-pro.png'" 2>nul
powershell -Command "Invoke-WebRequest -Uri '%BASE%/logo-a2k.jpeg' -OutFile '%DIR%\logo-a2k.jpeg'" 2>nul
powershell -Command "Invoke-WebRequest -Uri '%BASE%/logo.svg' -OutFile '%DIR%\logo.svg'" 2>nul
powershell -Command "Invoke-WebRequest -Uri '%BASE%/trading-bot-logo.png' -OutFile '%DIR%\trading-bot-logo.png'" 2>nul

echo   - robots.txt
powershell -Command "Invoke-WebRequest -Uri '%BASE%/robots.txt' -OutFile '%DIR%\robots.txt'" 2>nul

echo.
echo [3/4] Creando configuracion Firebase...
(
echo {
echo   "hosting": {
echo     "public": ".",
echo     "ignore": [
echo       "firebase.json",
echo       "**/.*",
echo       "**/node_modules/**"
echo     ],
echo     "rewrites": [
echo       {
echo         "source": "**",
echo         "destination": "/index.html"
echo       }
echo     ]
echo   }
echo }
) > %DIR%\firebase.json

(
echo {
echo   "projects": {
echo     "default": "synthtrade-pro"
echo   }
echo }
) > %DIR%\.firebaserc

echo.
echo ============================================
echo [4/4] Desplegando en Firebase...
echo Se abrira el navegador para iniciar sesion.
echo ============================================
echo.

cd %DIR%
call firebase deploy --project synthtrade-pro

echo.
echo ============================================
echo    DESPLIEGUE COMPLETADO!
echo    Tu bot: https://synthtrade-pro.web.app
echo    by A2K DIGITAL STUDIO
echo ============================================
echo.
pause
