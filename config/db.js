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
    // Reuse an existing connection (important on Vercel serverless)
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);

        logger.info(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        return conn;
    } catch (error) {
        logger.error(`Database connection error: ${error.message}`);
        console.error(`Error: ${error.message}`);

        // process.exit would crash the Vercel function; only exit locally
        if (!process.env.VERCEL) {
            process.exit(1);
        }

        throw error;
    }
};

module.exports = connectDB;
