@echo off
title Khoi dong SQL Server (MSSQLSERVER)
echo ============================================================
echo   DANG KHOI DONG DICH VU SQL SERVER CHO PROJECT
echo ============================================================
echo.

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] Dang mo hop thoai yeu cau quyen Administrator (UAC)...
    echo [INFO] Vui long bam "Yes" tren man hinh de khoi dong SQL Server.
    powershell -Command "Start-Process cmd -Verb RunAs -ArgumentList '/c net start MSSQLSERVER & echo. & echo SQL Server da khoi dong thanh cong! & timeout /t 3'"
) else (
    echo [INFO] Dang khoi dong MSSQLSERVER...
    net start MSSQLSERVER
    echo.
    echo SQL Server da khoi dong thanh cong!
    timeout /t 3
)

