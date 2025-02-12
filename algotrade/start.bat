@echo off
echo Starting components...

:: Store the directory where the batch file is located
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo Starting frontend server on port 4300...
if not exist frontend (
    echo Error: frontend directory not found
    pause
    exit /b 1
)
cd frontend
start cmd /c "npm install && npm start"

echo Starting backend server on port 4301...
cd ..
if not exist backend (
    echo Error: backend directory not found
    pause
    exit /b 1
)
cd backend
start cmd /c "npm install && npm start"

echo Starting live server on port 4302...
cd ..
if not exist live (
    echo Error: live directory not found
    pause
    exit /b 1
)
cd live
start cmd /c "npm install && npm start"

echo Starting mock market server on port 5555...
cd ..
if not exist mockmarket (
    echo Error: mockmarket directory not found
    pause
    exit /b 1
)
cd mockmarket
start cmd /c "npm install && npm start"

cd ..
echo All servers are running. Press Ctrl+C to stop all servers.
pause 