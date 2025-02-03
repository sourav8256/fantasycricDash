#!/bin/bash

# Function to handle cleanup on script exit
cleanup() {
    echo "Shutting down servers..."
    kill $(jobs -p)
    exit
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM

# Start frontend server
echo "Starting frontend server on port 4300..."
cd frontend && npm start &

# Wait a bit for frontend to initialize
sleep 2

# Start backend server
echo "Starting backend server on port 4301..."
cd backend && npm start &

# Wait a bit for backend to initialize
sleep 2

# Start live server
echo "Starting live server on port 4302..."
cd live && npm start &

# Keep script running and show logs
echo "All servers are running. Press Ctrl+C to stop all servers."
wait
