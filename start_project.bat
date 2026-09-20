@echo off
title AI Career Preparation Agent Launcher
echo ============================================================
echo  Starting AI Career Preparation Agent
echo  Candidate: Chandolu Praneeth Kumar (241FA18483)
echo ============================================================
echo.
echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "AI Career Agent - Backend (FastAPI)" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --port 8000 --reload"
echo [2/2] Starting React Frontend on http://localhost:5173 ...
start "AI Career Agent - Frontend (Vite)" cmd /k "cd /d %~dp0 && npm run dev"
timeout /t 3 /nobreak >nul
echo Opening application in your browser...
start http://localhost:5173
echo.
echo ============================================================
echo  Both servers are running!
echo  Keep the two opened command windows active while using the app.
echo ============================================================

