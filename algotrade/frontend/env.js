const ENV = {
    API_BASE_URL: 'http://localhost:4301',
    LIVE_WS_URL: 'ws://localhost:4302',
    AUTH_TOKEN_KEY: 'token',
    USER_DATA_KEY: 'user'
};

// Prevent modifications to the ENV object
Object.freeze(ENV);

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ENV;
} 