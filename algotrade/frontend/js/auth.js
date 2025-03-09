// Check for ENV at the beginning of the file
if (typeof window.ENV === 'undefined') {
    console.error('ENV is not defined. Make sure env.js is loaded before auth.js');
    window.ENV = {
        AUTH_TOKEN_KEY: 'token',
        USER_DATA_KEY: 'user',
        API_BASE_URL: '/api'  // Default fallback values
    };
}

// Check if user is authenticated
async function checkAuth() {
    const token = localStorage.getItem(window.ENV.AUTH_TOKEN_KEY);
    if (!token) {
        logout();
        return false;
    }

    try {
        // Verify token with backend
        const response = await fetch(`${window.ENV.API_BASE_URL}/api/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            // Token is invalid
            logout();
            return false;
        }

        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        logout();
        return false;
    }
}

// Function to handle logout
function logout() {
    console.log('Logging out due to invalid token');
    localStorage.removeItem(window.ENV.AUTH_TOKEN_KEY);
    localStorage.removeItem(window.ENV.USER_DATA_KEY);
    
    // Only redirect if we're not already on the auth page
    if (!window.location.pathname.includes('auth.html')) {
        // window.location.href = '/auth.html';
    }
}

// Add auth check to all protected pages
document.addEventListener('DOMContentLoaded', () => {
    // Skip auth check for auth.html
    if (window.location.pathname.includes('auth.html')) {
        return;
    }
    
    checkAuth();
});

// Add global fetch interceptor to handle 401 responses
const originalFetch = window.fetch;
window.fetch = async function(...args) {
    try {
        const response = await originalFetch(...args);
        
        if (response.status === 401) {
            // Unauthorized - token is invalid
            logout();
            throw new Error('Unauthorized - Please log in again');
        }
        
        return response;
    } catch (error) {
        if (error.message.includes('Unauthorized')) {
            logout();
        }
        throw error;
    }
}; 