const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    // If authentication is not required, skip token verification
    if (process.env.AUTH_REQUIRED !== 'true') {
        return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: verified.id };
        next();
    } catch (err) {
        res.status(403).json({ message: 'Invalid token' });
    }
};

module.exports = authenticateToken; 