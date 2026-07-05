@echo off
echo ========================================
echo   Regal School System - Starting...
echo ========================================
echo.

echo [1/2] Starting Backend Server...
start "Backend" cmd /c "cd /d "%~dp0backend" && node server.js"
timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Server...
start "Frontend" cmd /c "cd /d "%~dp0frontend" && npx vite --port 5173 --host"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   Both servers started!
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:5173
echo ========================================
echo.
echo Press any key to open browser...
pause >nul
start http://localhost:5173
