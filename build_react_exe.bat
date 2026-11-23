@echo off
echo ========================================================
echo       SwiftBill Pro - React Standalone EXE Builder
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Building React production bundle...
cd react-app
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] React build failed!
    pause
    exit /b %ERRORLEVEL%
)
cd ..

echo [2/3] Compiling SwiftBill-Pro.exe (Windows GUI)...
"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe" /target:winexe /win32icon:app_icon.ico /out:SwiftBill-Pro.exe Launcher.cs /r:System.dll,System.Core.dll,System.Windows.Forms.dll
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] C# compilation failed!
    pause
    exit /b %ERRORLEVEL%
)

copy /y SwiftBill-Pro.exe react-app\SwiftBill-Pro.exe >nul

echo [3/3] Compiling Inno Setup Installer...
if exist "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" (
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" installer_react.iss
    echo.
    echo Setup installer ready at dist_installer\SwiftBill-Pro_Setup.exe
)

echo.
echo ========================================================
echo SUCCESS! SwiftBill-Pro.exe and Setup Installer ready.
echo ========================================================
pause
