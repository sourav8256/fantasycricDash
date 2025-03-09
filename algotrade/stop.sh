#!/bin/bash

echo "Stopping AlgoTrade application..."

# Stop the backend server using PM2
if pm2 describe "backend" > /dev/null 2>&1; then
    echo "Stopping backend server..."
    pm2 stop backend
    echo "Backend server stopped."
else
    echo "Backend server not running in PM2."
fi

# Stop the live server using PM2
if pm2 describe "live" > /dev/null 2>&1; then
    echo "Stopping live server..."
    pm2 stop live
    echo "Live server stopped."
else
    echo "Live server not running in PM2."
fi

# Stop the mockmarket server using PM2
if pm2 describe "mockmarket" > /dev/null 2>&1; then
    echo "Stopping mockmarket server..."
    pm2 stop mockmarket
    echo "Mockmarket server stopped."
else
    echo "Mockmarket server not running in PM2."
fi

# Stop the frontend using PM2
if pm2 describe "frontend" > /dev/null 2>&1; then
    echo "Stopping frontend..."
    pm2 stop frontend
    echo "Frontend stopped."
else
    echo "Frontend not running in PM2."
fi

# Optional: Stop all PM2 processes at once
# pm2 stop all

echo "All AlgoTrade processes have been stopped."