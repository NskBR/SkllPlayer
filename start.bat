@echo off
cd /d "%~dp0"

echo Building main process...
call npx tsc -p tsconfig.main.json
if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)

echo Starting Vite dev server...
start /b /min "" npx vite >nul 2>&1

echo Waiting for Vite to be ready...
:waitloop
timeout /t 1 /nobreak >nul
curl -s http://localhost:5173 >nul 2>&1
if errorlevel 1 goto waitloop

echo Starting SkllPlayer...
npx electron .
