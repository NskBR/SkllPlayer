@echo off
cd /d "%~dp0"
echo Starting SkllPlayer in development mode...
echo.
echo This will start the Vite dev server and Electron.
echo Press Ctrl+C in each terminal to stop.
echo.

:: Kill any existing Electron processes
taskkill /f /im electron.exe 2>nul

:: Start Vite dev server in a new terminal
start "Vite Dev Server" cmd /k "npm run dev:renderer"

:: Wait for Vite to start
echo Waiting for Vite dev server to start...
timeout /t 5 /nobreak >nul

:: Build and start Electron
echo Building main process...
call npx tsc -p tsconfig.main.json
if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)
echo Starting Electron...
npx electron .
