@echo off
chcp 65001 >nul
title SCMS Frontend Dev Server (Port 3004)
echo ============================================================
echo   SCMS FRONTEND - REACT + VITE
echo   URL: http://localhost:3004
echo ============================================================
echo.

cd /d "%~dp0Frontend"

if not exist node_modules (
    echo [INFO] Thu vien node_modules chua ton tai, dang cai dat bang npm ci...
    call npm ci
)

echo Dang khoi chay Vite dev server...
call npm run dev

if %errorLevel% neq 0 (
    echo.
    echo [ERROR] Frontend gap loi khi khoi chay!
    pause
)

