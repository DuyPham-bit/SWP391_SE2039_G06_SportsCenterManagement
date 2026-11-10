@echo off
title SCMS Backend API Server (Persistent)
echo ============================================================
echo   KHOI DONG BACKEND API SPORTS CENTER MANAGEMENT (PORT 5000)
echo ============================================================
echo.

set ASPNETCORE_ENVIRONMENT=Development
set Database__SeedDemoData=false

cd /d "%~dp0Backend\SportsCenterManagement.API"

echo Dang khoi chay ASP.NET Core API tai http://localhost:5000 ...
dotnet run --no-launch-profile --urls "http://0.0.0.0:5000"

pause

