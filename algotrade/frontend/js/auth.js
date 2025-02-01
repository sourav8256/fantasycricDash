// Check if user is authenticated
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        // Redirect to auth page if no token found
        window.location.href = '../auth.html';
        return false;
    }
    return true;
}

// Add auth check to all protected pages
document.addEventListener('DOMContentLoaded', () => {
    // Skip auth check for auth.html
    if (window.location.pathname.includes('auth.html')) {
        return;
    }
    
    checkAuth();
});

// Function to handle logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../auth.html';
} 