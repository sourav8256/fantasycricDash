console.log('live-feed.js loaded');

class LiveFeedManager {
    constructor() {
        this.ws = null;
        this.isConnecting = false;
        this.statusElement = null;
        this.reconnectButton = null;
        console.log('LiveFeedManager initialized');
        this.lastPrices = new Map();
        this.maxFeedItems = 50; // Keep last 50 updates
        this.lastHeartbeat = null; // Track last heartbeat only
        this.initializeUI();
        this.connect();
    }

    initializeUI() {
        this.statusElement = document.querySelector('.websocket-status');
        if (this.statusElement) {
            this.statusElement.style.display = 'flex';
            this.reconnectButton = this.statusElement.querySelector('.reconnect-btn');
            if (this.reconnectButton) {
                this.reconnectButton.addEventListener('click', () => this.reconnect());
            }
        }
        this.marketDataList = document.querySelector('.market-data-list');
        this.feedStatus = document.querySelector('.feed-status');
        this.rawDataList = document.querySelector('.raw-data-list');
    }

    updateConnectionStatus(status, message) {
        if (!this.statusElement) return;

        const statusText = this.statusElement.querySelector('.status-text');
        const connectionDetails = this.statusElement.querySelector('.connection-details');
        const spinner = this.statusElement.querySelector('.spinner-border');
        
        // Remove all status classes
        this.statusElement.classList.remove('connected', 'disconnected', 'connecting');
        
        // Format the WebSocket URL for display
        const wsUrl = new URL(ENV.LIVE_WS_URL);
        const displayUrl = `${wsUrl.hostname}:${wsUrl.port}${wsUrl.pathname}`;
        
        switch (status) {
            case 'connected':
                this.statusElement.classList.add('connected');
                spinner.style.display = 'none';
                this.reconnectButton.style.display = 'none';
                connectionDetails.textContent = `Connected to ${displayUrl}`;
                break;
            case 'disconnected':
                this.statusElement.classList.add('disconnected');
                spinner.style.display = 'none';
                this.reconnectButton.style.display = 'block';
                connectionDetails.textContent = `Last attempted connection to ${displayUrl}`;
                break;
            case 'connecting':
                this.statusElement.classList.add('connecting');
                spinner.style.display = 'block';
                this.reconnectButton.style.display = 'none';
                connectionDetails.textContent = `Attempting connection to ${displayUrl}`;
                break;
        }
        
        if (statusText) {
            statusText.textContent = message;
        }
    }

    updateFeedStatus(isActive) {
        if (!this.feedStatus) return;
        
        this.feedStatus.classList.remove('active', 'inactive');
        if (isActive) {
            this.feedStatus.textContent = 'Receiving market data';
            this.feedStatus.classList.add('active');
        } else {
            this.feedStatus.textContent = 'Feed inactive';
            this.feedStatus.classList.add('inactive');
        }
    }

    addMarketDataItem(data) {
        if (!this.marketDataList) return;

        const previousPrice = this.lastPrices.get(data.symbol) || data.price;
        this.lastPrices.set(data.symbol, data.price);

        const priceChange = data.price - previousPrice;
        const priceClass = priceChange > 0 ? 'text-success' : priceChange < 0 ? 'text-danger' : '';
        const rowClass = priceChange > 0 ? 'price-up' : priceChange < 0 ? 'price-down' : '';

        const formattedPrice = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(data.price);

        const time = new Date(data.timestamp).toLocaleTimeString();

        const item = document.createElement('div');
        item.className = `market-data-item ${rowClass}`;
        item.innerHTML = `
            <span class="symbol">${data.symbol}</span>
            <span class="price ${priceClass}">${formattedPrice}</span>
            <span class="time">${time}</span>
        `;

        this.marketDataList.insertBefore(item, this.marketDataList.firstChild);

        // Remove old items if exceeding maxFeedItems
        while (this.marketDataList.children.length > this.maxFeedItems) {
            this.marketDataList.removeChild(this.marketDataList.lastChild);
        }

        this.updateFeedStatus(true);
    }

    addRawDataItem(rawData) {
        if (!this.rawDataList) return;

        const time = new Date().toLocaleTimeString();
        const item = document.createElement('div');
        item.className = 'raw-data-item';
        
        // Handle both string and object data
        const displayData = typeof rawData === 'string' ? rawData : JSON.stringify(rawData);
        
        item.innerHTML = `
            <span class="time">${time}</span>
            <span class="data">${displayData}</span>
        `;

        this.rawDataList.insertBefore(item, this.rawDataList.firstChild);

        // Remove old items if exceeding maxFeedItems
        while (this.rawDataList.children.length > this.maxFeedItems) {
            this.rawDataList.removeChild(this.rawDataList.lastChild);
        }
    }

    reconnect() {
        if (this.ws) {
            this.ws.close();
        }
        this.connect();
    }

    connect() {
        const wsUrl = ENV.LIVE_WS_URL;
        
        console.log('------------------------');
        console.log('WebSocket Connection Details:');
        console.log('URL:', wsUrl);
        console.log('------------------------');
        
        try {
            console.log('Attempting WebSocket connection to:', wsUrl);
            this.updateConnectionStatus('connecting', 'Connecting to market data...');
            
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('WebSocket connection established');
                this.updateConnectionStatus('connected', 'Connected to market data');
                this.updateFeedStatus(true);
            };

            this.ws.onclose = (event) => {
                console.log('WebSocket connection closed:', event.code, event.reason);
                this.updateConnectionStatus('disconnected', 'Disconnected from market data');
                this.updateFeedStatus(false);
                setTimeout(() => {
                    if (this.ws.readyState === WebSocket.CLOSED) {
                        this.connect();
                    }
                }, 5000);
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus('disconnected', 'Connection error');
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    // Handle heartbeat messages
                    if (data.event === 'heartbeat') {
                        this.lastHeartbeat = data;
                        console.log('Updated subscribed symbols from heartbeat:', Array.from(data.subscribedSymbols));
                    }

                    // Show all raw data immediately
                    this.addRawDataItem(event.data);
                    
                    // Parse and handle the message
                    switch (data.event) {
                        case 'price_update':
                            const priceData = {
                                symbol: data.symbol,
                                price: data.data.price,
                                timestamp: data.data.timestamp,
                                volume: data.data.volume
                            };
                            this.updatePriceInTable(priceData);
                            this.addMarketDataItem(priceData);
                            break;
                            
                        case 'connected':
                            console.log('Connected to market data:', data.message);
                            this.updateConnectionStatus('connected', 'Connected to market data');
                            break;
                            
                        case 'subscribed':
                            console.log('Subscription confirmed:', data.symbols);
                            break;
                            
                        default:
                            console.log('Unhandled event type:', data.event);
                    }
                } catch (error) {
                    console.error('Error processing message:', error);
                }
            };
        } catch (error) {
            console.error('Error creating WebSocket:', error);
            this.updateConnectionStatus('disconnected', 'Failed to connect');
        }
    }

    subscribe(symbol) {
        if (!symbol) {
            console.warn('Attempted to subscribe with empty symbol');
            return;
        }

        // Check last heartbeat for existing subscription
        if (this.lastHeartbeat && this.lastHeartbeat.subscribedSymbols.includes(symbol)) {
            console.log(`Already subscribed to ${symbol} according to last heartbeat, skipping subscription`);
            return;
        }

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const subscribeMsg = {
                type: 'subscribe',
                symbol: symbol
            };
            console.log('Sending subscribe message:', JSON.stringify(subscribeMsg, null, 2));
            this.ws.send(JSON.stringify(subscribeMsg));
        } else {
            console.log('WebSocket not ready, retrying subscription in 100ms');
            setTimeout(() => this.subscribe(symbol), 100);
        }
    }

    unsubscribe(symbol) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('Sending unsubscribe message for:', symbol);
            this.ws.send(JSON.stringify({
                type: 'unsubscribe',
                symbol: symbol
            }));
        }
    }

    updatePriceInTable(data) {
        try {
            if (!data || !data.symbol || !data.price) {
                console.warn('Invalid price update data:', data);
                return;
            }

            // Find all price cells for this symbol
            const priceCells = document.querySelectorAll(`.live-price-cell[data-symbol="${data.symbol}"]`);
            
            priceCells.forEach(priceCell => {
                try {
                    const priceValueEl = priceCell.querySelector('.price-value');
                    const timestampEl = priceCell.querySelector('.timestamp');
                    
                    if (!priceValueEl || !timestampEl) {
                        console.warn('Price elements not found in cell');
                        return;
                    }

                    // Format the price
                    const formattedPrice = new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }).format(data.price);

                    // Get previous price for comparison
                    const previousPrice = parseFloat(priceCell.dataset.price || 0);
                    const newPrice = parseFloat(data.price);
                    
                    // Update the price
                    priceValueEl.textContent = formattedPrice;
                    priceCell.dataset.price = newPrice;

                    // Update timestamp
                    const time = new Date(data.timestamp).toLocaleTimeString();
                    timestampEl.textContent = time;

                    // Add visual feedback for price change
                    priceValueEl.classList.remove('text-success', 'text-danger');
                    if (newPrice > previousPrice) {
                        priceValueEl.classList.add('text-success');
                    } else if (newPrice < previousPrice) {
                        priceValueEl.classList.add('text-danger');
                    }

                    // Add flash effect
                    priceCell.style.transition = 'background-color 0.5s ease';
                    priceCell.style.backgroundColor = 'rgba(0,0,0,0.05)';
                    setTimeout(() => {
                        priceCell.style.backgroundColor = 'transparent';
                    }, 500);

                } catch (cellError) {
                    console.error('Error updating individual price cell:', cellError);
                }
            });

        } catch (error) {
            console.error('Error in updatePriceInTable:', error);
        }
    }

    initializeSubscriptions() {
        console.log('Initializing subscriptions');
        const deployedTab = document.getElementById('deployed');
        if (!deployedTab) {
            console.warn('Deployed tab element not found');
            return;
        }

        const rows = deployedTab.querySelectorAll('tbody tr');
        const symbols = new Set();

        rows.forEach(row => {
            const instrumentCell = row.querySelector('td:nth-child(4)');
            if (instrumentCell) {
                const symbol = instrumentCell.textContent.trim();
                if (symbol) {
                    console.log('Found symbol in table:', symbol);
                    symbols.add(symbol);
                }
            }
        });

        console.log('Found symbols to subscribe:', Array.from(symbols));

        const trySubscribe = () => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                console.log('WebSocket ready, subscribing to symbols');
                symbols.forEach(symbol => {
                    if (!this.lastHeartbeat || !this.lastHeartbeat.subscribedSymbols.includes(symbol)) {
                        this.subscribe(symbol);
                    }
                });
            } else {
                console.log('WebSocket not ready, retrying... Current state:', this.ws?.readyState);
                setTimeout(trySubscribe, 100);
            }
        };

        trySubscribe();
    }

    getFormattedWsUrl() {
        const url = new URL(ENV.LIVE_WS_URL);
        return `${url.host}${url.pathname}`;
    }
}

// Initialize immediately when script loads
console.log('Creating LiveFeedManager instance');
const liveFeedManager = new LiveFeedManager();

// Re-initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Reinitializing strategy subscriptions');
    liveFeedManager.initializeSubscriptions();
});

// Make LiveFeedManager globally available
window.LiveFeedManager = LiveFeedManager; 