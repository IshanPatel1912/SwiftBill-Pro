@echo off
title SwiftBill Pro - React Modern UI
cd /d "%~dp0"
echo ========================================================
echo       SwiftBill Pro - Modern Retail POS (React)
echo ========================================================
echo.
echo Launching browser at http://localhost:5173 ...
timeout /t 2 >nul
start http://localhost:5173
npm run dev
