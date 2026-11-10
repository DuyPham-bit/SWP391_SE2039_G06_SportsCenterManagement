@echo off
title Khoi dong PostgreSQL (Docker)
echo ============================================================
echo   DANG KHOI DONG POSTGRESQL CHO PROJECT
echo ============================================================
cd /d "%~dp0"
docker compose -f docker\docker-compose.yml --env-file docker\.env up -d postgres
if %errorLevel% neq 0 (
    echo [LOI] Khong the khoi dong PostgreSQL. Kiem tra Docker Desktop va docker\.env.
) else (
    echo PostgreSQL da khoi dong tai 127.0.0.1:5432.
)
timeout /t 3
