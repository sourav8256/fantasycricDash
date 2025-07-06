const express = require('express');
const app = express();

// Sample strategies data
const strategies = [
    {
        id: "double-calendar",
        name: "Double Calendar",
        type: "Time Based",
        instrument: "NIFTY"
    },
    {
        id: "straddle-hedge",
        name: "Straddle with Hedge",
        type: "Time Based",
        instrument: "BANKNIFTY"
    },
    {
        id: "bollinger-reversal",
        name: "Bollinger Band Reversal",
        type: "Indicator Based",
        instrument: "FINNIFTY"
    }
];

app.get('/api/strategies', (req, res) => {
    res.json(strategies);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 