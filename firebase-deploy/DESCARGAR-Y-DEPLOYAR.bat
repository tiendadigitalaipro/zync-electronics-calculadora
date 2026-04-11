@echo off
title A2K DIGITAL STUDIO - Descarga y Deploy
color 0A
echo ============================================
echo    A2K DIGITAL STUDIO
echo    SynthTrade Pro - Descarga + Firebase
echo ============================================
echo.

set BASE=https://preview-5ff1bba5-06eb-4c94-a7d4-b43fdda1ffc6.space.chatglm.site
set D=%USERPROFILE%\Desktop\synthtrade-deploy

echo [1/3] Limpiando carpeta anterior...
if exist "%D%" rmdir /s /q "%D%"
mkdir "%D%"
mkdir "%D%\_next\static\chunks"
mkdir "%D%\_next\static\media"
mkdir "%D%\_next\static\dprM6_grQdUGSszN6fUDE"
mkdir "%D%\404"
mkdir "%D%\_not-found"

echo.
echo [2/3] Descargando archivos con curl...
echo.

curl.exe -sL "%BASE%/index.html" -o "%D%\index.html" && echo   OK index.html || echo   FAIL index.html
curl.exe -sL "%BASE%/404.html" -o "%D%\404.html" && echo   OK 404.html || echo   FAIL 404.html
curl.exe -sL "%BASE%/favicon-a2k.png" -o "%D%\favicon-a2k.png" && echo   OK favicon-a2k.png || echo   FAIL favicon-a2k.png
curl.exe -sL "%BASE%/logo-a2k-pro.png" -o "%D%\logo-a2k-pro.png" && echo   OK logo-a2k-pro.png || echo   FAIL logo-a2k-pro.png
curl.exe -sL "%BASE%/logo-a2k.jpeg" -o "%D%\logo-a2k.jpeg" && echo   OK logo-a2k.jpeg || echo   FAIL logo-a2k.jpeg
curl.exe -sL "%BASE%/logo.svg" -o "%D%\logo.svg" && echo   OK logo.svg || echo   FAIL logo.svg
curl.exe -sL "%BASE%/trading-bot-logo.png" -o "%D%\trading-bot-logo.png" && echo   OK trading-bot-logo.png || echo   FAIL trading-bot-logo.png
curl.exe -sL "%BASE%/robots.txt" -o "%D%\robots.txt" && echo   OK robots.txt || echo   FAIL robots.txt

echo.
echo   JS y CSS...
curl.exe -sL "%BASE%/_next/static/chunks/b14620cfbf6f2481.js" -o "%D%\_next\static\chunks\b14620cfbf6f2481.js" && echo   OK b14620cfbf6f2481.js || echo   FAIL b14620cfbf6f2481.js
curl.exe -sL "%BASE%/_next/static/chunks/turbopack-979f305e5cb781c4.js" -o "%D%\_next\static\chunks\turbopack-979f305e5cb781c4.js" && echo   OK turbopack-979f305e5cb781c4.js || echo   FAIL turbopack
curl.exe -sL "%BASE%/_next/static/chunks/164523eb4661b623.css" -o "%D%\_next\static\chunks\164523eb4661b623.css" && echo   OK 164523eb4661b623.css || echo   FAIL css1
curl.exe -sL "%BASE%/_next/static/chunks/a6dad97d9634a72d.js" -o "%D%\_next\static\chunks\a6dad97d9634a72d.js" && echo   OK a6dad97d9634a72d.js || echo   FAIL a6dad
curl.exe -sL "%BASE%/_next/static/chunks/d12eb619654412dc.js" -o "%D%\_next\static\chunks\d12eb619654412dc.js" && echo   OK d12eb619654412dc.js || echo   FAIL d12eb
curl.exe -sL "%BASE%/_next/static/chunks/d68b387a08693f57.js" -o "%D%\_next\static\chunks\d68b387a08693f57.js" && echo   OK d68b387a08693f57.js || echo   FAIL d68b
curl.exe -sL "%BASE%/_next/static/chunks/771dedee3f5e1621.js" -o "%D%\_next\static\chunks\771dedee3f5e1621.js" && echo   OK 771dedee3f5e1621.js || echo   FAIL 771d
curl.exe -sL "%BASE%/_next/static/chunks/3ce5c412301dead0.js" -o "%D%\_next\static\chunks\3ce5c412301dead0.js" && echo   OK 3ce5c412301dead0.js || echo   FAIL 3ce5c
curl.exe -sL "%BASE%/_next/static/chunks/58c60a5fa6b544da.js" -o "%D%\_next\static\chunks\58c60a5fa6b544da.js" && echo   OK 58c60a5fa6b544da.js || echo   FAIL 58c6
curl.exe -sL "%BASE%/_next/static/chunks/2473c16c0c2f6b5f.css" -o "%D%\_next\static\chunks\2473c16c0c2f6b5f.css" && echo   OK 2473c16c0c2f6b5f.css || echo   FAIL css2
curl.exe -sL "%BASE%/_next/static/chunks/74f1b9da08b28ae5.js" -o "%D%\_next\static\chunks\74f1b9da08b28ae5.js" && echo   OK 74f1b9da08b28ae5.js || echo   FAIL 74f1b

echo.
echo   Manifestos...
curl.exe -sL "%BASE%/_next/static/dprM6_grQdUGSszN6fUDE/_buildManifest.js" -o "%D%\_next\static\dprM6_grQdUGSszN6fUDE\_buildManifest.js" && echo   OK _buildManifest.js || echo   FAIL build
curl.exe -sL "%BASE%/_next/static/dprM6_grQdUGSszN6fUDE/_ssgManifest.js" -o "%D%\_next\static\dprM6_grQdUGSszN6fUDE\_ssgManifest.js" && echo   OK _ssgManifest.js || echo   FAIL ssg
curl.exe -sL "%BASE%/_next/static/dprM6_grQdUGSszN6fUDE/_clientMiddlewareManifest.json" -o "%D%\_next\static\dprM6_grQdUGSszN6fUDE\_clientMiddlewareManifest.json" && echo   OK _clientMW.json || echo   FAIL clientMW

echo.
echo   Fuentes (opcional)...
curl.exe -sL "%BASE%/_next/static/media/797e433ab948586e-s.p.dbea232f.woff2" -o "%D%\_next\static\media\797e433ab948586e-s.p.dbea232f.woff2" && echo   OK font1 || echo   SKIP font1
curl.exe -sL "%BASE%/_next/static/media/caa3a2e1cccd8315-s.p.853070df.woff2" -o "%D%\_next\static\media\caa3a2e1cccd8315-s.p.853070df.woff2" && echo   OK font2 || echo   SKIP font2
curl.exe -sL "%BASE%/_next/static/media/4fa387ec64143e14-s.c1fdd6c2.woff2" -o "%D%\_next\static\media\4fa387ec64143e14-s.c1fdd6c2.woff2" && echo   OK font3 || echo   SKIP font3
curl.exe -sL "%BASE%/_next/static/media/7178b3e590c64307-s.b97b3418.woff2" -o "%D%\_next\static\media\7178b3e590c64307-s.b97b3418.woff2" && echo   OK font4 || echo   SKIP font4
curl.exe -sL "%BASE%/_next/static/media/8a480f0b521d4e75-s.8e0177b5.woff2" -o "%D%\_next\static\media\8a480f0b521d4e75-s.8e0177b5.woff2" && echo   OK font5 || echo   SKIP font5
curl.exe -sL "%BASE%/_next/static/media/bbc41e54d2fcbd21-s.799d8ef8.woff2" -o "%D%\_next\static\media\bbc41e54d2fcbd21-s.799d8ef8.woff2" && echo   OK font6 || echo   SKIP font6

echo.
echo [3/3] Creando firebase.json...
echo {"hosting":{"public":".","rewrites":[{"source":"**","destination":"/index.html"}]}} > "%D%\firebase.json"

echo.
echo ============================================
echo   Verificando archivos descargados...
echo ============================================
echo.
dir /b "%D%" | find /c /v ""
echo archivos en carpeta principal
echo.
dir /b /s "%D%\_next" | find /c /v ""
echo archivos en carpeta _next
echo.

echo ============================================
echo Si ves archivos arriba, ejecuta esto:
echo cd Desktop\synthtrade-deploy
echo firebase deploy --project synthtrade-pro
echo ============================================
echo.
pause
