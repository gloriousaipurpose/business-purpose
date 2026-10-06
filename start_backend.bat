@echo off
title Business Radar - Backend Server (Port 8000)
cd /d "%~dp0backend"
echo Starting Business Opportunity Radar Backend Server on http://127.0.0.1:8000 ...
python -m uvicorn app.main:app --reload --port 8000
pause
