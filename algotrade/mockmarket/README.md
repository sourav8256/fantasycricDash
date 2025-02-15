# Mock Market Server

A simulated market data server that provides real-time price updates and trading capabilities through REST API and WebSocket connections.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
node app.js
```

The server will run on port 5555 by default (configurable via PORT environment variable).

## Available Symbols

The mock market provides data for the following symbols:
- AAPL (Apple)
- GOOGL (Google)
- MSFT (Microsoft)
- AMZN (Amazon)
- TSLA (Tesla)

## REST API Endpoints

### Price Data
- Get all prices: `GET /api/prices`
- Get specific symbol price: `GET /api/price/:symbol`
- Validate symbol: `GET /api/validate/:symbol`
- Validate multiple symbols: `POST /api/validate`
  ```json
  {
    "symbols": ["AAPL", "GOOGL"]
  }
  ```

### Trading
- Enter trade: `POST /api/trade/enter`
  ```json
  {
    "symbol": "AAPL",
    "quantity": 100
  }
  ```
- Exit trade: `POST /api/trade/exit/:tradeId`
- Get trade status: `GET /api/trade/:tradeId`
- Get all active trades: `GET /api/trades`

## WebSocket API

### Connection
Connect to the WebSocket server at: `ws://localhost:5555`

### Message Format
All messages are JSON formatted.

### Subscribe to Price Updates
```json
{
  "action": "subscribe",
  "symbols": ["AAPL", "GOOGL"]
}
```

### Unsubscribe from Price Updates
```json
{
  "action": "unsubscribe",
  "symbols": ["AAPL", "GOOGL"]
}
```

### Price Update Message Format
The server sends price updates every 5 seconds for subscribed symbols:
```json
{
  "event": "price_update",
  "symbol": "AAPL",
  "data": {
    "price": 150.25,
    "volume": 1000000,
    "timestamp": "2024-03-14T12:00:00.000Z"
  }
}
```

## Example Usage

### REST API Example (JavaScript)
```javascript
// Get all prices
fetch('http://localhost:5555/api/prices')
  .then(response => response.json())
  .then(data => console.log(data));

// Enter a trade
fetch('http://localhost:5555/api/trade/enter', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    symbol: 'AAPL',
    quantity: 100
  })
})
  .then(response => response.json())
  .then(data => console.log(data));
```

### WebSocket Example (JavaScript)
```javascript
const ws = new WebSocket('ws://localhost:5555');

ws.onopen = () => {
  // Subscribe to symbols
  ws.send(JSON.stringify({
    action: 'subscribe',
    symbols: ['AAPL', 'GOOGL']
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

## Notes
- Price updates occur every 5 seconds with random variations
- All prices include simulated latency (0-100ms)
- WebSocket connections receive real-time price updates for subscribed symbols
- All symbol names are case-insensitive 