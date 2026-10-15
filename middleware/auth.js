/**
 * Authentication Middleware
 * 
 * WHY MIDDLEWARE?
 * - Middleware runs BEFORE your route handler
 * - Perfect for authentication checks
 * - If auth fails, request never reaches the controller
 * - Keeps authentication logic in one place
 * 
 * JWT AUTHENTICATION FLOW:
 * 1. Client sends request with Authorization header
 * 2. Header format: "Bearer <token>"
 * 3. Middleware extracts and verifies token
 * 4. If valid, attaches user info to request
 * 5. If invalid, returns 401 Unauthorized
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * PROTECT MIDDLEWARE
 * 
 * Use this on any route that requires authentication
 * Example: router.get('/employees', protect, getEmployees)
 */
const protect = async (req, res, next) => {
    let token;
    
    // Check for Authorization header with Bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extract token from "Bearer <token>"
            token = req.headers.authorization.split(' ')[1];
            
            /**
             * JWT.VERIFY() explained:
             * - Checks if token was signed with our secret
             * - Checks if token has expired
             * - Decodes the payload (user data)
             * - Throws error if anything is wrong
             */
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            /**
             * FIND USER FROM TOKEN
             * 
             * WHY?
             * - Token contains userId, but we need full user object
             * - .select('-password') excludes password from result
             * - This attaches user to req.user for later use
             */
            const user = await User.findById(decoded.userId).select('-password');
            
            if (!user) {
                logger.warn(`Auth failed: User not found for token userId ${decoded.userId}`);
                return res.status(401).json({
                    status: false,
                    message: 'Not authorized - user no longer exists'
                });
            }
            
            // Attach user to request object
            // Now all subsequent middleware/controllers can access req.user
            req.user = user;
            
            logger.info(`User ${user.username} authenticated successfully`);
            next();
            
        } catch (error) {
            logger.warn(`Auth failed: ${error.message}`);
            
            // Handle specific JWT errors
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    status: false,
                    message: 'Not authorized - invalid token'
                });
            }
            
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    status: false,
                    message: 'Not authorized - token expired'
                });
            }
            
            return res.status(401).json({
                status: false,
                message: 'Not authorized'
            });
        }
    }
    
    // No token provided at all
    if (!token) {
        logger.warn('Auth failed: No token provided');
        return res.status(401).json({
            status: false,
            message: 'Not authorized - no token provided'
        });
    }
};

/**
 * GENERATE JWT TOKEN
 * 
 * WHY SEPARATE FUNCTION?
 * - Reusable in signup and login
 * - Easy to modify token settings in one place
 * 
 * PAYLOAD CONTENTS:
 * - userId: Identifies the user
 * - Keep payload small! Don't store sensitive data
 */
const generateToken = (userId) => {
    return jwt.sign(
        { userId }, // Payload
        process.env.JWT_SECRET, // Secret key
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } // Options
    );
};

module.exports = {
    protect,
    generateToken
};
