@echo off
chcp 65001 >nul
title SCMS Shutdown
echo =====================================================================
echo    DANG DUNG HE THONG SPORTS CENTER MANAGEMENT (BE ^& FE)...
echo =====================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-all.ps1"

echo.
ping 127.0.0.1 -n 3 >nul
