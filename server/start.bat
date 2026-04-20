@echo off
echo ========================================
echo   DakshAI Voice Server (Whisper + TTS)
echo ========================================

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.10+
    pause
    exit /b 1
)

:: Install deps if not already installed
echo Checking / installing dependencies...
pip install -r requirements.txt --quiet

echo.
echo Starting server on http://localhost:5001
echo Press Ctrl+C to stop.
echo.
python main.py
pause
