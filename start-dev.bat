@echo off
cd /d "%~dp0"
echo ========================================
echo   SkllPlayer - Development Mode
echo ========================================
echo.

:: Kill any existing Electron processes
taskkill /f /im electron.exe 2>nul

:: Start Vite dev server in a new terminal
echo [1/3] Starting Vite dev server...
start "Vite Dev Server" cmd /k "npm run dev:renderer"

:: Wait for Vite to start
echo [2/3] Waiting for Vite to be ready...
:waitloop
timeout /t 1 /nobreak >nul
curl -s http://localhost:5173 >nul 2>&1
if errorlevel 1 goto waitloop
echo       Vite is ready!

:: Build main process
echo [3/3] Building main process...
call npx tsc -p tsconfig.main.json
if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Starting Electron with DevTools...
echo   Press Ctrl+C to stop
echo ========================================
echo.

:: Start Electron with DevTools enabled (keeps CMD open for debug logs)
set SKLLPLAYER_DEV=1
npx electron .
