console.log('live-feed.js loaded');

class LiveFeedManager {
    constructor() {
        this.ws = null;
        this.subscribedSymbols = new Set();
        this.isConnecting = false;
        console.log('LiveFeedManager initialized');
        this.connect();
        this.initializeSubscriptions();
    }

    connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname || 'localhost';
        const port = '3000';
        const wsUrl = `${protocol}//${host}:${port}`;
        
        console.log('------------------------');
        console.log('WebSocket Connection Details:');
        console.log('Protocol:', protocol);
        console.log('Host:', host);
        console.log('Port:', port);
        console.log('Full URL:', wsUrl);
        console.log('------------------------');
        
        try {
            console.log('Attempting WebSocket connection to:', wsUrl);
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('WebSocket connection established');
                this.subscribedSymbols.forEach(symbol => {
                    this.subscribe(symbol);
                });
            };

            this.ws.onclose = (event) => {
                console.log('WebSocket connection closed:', event.code, event.reason);
                setTimeout(() => {
                    console.log('Attempting to reconnect...');
                    this.connect();
                }, 1000);
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'price_update') {
                        this.updatePriceInTable({
                            symbol: data.symbol,
                            price: data.price,
                            timestamp: data.timestamp
                        });
                    } else if (data.type === 'strategy_deployed') {
                        console.log('Strategy deployed:', data.strategyId);
                    }
                } catch (error) {
                    console.error('Error processing message:', error);
                }
            };
        } catch (error) {
            console.error('Error creating WebSocket:', error);
        }
    }

    subscribe(symbol) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const subscribeMsg = {
                type: 'subscribe',
                symbol: symbol,
                strategyId: `strategy_${symbol.toLowerCase()}`
            };
            console.log('Strategy subscription:', symbol);
            this.ws.send(JSON.stringify(subscribeMsg));
            this.subscribedSymbols.add(symbol);
        } else {
            console.warn('Cannot subscribe to', symbol, '- WebSocket not ready');
        }
    }

    unsubscribe(symbol) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const unsubscribeMsg = {
                type: 'unsubscribe',
                symbol: symbol,
                strategyId: `strategy_${symbol.toLowerCase()}`
            };
            console.log('Sending unsubscribe message:', unsubscribeMsg);
            this.ws.send(JSON.stringify(unsubscribeMsg));
            this.subscribedSymbols.delete(symbol);
            console.log('Current subscribed symbols:', Array.from(this.subscribedSymbols));
        }
    }

    updatePriceInTable(data) {
        try {
            if (!data || !data.symbol || !data.price) {
                return;
            }

            const deployedTab = document.getElementById('deployed');
            if (!deployedTab) {
                return;
            }

            const table = deployedTab.querySelector('.table');
            if (!table) {
                return;
            }

            const rows = table.querySelectorAll('tbody tr');
            let found = false;
            
            rows.forEach((row, index) => {
                try {
                    const instrumentCell = row.cells[3];
                    if (!instrumentCell) {
                        return;
                    }

                    const instrumentSymbol = instrumentCell.textContent.trim();
                    if (instrumentSymbol === data.symbol) {
                        found = true;
                        const priceCell = row.querySelector('.live-price-cell');
                        if (!priceCell) {
                            return;
                        }

                        try {
                            const formattedPrice = new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }).format(data.price);
                            
                            const previousPrice = parseFloat(priceCell.dataset.price || 0);
                            const newPrice = data.price;
                            const priceChange = newPrice - previousPrice;
                            
                            priceCell.dataset.price = newPrice;
                            priceCell.textContent = formattedPrice;
                            
                            priceCell.classList.remove('text-success', 'text-danger');
                            if (priceChange > 0) {
                                priceCell.classList.add('text-success');
                            } else if (priceChange < 0) {
                                priceCell.classList.add('text-danger');
                            }
                            
                            priceCell.style.transition = 'background-color 0.5s ease';
                            priceCell.style.backgroundColor = 'rgba(0,0,0,0.05)';
                            setTimeout(() => {
                                priceCell.style.backgroundColor = 'transparent';
                            }, 500);

                            const time = new Date(data.timestamp).toLocaleTimeString();
                            priceCell.title = `Last updated: ${time}`;
                        } catch (formatError) {
                            console.error('Error formatting price:', formatError);
                        }
                    }
                } catch (rowError) {
                    console.error('Error processing row:', rowError);
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
                    if (!this.subscribedSymbols.has(symbol)) {
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
}

// Initialize immediately when script loads
console.log('Creating LiveFeedManager instance');
const liveFeedManager = new LiveFeedManager();

// Re-initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Reinitializing strategy subscriptions');
    liveFeedManager.initializeSubscriptions();
}); 