const API_CONFIG = {
    // Default development endpoint
    DEV_API_URL: 'http://localhost:3000/api',
    // Production endpoint (update this when deploying)
    PROD_API_URL: 'https://your-production-domain.com/api',
    
    // Get the current API endpoint based on environment
    get API_ENDPOINT() {
        return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? this.DEV_API_URL
            : this.PROD_API_URL;
    }
};

// Prevent modifications to the config object
Object.freeze(API_CONFIG);

// Export for use in other files
window.API_CONFIG = API_CONFIG; 