@echo off
chcp 65001 >nul
title SCMS Backend API Server (Port 5000 - PostgreSQL)
echo ============================================================
echo   SCMS BACKEND API - ASP.NET CORE (.NET 10 + PostgreSQL)
echo   Endpoint: http://localhost:5000
echo   Swagger:  http://localhost:5000/swagger
echo ============================================================
echo.

set ASPNETCORE_ENVIRONMENT=Development
set Database__SeedDemoData=false

cd /d "%~dp0Backend\SportsCenterManagement.API"

echo Dang khoi chay ASP.NET Core API...
dotnet run --no-launch-profile --urls "http://0.0.0.0:5000"

if %errorLevel% neq 0 (
    echo.
    echo [ERROR] Backend gap loi khi khoi chay!
    pause
)
