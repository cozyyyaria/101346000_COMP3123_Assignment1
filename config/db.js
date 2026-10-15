/**
 * Database Configuration
 * 
 * WHY THIS FILE?
 * - Centralizes all database connection logic
 * - Makes it easy to change database settings in one place
 * - Handles connection errors gracefully
 * 
 * MONGOOSE EXPLAINED:
 * Mongoose is an ODM (Object Document Mapper) for MongoDB.
 * It provides:
 * - Schema definitions (structure for your data)
 * - Data validation
 * - Query building
 * - Middleware hooks
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
    try {
        // mongoose.connect() returns a promise
        // We use async/await to handle it cleanly
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        
        logger.info(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        return conn;
    } catch (error) {
        logger.error(`Database connection error: ${error.message}`);
        console.error(`Error: ${error.message}`);
        // Exit process with failure code
        // In production, you might want to retry instead
        process.exit(1);
    }
};

module.exports = connectDB;
