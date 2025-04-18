@echo off
echo Starting components...

:: Store the directory where the batch file is located
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

:: Check if directories exist
if not exist frontend (
    echo Error: frontend directory not found
    pause
    exit /b 1
)

if not exist backend (
    echo Error: backend directory not found
    pause
    exit /b 1
)

if not exist live (
    echo Error: live directory not found
    pause
    exit /b 1
)

if not exist mockmarket (
    echo Error: mockmarket directory not found
    pause
    exit /b 1
)

if not exist live_feeder (
    echo Error: live_feeder directory not found
    pause
    exit /b 1
)

:: Start all services with PM2
echo Starting frontend server on port 4300...
cd frontend
call pm2 start node --name "frontend" -- server.js
if errorlevel 1 (
    echo Failed to start frontend server
    pause
    exit /b 1
)

echo Starting backend server on port 4301...
cd ..\backend
call pm2 start node --name "backend" -- server.js
if errorlevel 1 (
    echo Failed to start backend server
    pause
    exit /b 1
)
echo Starting live server on port 4302...
cd ..\live
call pm2 start node --name "live" -- server.js
if errorlevel 1 (
    echo Failed to start live server
    pause
    exit /b 1
)

echo Starting mock market server on port 5555...
cd ..\mockmarket
call pm2 start node --name "mockmarket" -- app.js
if errorlevel 1 (
    echo Failed to start mock market server
    pause
    exit /b 1
)

echo Starting live feeder server...
cd ..\live_feeder
call pm2 start node --name "live_feeder" -- app.js
if errorlevel 1 (
    echo Failed to start live feeder server
    pause
    exit /b 1
)

:: Show running processes
echo All services started. Use 'pm2 list' to check status.
pm2 list

:: Show logs
echo Showing logs from all services. Press Ctrl+C to stop all services.
pm2 logs
