@echo off
title Billing System EXE Builder
cd /d "%~dp0"
echo =======================================================
echo          Building Standalone BillingSystem.exe
echo =======================================================
echo.
if exist venv\Scripts\python.exe (
    venv\Scripts\python.exe build_exe.py
) else (
    python build_exe.py
)
echo.
pause
