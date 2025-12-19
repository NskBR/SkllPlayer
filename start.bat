@echo off
cd /d "%~dp0"
echo Building main process...
call npx tsc -p tsconfig.main.json
if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)
echo Starting SkllPlayer...
start "" npx electron .
