@echo off
echo Starting Business Opportunity Radar Backend & Frontend...
start "Business Radar Backend (Port 8000)" cmd /k "%~dp0start_backend.bat"
start "Business Radar Frontend (Port 5173)" cmd /k "%~dp0start_frontend.bat"
echo.
echo ========================================================
echo   Backend and Frontend servers launched in new windows!
echo   Dashboard UI: http://localhost:5173
echo   API Docs:     http://127.0.0.1:8000/docs
echo ========================================================
