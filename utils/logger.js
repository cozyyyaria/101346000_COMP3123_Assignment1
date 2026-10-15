/**
 * Logger Utility using Winston
 * 
 * WHY WINSTON?
 * - Multiple log levels (error, warn, info, debug)
 * - Can output to files AND console
 * - Customizable format with timestamps
 * - Industry standard for Node.js logging
 * 
 * LOG LEVELS (from highest to lowest priority):
 * - error: Something failed
 * - warn: Something concerning happened
 * - info: Normal operations (startup, requests)
 * - debug: Detailed info for debugging
 */

const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
        // If there's a stack trace (error), include it
        return stack 
            ? `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`
            : `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
);

// Create the logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    transports: [
        // Write all logs to combined.log
        new winston.transports.File({ 
            filename: path.join(__dirname, '../logs/combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Write error logs to error.log
        new winston.transports.File({ 
            filename: path.join(__dirname, '../logs/error.log'),
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5
        })
    ]
});

// In development, also log to console with colors
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

module.exports = logger;
