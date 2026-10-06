@echo off
title Business Radar - Frontend Dashboard (Port 5173)
cd /d "%~dp0frontend"
echo Starting Business Opportunity Radar Frontend Dashboard on http://localhost:5173 ...
call npm run dev
pause
