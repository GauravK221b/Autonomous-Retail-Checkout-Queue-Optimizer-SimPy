@echo off
echo ====================================================================
echo Starting OptiQueue AI - Autonomous Retail Checkout Queue Optimizer
echo ====================================================================
echo.

start "OptiQueue AI - Python Backend" cmd /k "python backend/app.py"
timeout /t 3 /nobreak >nul

start "OptiQueue AI - React Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are launching:
echo - Backend API:  http://127.0.0.1:5000
echo - Frontend Web: http://localhost:5173
echo.
echo Opening browser...
timeout /t 2 /nobreak >nul
start http://localhost:5173
