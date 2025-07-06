# Live Trading Server

A WebSocket-based live trading server for real-time market data and automated trading.

## WebSocket API Specification

### Connection Details
- WebSocket URL: `ws://localhost:4302`
- Default Port: 4302

### Message Format
All messages are sent as JSON strings. Each message must have a `type` field specifying the message type.

### 1. Subscribe to Symbol
**Client -> Server:**
```json
{
    "type": "subscribe",
    "symbol": "NIFTY"
}
```

### 2. Unsubscribe from Symbol
**Client -> Server:**
```json
{
    "type": "unsubscribe",
    "symbol": "NIFTY"
}
```

### 3. Price Update Message
**Server -> Client:**
```json
{
    "event": "price_update",
    "symbol": "NIFTY",
    "data": {
        "price": 18500.25,
        "timestamp": "2024-01-01T10:00:00.000Z"
    }
}
```

### 4. Connection Acknowledgment
**Server -> Client (on connection):**
```json
{
    "event": "connected",
    "message": "Connected to trading server",
    "timestamp": "2024-01-01T10:00:00.000Z"
}
```

### 5. Heartbeat Message
**Server -> Client (every 30 seconds):**
```json
{
    "event": "heartbeat",
    "timestamp": "2024-01-01T10:00:00.000Z",
    "subscribedSymbols": ["NIFTY", "BANKNIFTY"]
}
```

## REST API Endpoints

### Deployed Strategies

#### Get All Deployed Strategies
```
GET /api/deployed-strategies
```
Response:
```json
[
    {
        "_id": "strategy_id",
        "name": "Strategy Name",
        "instrument": "NIFTY",
        "mode": "paper",
        "status": "Running",
        "deployedAt": "2024-01-01T10:00:00.000Z"
    }
]
```

#### Delete Deployed Strategy
```
DELETE /api/deployed-strategies/:id
```
Response:
```json
{
    "message": "Strategy deleted successfully"
}
```

## Example Usage

```javascript
// Connect to WebSocket server
const ws = new WebSocket('ws://localhost:4302');

// Handle connection open
ws.onopen = () => {
    console.log('Connected to trading server');
    
    // Subscribe to a symbol
    ws.send(JSON.stringify({
        type: 'subscribe',
        symbol: 'NIFTY'
    }));
};

// Handle incoming messages
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    switch(data.event) {
        case 'price_update':
            console.log(`${data.symbol}: ₹${data.data.price}`);
            break;
        case 'heartbeat':
            console.log('Server heartbeat received');
            break;
        case 'connected':
            console.log('Connection acknowledged');
            break;
    }
};

// Handle connection close
ws.onclose = () => {
    console.log('Disconnected from trading server');
};
```

## Testing

You can test the WebSocket connection using the built-in test interface:
1. Open `http://localhost:4302/test` in your browser
2. Enter a symbol and click Subscribe
3. Watch real-time price updates

## Error Handling

The server may send error messages in the following format:
```json
{
    "event": "error",
    "message": "Error description",
    "code": "ERROR_CODE"
}
```

Common error codes:
- `INVALID_SYMBOL`: Symbol not found or invalid
- `SUBSCRIPTION_FAILED`: Failed to subscribe to symbol
- `CONNECTION_ERROR`: Market feed connection error

## Notes

- All timestamps are in ISO 8601 format
- Price updates are sent in real-time as they arrive from the market feed
- Heartbeat messages help maintain connection status
- Unsubscribe from symbols when they're no longer needed
- Handle WebSocket reconnection in case of disconnection

## Features

- Real-time market data streaming via WebSocket
- Strategy management and deployment
- Automated strategy execution
- Risk management controls
- Logging system for both system and strategy events
- Support for paper and live trading modes

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Mock Market Server (for testing)

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
