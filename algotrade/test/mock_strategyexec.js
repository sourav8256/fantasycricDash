const executeStrategies = require('../live/strategyExecutor');

// Mock data
const mockSymbol = 'AAPL';
const mockPrice = 150.25;
const mockTimestamp = new Date().toISOString();
const mockLoadedStrategies = ['Strategy1', 'Strategy2'];
const mockEntryPrice = 130.50;
const mockEntryQuantity = 100;
const mockProfitLimit = 15000; // Added mock profit limit
const mockLossLimit = 30; // Added mock loss limit
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

// Call the mock executeStrategies function with params object
executeStrategies({
    symbol: mockSymbol,
    price: mockPrice,
    timestamp: mockTimestamp,
    loadedStrategies: mockLoadedStrategies,
    entryPrice: mockEntryPrice,
    entryQuantity: mockEntryQuantity,
    profitLimit: mockProfitLimit,
    lossLimit: mockLossLimit,
    startTime: mockStartTime,
    stopTime: mockStopTime,
    onStoplossProfit: mockOnStoplossProfit,
    trailBy: mockTrailBy
})
    .then(result => {
        console.log('Execution result:', result);
    })
    .catch(error => {
        console.error('Error during execution:', error);
    });
