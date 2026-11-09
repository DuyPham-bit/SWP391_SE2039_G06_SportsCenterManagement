@echo off
title Khoi dong SCMS Full Stack Docker
echo ============================================================
echo   DANG KHOI DONG TOAN BO HE THONG BANG DOCKER (SQL + BE + FE)
echo ============================================================
docker compose -f docker/docker-compose.yml --env-file docker/.env up -d --build
echo.
echo ============================================================
echo   HE THONG DA KHOI DONG THANH CONG!
echo   - Frontend: http://localhost:3004
echo   - Backend:  http://localhost:5000/swagger
echo ============================================================
pause

