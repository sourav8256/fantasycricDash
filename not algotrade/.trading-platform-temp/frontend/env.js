// Get the current hostname from the browser
const hostname = window.location.hostname;
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const httpProtocol = window.location.protocol;

// Create environment configuration
window.ENV = {
    // Direct connection to backend API
    API_BASE_URL: `${httpProtocol}//${hostname}:4301`,
    // Direct connection to WebSocket server
    LIVE_WS_URL: `${wsProtocol}//${hostname}:4302`,
    AUTH_TOKEN_KEY: 'token',
    USER_DATA_KEY: 'user'
};


// Log initial ENV configuration
console.log('Initial ENV configuration:', window.ENV);


// Log configuration for debugging
console.log('Environment Configuration:', {
    hostname,
    API_BASE_URL: window.ENV.API_BASE_URL,
    LIVE_WS_URL: window.ENV.LIVE_WS_URL,
    protocol: window.location.protocol,
    wsProtocol
});

// Prevent modifications to the ENV object
Object.freeze(window.ENV);

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.ENV;
}