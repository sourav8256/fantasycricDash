const executeStrategy = require('../live/strategyExecutor');

// Mock data
const mockSymbol = 'AAPL';
const mockPrice = 150.25;
const mockTimestamp = new Date().toISOString();
const mockEntryPrice = 130.50;
const mockEntryQuantity = 100;
const mockProfitLimit = 15000; // Added mock profit limit
const mockStopLoss = 120.00; // Stop loss price
const mockOnStoplossProfit = 10; // Added mock onStoplossProit
const mockTrailBy = 5; // Added mock trailBy

// Parse time strings to Date objects
const parseTimeString = (timeStr) => {
    const today = new Date();
    const [timePart, meridiem] = timeStr.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    
    // Convert to 24-hour format if PM
    if (meridiem.toUpperCase() === 'PM' && hours < 12) {
        hours += 12;
    }
    // Convert 12 AM to 0 hours
    if (meridiem.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
    }
    
    today.setHours(hours, minutes, 0, 0);
    return today;
};

// Mock time strings
const mockStartTimeStr = '12:30 AM';
const mockStopTimeStr = '03:00 AM';

// Parse into Date objects
const mockStartTime = parseTimeString(mockStartTimeStr);
const mockStopTime = parseTimeString(mockStopTimeStr);

// Create params object as expected by executeStrategy
const params = {
    symbol: mockSymbol,
    price: mockPrice,
    timestamp: mockTimestamp,
    entryPrice: mockEntryPrice,
    entryQuantity: mockEntryQuantity,
    profitLimit: mockProfitLimit,
    stopLoss: mockStopLoss,
    startTime: mockStartTime,
    stopTime: mockStopTime,
    onStoplossProfit: mockOnStoplossProfit,
    trailBy: mockTrailBy
};

// Call the executeStrategy function with params object
executeStrategy(params)
    .then(result => {
        console.log('Execution result:', result);
    })
    .catch(error => {
        console.error('Error during execution:', error);
    });
