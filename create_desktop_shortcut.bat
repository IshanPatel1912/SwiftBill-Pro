@echo off
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut((Join-Path ([Environment]::GetFolderPath('Desktop')) 'SwiftBill Pro.lnk')); $s.TargetPath = '%~dp0SwiftBill-Pro.exe'; $s.WorkingDirectory = '%~dp0'; $s.IconLocation = '%~dp0app_icon.ico,0'; $s.Description = 'SwiftBill Pro - Modern Retail POS System (React Edition)'; $s.Save()"
echo Desktop shortcut created successfully!
pause
