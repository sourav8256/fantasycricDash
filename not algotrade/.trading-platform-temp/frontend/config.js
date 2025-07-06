const API_CONFIG = {
    // Get the current host from the browser
    get API_ENDPOINT() {
        return `${window.location.protocol}//${window.location.host}/api`;
    }
};

// Prevent modifications to the config object
Object.freeze(API_CONFIG);

// Export for use in other files
window.API_CONFIG = API_CONFIG; 