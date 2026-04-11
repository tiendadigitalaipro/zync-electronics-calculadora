@echo off
title SynthTrade Pro - Deploy Firebase
color 0A
echo ============================================
echo    A2K DIGITAL STUDIO
echo    SynthTrade Pro - Despliegue Firebase
echo ============================================
echo.
echo [PASO 1] Iniciando sesion en Firebase...
echo Se abrira una ventana del navegador para que inicies sesion.
echo.
call firebase login
echo.
echo ============================================
echo [PASO 2] Desplegando en Firebase Hosting...
echo Esto puede tardar 1-2 minutos...
echo.
call firebase deploy --project synthtrade-pro
echo.
echo ============================================
echo    DESPLIEGUE COMPLETADO!
echo    Tu bot estara en: https://synthtrade-pro.web.app
echo ============================================
echo.
pause
