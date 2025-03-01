#!/bin/bash

# Function to handle cleanup on script exit
cleanup() {
    echo "Shutting down all services..."
    # pm2 delete all
    exit
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM

# Function to start or restart a service
start_or_restart_service() {
    local service_name=$1
    local start_command=$2
    if pm2 describe "$service_name" > /dev/null; then
        echo "Restarting $service_name..."
        pm2 restart "$service_name"
    else
        echo "Starting $service_name..."
        eval "$start_command"
    fi
}

# Start or restart frontend server
cd frontend
start_or_restart_service "frontend" "pm2 start npm --name 'frontend' -- start"

# Start or restart backend server
cd ../backend
start_or_restart_service "backend" "pm2 start npm --name 'backend' -- start"

# Start or restart live server
cd ../live
start_or_restart_service "live" "pm2 start npm --name 'live' -- start"

# Start or restart mock market server
cd ../mockmarket
start_or_restart_service "mockmarket" "pm2 start app.js --name 'mockmarket'"

# Show running processes
echo "All services started or restarted. Use 'pm2 list' to check status."
pm2 list

# Keep script running and show logs
echo "Showing logs from all services. Press Ctrl+C to stop all services."
pm2 logs
