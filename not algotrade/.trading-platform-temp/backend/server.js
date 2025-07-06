const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const strategyRoutes = require('./routes/strategy');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from frontend/public directory
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Connect to Database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/strategies', strategyRoutes);

// Start server
const PORT = process.env.PORT || 4301;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
