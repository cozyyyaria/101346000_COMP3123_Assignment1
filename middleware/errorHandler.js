/**
 * Centralized Error Handler Middleware
 * 
 * WHY CENTRALIZED ERROR HANDLING?
 * - Consistent error response format across all routes
 * - One place to handle all errors
 * - Can log all errors centrally
 * - Prevents sensitive info from leaking to clients
 * 
 * HOW IT WORKS:
 * - When any route calls next(error), this catches it
 * - When an error is thrown in async code, this catches it
 * - Returns appropriate HTTP status and message
 */

const logger = require('../utils/logger');

/**
 * CUSTOM ERROR CLASS
 * 
 * WHY?
 * - Allows us to set HTTP status codes on errors
 * - Makes it easy to throw errors with proper status
 * 
 * Example: throw new AppError('User not found', 404)
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // Marks this as a known error
        
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * ASYNC ERROR WRAPPER
 * 
 * WHY?
 * - Express doesn't catch errors in async functions automatically
 * - This wrapper catches them and passes to error handler
 * 
 * Usage: router.get('/route', catchAsync(async (req, res) => { ... }))
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * HANDLE MONGOOSE DUPLICATE KEY ERROR
 * 
 * Happens when trying to create a user with existing email/username
 */
const handleDuplicateFieldsDB = (err) => {
    // Extract field name from error message
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : 'value';
    const message = `${field} '${value}' already exists. Please use another value.`;
    return new AppError(message, 409); // 409 Conflict
};

/**
 * HANDLE MONGOOSE VALIDATION ERROR
 * 
 * Happens when schema validation fails
 */
const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data: ${errors.join('. ')}`;
    return new AppError(message, 400);
};

/**
 * HANDLE MONGOOSE CAST ERROR
 * 
 * Happens when invalid ID format is passed
 */
const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

/**
 * MAIN ERROR HANDLER MIDDLEWARE
 * 
 * This is where all errors end up
 * Must have 4 parameters (err, req, res, next) for Express to recognize as error handler
 */
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    
    // Log the error (but not password or sensitive data)
    logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method}`);
    
    // Development: send detailed error
    if (process.env.NODE_ENV === 'development') {
        return res.status(err.statusCode).json({
            status: false,
            message: err.message,
            error: err,
            stack: err.stack
        });
    }
    
    // Production: handle specific error types
    let error = { ...err };
    error.message = err.message;
    
    // MongoDB duplicate key error
    if (err.code === 11000) {
        error = handleDuplicateFieldsDB(err);
    }
    
    // MongoDB validation error
    if (err.name === 'ValidationError') {
        error = handleValidationErrorDB(err);
    }
    
    // MongoDB cast error (invalid ID)
    if (err.name === 'CastError') {
        error = handleCastErrorDB(err);
    }
    
    // Operational error: send message to client
    if (error.isOperational) {
        return res.status(error.statusCode).json({
            status: false,
            message: error.message
        });
    }
    
    // Programming/unknown error: don't leak details
    console.error('ERROR:', err);
    return res.status(500).json({
        status: false,
        message: 'Something went wrong. Please try again later.'
    });
};

/**
 * 404 NOT FOUND HANDLER
 * 
 * Catches any route that doesn't exist
 */
const notFoundHandler = (req, res, next) => {
    logger.warn(`404 - Route not found: ${req.originalUrl}`);
    next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
};

module.exports = {
    AppError,
    catchAsync,
    errorHandler,
    notFoundHandler
};
