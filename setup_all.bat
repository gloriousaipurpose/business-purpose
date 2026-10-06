@echo off
echo ========================================================
echo   Setting up Business Opportunity Radar (Backend & Frontend)
echo ========================================================
echo.

echo [1/4] Setting up Backend Virtual Environment...
cd /d "%~dp0backend"
if not exist "venv" (
    python -m venv venv
    echo Virtual environment created.
) else (
    echo Virtual environment already exists.
)

call venv\Scripts\activate.bat

echo.
echo [2/4] Installing Backend Python Dependencies...
pip install -r requirements.txt

echo.
echo [3/4] Running Alembic Migrations and Seeding Sample Data...
if not exist ".env" (
    copy .env.example .env
    echo Created .env file from .env.example. Please update GROQ_API_KEY in .env if needed!
)
python -m alembic upgrade head
python seed.py

echo.
echo [4/4] Installing Frontend NPM Dependencies...
cd /d "%~dp0frontend"
call npm install

echo.
echo ========================================================
echo   Setup Complete!
echo   To start the application:
echo   Double click "run_all.bat" or run start_backend.bat and start_frontend.bat
echo ========================================================
pause
