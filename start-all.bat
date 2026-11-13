@echo off
chcp 65001 >nul
title SCMS Full-Stack Launcher (Sports Center Management)

echo =====================================================================
echo    SPORTS CENTER MANAGEMENT SYSTEM (SCMS) - AUTO LAUNCHER
echo =====================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-all.ps1"

if %errorLevel% neq 0 (
    echo.
    echo [ERROR] Co loi xay ra khi khoi dong he thong!
    echo Vui long kiem tra lai thong bao loi o tren.
    echo.
    pause
)

