@echo off
cd /d "%~dp0"
venv\Scripts\python.exe main.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Application closed with exit code %ERRORLEVEL%.
    pause
)
