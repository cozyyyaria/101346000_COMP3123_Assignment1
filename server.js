/**
 * Main Server Entry Point
 * 
 * This file bootstraps the entire application:
 * 1. Loads environment variables
 * 2. Connects to MongoDB
 * 3. Configures Express with security middleware
 * 4. Mounts all routes
 * 5. Starts the HTTP server
 * 
 * MIDDLEWARE ORDER MATTERS!
 * Middleware runs in the order they're added:
 * 1. helmet (security headers)
 * 2. rate limiter (prevent abuse)
 * 3. morgan (logging)
 * 4. body parser (parse JSON)
 * 5. routes (handle requests)
 * 6. error handler (catch errors)
 */

// Load environment variables FIRST (before other requires that might use them)
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

// Custom modules
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Routes
const userRoutes = require('./routes/userRoutes');
const employeeRoutes = require('./routes/employeeRoutes');

// Initialize Express app
const app = express();

/**
 * HELMET - Security Headers
 * 
 * WHY HELMET?
 * Adds various HTTP headers to protect against common attacks:
 * - X-Content-Type-Options: Prevents MIME-sniffing
 * - X-Frame-Options: Prevents clickjacking
 * - X-XSS-Protection: Adds XSS filter
 * - Strict-Transport-Security: Forces HTTPS
 * - Content-Security-Policy: Controls allowed content sources
 * 
 * EXAMPLE ATTACK HELMET PREVENTS:
 * Clickjacking - attacker embeds your site in an iframe
 * to trick users into clicking hidden buttons
 */
app.use(helmet());

/**
 * RATE LIMITING - Prevent Abuse
 * 
 * WHY RATE LIMITING?
 * - Prevents brute force attacks on login
 * - Prevents API abuse (too many requests)
 * - Protects server resources
 * 
 * WHAT HAPPENS WHEN LIMIT EXCEEDED?
 * - Returns 429 Too Many Requests
 * - User must wait for window to reset
 */

// General API rate limiter (100 requests per 15 minutes)
const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        status: false,
        message: 'Too many requests, please try again later'
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false
});

/**
 * STRICT AUTH RATE LIMITER
 * 
 * WHY STRICTER FOR AUTH?
 * - Login/signup are prime targets for brute force
 * - Attacker might try thousands of passwords
 * - Lower limit (5 per 15 minutes) makes attacks impractical
 */
const authLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5,
    message: {
        status: false,
        message: 'Too many authentication attempts, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Apply rate limiters
app.use('/api/', generalLimiter);
app.use('/api/v1/user/login', authLimiter);
app.use('/api/v1/user/signup', authLimiter);

/**
 * MORGAN - HTTP Request Logger
 * 
 * WHY?
 * - Logs every HTTP request
 * - Useful for debugging and monitoring
 * - 'dev' format: colored, concise output
 */
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Custom Morgan format that writes to our winston logger
app.use(morgan(':method :url :status :response-time ms', {
    stream: {
        write: (message) => logger.info(message.trim())
    }
}));

/**
 * BODY PARSER - Parse JSON Requests
 * 
 * WHY?
 * - Converts JSON request body to JavaScript object
 * - Available as req.body in routes
 * - Limit set to prevent large payload attacks
 */
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

/**
 * HEALTH CHECK ENDPOINT
 * 
 * WHY?
 * - Quick way to verify API is running
 * - Used by monitoring tools and load balancers
 * - Should always respond quickly
 */
app.get('/health', (req, res) => {
    res.status(200).json({
        status: true,
        message: 'API is healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        uptime: process.uptime()
    });
});

/**
 * MOUNT ROUTES
 * 
 * app.use(BASE_PATH, ROUTER)
 * - All routes in userRoutes will be prefixed with /api/v1/user
 * - All routes in employeeRoutes will be prefixed with /api/v1/emp
 */
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/emp', employeeRoutes);

/**
 * 404 HANDLER
 * 
 * Must be AFTER all routes
 * Catches any request that didn't match a route
 */
app.use(notFoundHandler);

/**
 * GLOBAL ERROR HANDLER
 * 
 * Must be LAST middleware
 * Catches all errors from routes and middleware
 */
app.use(errorHandler);

/**
 * START SERVER
 * 
 * Connect to database first, then start listening
 */
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();
        
        // Start Express server
        app.listen(PORT, () => {
            logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
            console.log(`
========================================
  COMP3123 Assignment 1 API Server
========================================
  Mode:     ${process.env.NODE_ENV}
  Port:     ${PORT}
  Health:   http://localhost:${PORT}/health
  API:      http://localhost:${PORT}/api/v1
========================================
            `);
        });
    } catch (error) {
        logger.error(`Failed to start server: ${error.message}`);
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    console.error('Unhandled Rejection:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

module.exports = app;
