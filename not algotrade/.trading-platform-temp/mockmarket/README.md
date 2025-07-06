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

## Features

- Dynamic symbol support - subscribe to any symbol
- Real-time price and volume updates every 5 seconds
- Simulated market volatility with random price movements
- WebSocket-based live data streaming
- REST API for historical data and trading
- Automatic price generation for new symbols
- Simulated trading capabilities

## Default Symbols

The mock market comes pre-configured with these symbols, but you can subscribe to any symbol:
- AAPL (Apple)
- GOOGL (Google)
- MSFT (Microsoft)
- AMZN (Amazon)
- TSLA (Tesla)

When subscribing to a new symbol, the server will:
- Generate a random initial price between $100 and $1000
- Generate random initial volume between 100,000 and 1,000,000
- Begin sending price updates every 5 seconds

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
  "symbols": ["AAPL", "SBIN", "RELIANCE"]  // Can be any symbols
}
```

### Unsubscribe from Price Updates
```json
{
  "action": "unsubscribe",
  "symbols": ["AAPL", "SBIN"]
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
  // Subscribe to any symbols
  ws.send(JSON.stringify({
    action: 'subscribe',
    symbols: ['AAPL', 'SBIN', 'RELIANCE']
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

## Price Movement Simulation

- Prices update every 5 seconds
- Random price movements between -1% and +1% of current price
- Random volume changes between -20% and +40% of current volume
- All prices include simulated latency (0-100ms)
- New symbols start with random prices between $100 and $1000
- Initial volumes between 100,000 and 1,000,000

## Notes
- All symbol names are case-insensitive
- WebSocket connections receive real-time price updates for subscribed symbols
- Supports any symbol name - not restricted to predefined list
- Automatically generates realistic price data for new symbols
- Maintains price continuity and realistic volatility 