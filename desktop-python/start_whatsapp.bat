@echo off
title WhatsApp Gateway for Billing System
echo ========================================================
echo Starting WhatsApp Gateway for Billing System...
echo ========================================================
cd /d %~dp0whatsapp_bridge
if not exist node_modules (
    echo Installing required packages...
    npm install
)
node server.js
pause