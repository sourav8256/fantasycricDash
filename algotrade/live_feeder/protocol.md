# MockMarket Protocol Specification

This document defines the standard protocol for MockMarket servers, ensuring compatibility across different implementations. The protocol covers both REST API and WebSocket interfaces for market data and trading operations.

## 1. General Principles

- All symbol names are case-insensitive (converted to uppercase internally)
- All timestamps use ISO 8601 format (YYYY-MM-DDTHH:MM:SS.sssZ)
- All prices are represented as floating-point numbers
- All volumes are represented as integers
- All JSON responses include appropriate HTTP status codes

## 2. REST API Endpoints

### 2.1 Market Data Endpoints

#### 2.1.1 Get All Prices

**Request:**

**Response:**
```json
[
  {
    "symbol": "AAPL",
    "price": 150.25,
    "volume": 1000000,
    "timestamp": "2024-03-14T12:00:00.000Z"
  },
  {
    "symbol": "GOOGL",
    "price": 2800.50,
    "volume": 500000,
    "timestamp": "2024-03-14T12:00:00.000Z"
  }
]
```

#### 2.1.2 Get Price for Specific Symbol

**Request:**
```
GET /api/price/:symbol
```

**Response:**
```json
{
  "symbol": "AAPL",
  "price": 150.25,
  "timestamp": "2024-03-14T12:00:00.000Z"
}
```

**Error Response (404):**
```json
{
  "error": "Symbol not found"
}
```

#### 2.1.3 Validate Symbol

**Request:**
```
GET /api/validate/:symbol
```

**Response:**
```json
{
  "symbol": "AAPL",
  "valid": true,
  "details": {
    "currentPrice": 150.25,
    "volume": 1000000
  }
}
```

#### 2.1.4 Validate Multiple Symbols

**Request:**
```
POST /api/validate
Content-Type: application/json

{
  "symbols": ["AAPL", "GOOGL", "INVALID"]
}
```

**Response:**
```json
[
  {
    "symbol": "AAPL",
    "valid": true,
    "details": {
      "currentPrice": 150.25,
      "volume": 1000000
    }
  },
  {
    "symbol": "GOOGL",
    "valid": true,
    "details": {
      "currentPrice": 2800.50,
      "volume": 500000
    }
  },
  {
    "symbol": "INVALID",
    "valid": false,
    "details": null
  }
]
```

### 2.2 Trading Endpoints

#### 2.2.1 Enter Trade

**Request:**
```
POST /api/trade/enter
Content-Type: application/json

{
  "symbol": "AAPL",
  "quantity": 100
}
```

**Response:**
```json
{
  "tradeId": "abc123xyz",
  "symbol": "AAPL",
  "quantity": 100,
  "entryPrice": 150.25,
  "entryTime": "2024-03-14T12:00:00.000Z"
}
```

**Error Response (400):**
```json
{
  "error": "Symbol and quantity are required"
}
```

**Error Response (404):**
```json
{
  "error": "Symbol not found"
}
```

#### 2.2.2 Exit Trade

**Request:**
```
POST /api/trade/exit/:tradeId
```

**Response:**
```json
{
  "symbol": "AAPL",
  "quantity": 100,
  "entryPrice": 150.25,
  "entryTime": "2024-03-14T12:00:00.000Z",
  "exitPrice": 152.50,
  "exitTime": "2024-03-14T12:30:00.000Z",
  "pnl": 225.00
}
```

**Error Response (404):**
```json
{
  "error": "Trade not found"
}
```

#### 2.2.3 Get Trade Status

**Request:**
```
GET /api/trade/:tradeId
```

**Response:**
```json
{
  "symbol": "AAPL",
  "quantity": 100,
  "entryPrice": 150.25,
  "entryTime": "2024-03-14T12:00:00.000Z",
  "currentPrice": 152.50,
  "unrealizedPnl": "225.00"
}
```

**Error Response (404):**
```json
{
  "error": "Trade not found"
}
```

#### 2.2.4 Get All Active Trades

**Request:**
```
GET /api/trades
```

**Response:**
```json
[
  {
    "tradeId": "abc123xyz",
    "symbol": "AAPL",
    "quantity": 100,
    "entryPrice": 150.25,
    "entryTime": "2024-03-14T12:00:00.000Z",
    "currentPrice": 152.50,
    "unrealizedPnl": "225.00"
  },
  {
    "tradeId": "def456uvw",
    "symbol": "GOOGL",
    "quantity": 10,
    "entryPrice": 2800.50,
    "entryTime": "2024-03-14T12:15:00.000Z",
    "currentPrice": 2795.25,
    "unrealizedPnl": "-52.50"
  }
]
```

## 3. WebSocket API

### 3.1 Connection

Connect to the WebSocket server at: `ws://hostname:port`

### 3.2 Client Messages

#### 3.2.1 Subscribe to Symbols

**Request:**
```json
{
  "action": "subscribe",
  "symbols": ["AAPL", "GOOGL"]
}
```

**Response:**
```json
{
  "event": "subscribed",
  "symbols": ["AAPL", "GOOGL"],
  "message": "Subscribed to AAPL, GOOGL"
}
```

#### 3.2.2 Unsubscribe from Symbols

**Request:**
```json
{
  "action": "unsubscribe",
  "symbols": ["AAPL"]
}
```

**Response:**
```json
{
  "event": "unsubscribed",
  "symbols": ["AAPL"],
  "message": "Unsubscribed from AAPL"
}
```

### 3.3 Server Messages

#### 3.3.1 Connection Confirmation

Sent immediately after client connects:

```json
{
  "event": "connected",
  "message": "Connected to market data stream"
}
```

#### 3.3.2 Price Update

Sent periodically for all subscribed symbols:

```json
{
  "event": "price_update",
  "symbol": "AAPL",
  "data": {
    "price": 150.25,
    "volume": 1000000,
    "timestamp": "2024-03-14T12:00:00.000Z",
  }
}
```

#### 3.3.3 Error Message

```json
{
  "error": "Invalid message format"
}
```

## 4. Price Cycle Behavior

MockMarket implementations should follow a standard price cycle pattern:

- Each cycle lasts 20 seconds total
- First 10 seconds: prices rise from 0% to 20% above cycle start price
- Last 10 seconds: prices fall from 20% back to 0% (original price)
- Cycle information is included in price updates via the `cycleInfo` object

## 5. Symbol Creation

When a client subscribes to a symbol that doesn't exist:

1. The server automatically creates the symbol
2. Initial price is randomly generated between $100 and $1000
3. Initial volume is randomly generated between 100,000 and 1,000,000
4. The symbol immediately begins participating in price cycles
5. The server logs the creation of the new symbol

## 6. Error Handling

All endpoints should return appropriate HTTP status codes:
- 200: Success
- 400: Bad request (missing parameters)
- 404: Resource not found
- 500: Server error

WebSocket error messages should include an `error` field with a descriptive message.

## 7. Implementation Requirements

A compliant MockMarket server must:

1. Support all REST endpoints defined in section 2
2. Support WebSocket protocol defined in section 3
3. Implement price cycles as defined in section 4
4. Support dynamic symbol creation as defined in section 5
5. Implement proper error handling as defined in section 6
6. Log significant events (connections, subscriptions, symbol creation)
7. Handle case-insensitive symbol names
8. Use ISO 8601 format for all timestamps





