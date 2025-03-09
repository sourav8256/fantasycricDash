@echo off
echo Stopping AlgoTrade application...

:: Stop the backend server using PM2
echo Stopping backend server...
pm2 stop backend
echo Backend server stopped.

:: Stop the live server using PM2
echo Stopping live server...
pm2 stop live
echo Live server stopped.

:: Stop the mockmarket server using PM2
echo Stopping mockmarket server...
pm2 stop mockmarket
echo Mockmarket server stopped.

:: Stop the frontend using PM2
echo Stopping frontend...
pm2 stop frontend
echo Frontend stopped.

:: Optional: Stop all PM2 processes at once
:: pm2 stop all

echo.
echo All AlgoTrade processes have been stopped.
pause