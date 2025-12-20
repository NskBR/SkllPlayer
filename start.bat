@echo off
cd /d "%~dp0"

echo Compilando TypeScript...
call npx tsc -p tsconfig.main.json

echo Iniciando Vite...
start "" npx vite

echo Aguardando servidor...
:wait
timeout /t 1 /nobreak >nul
curl -s http://localhost:5173 >nul 2>&1
if errorlevel 1 goto wait

echo Iniciando Electron...
npx electron .
