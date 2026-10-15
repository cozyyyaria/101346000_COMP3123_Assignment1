/**
 * Employee Input Validators
 * 
 * WHY SEPARATE VALIDATORS?
 * - Keeps validation logic organized
 * - Reusable across different routes
 * - Easy to test and modify
 * - Single Responsibility Principle
 */

const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * CREATE EMPLOYEE VALIDATION
 * 
 * All fields are required for creating a new employee
 */
const createEmployeeValidation = [
    body('first_name')
        .trim()
        .notEmpty().withMessage('First name is required')
        .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters')
        .matches(/^[a-zA-Z\s-]+$/).withMessage('First name can only contain letters, spaces, and hyphens'),
    
    body('last_name')
        .trim()
        .notEmpty().withMessage('Last name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters')
        .matches(/^[a-zA-Z\s-]+$/).withMessage('Last name can only contain letters, spaces, and hyphens'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    
    body('position')
        .trim()
        .notEmpty().withMessage('Position is required')
        .isLength({ max: 100 }).withMessage('Position cannot exceed 100 characters'),
    
    body('salary')
        .notEmpty().withMessage('Salary is required')
        .isNumeric().withMessage('Salary must be a number')
        .custom(value => {
            if (parseFloat(value) < 0) {
                throw new Error('Salary cannot be negative');
            }
            return true;
        }),
    
    body('date_of_joining')
        .notEmpty().withMessage('Date of joining is required')
        .isISO8601().withMessage('Date of joining must be a valid date (YYYY-MM-DD)')
        .toDate(), // Convert string to Date object
    
    body('department')
        .trim()
        .notEmpty().withMessage('Department is required')
        .isLength({ max: 100 }).withMessage('Department cannot exceed 100 characters')
];

/**
 * UPDATE EMPLOYEE VALIDATION
 * 
 * All fields are optional for updates
 * But if provided, they must be valid
 */
const updateEmployeeValidation = [
    body('first_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters')
        .matches(/^[a-zA-Z\s-]+$/).withMessage('First name can only contain letters, spaces, and hyphens'),
    
    body('last_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters')
        .matches(/^[a-zA-Z\s-]+$/).withMessage('Last name can only contain letters, spaces, and hyphens'),
    
    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    
    body('position')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Position cannot exceed 100 characters'),
    
    body('salary')
        .optional()
        .isNumeric().withMessage('Salary must be a number')
        .custom(value => {
            if (parseFloat(value) < 0) {
                throw new Error('Salary cannot be negative');
            }
            return true;
        }),
    
    body('date_of_joining')
        .optional()
        .isISO8601().withMessage('Date of joining must be a valid date (YYYY-MM-DD)')
        .toDate(),
    
    body('department')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Department cannot exceed 100 characters')
];

/**
 * VALIDATE MONGODB OBJECTID
 * 
 * WHY?
 * - MongoDB IDs have a specific format (24 hex characters)
 * - Invalid IDs would cause database errors
 * - Better to catch early with a nice error message
 */
const validateEmployeeId = [
    param('eid')
        .custom(value => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error('Invalid employee ID format');
            }
            return true;
        })
];

/**
 * VALIDATE EMPLOYEE ID IN QUERY STRING (for DELETE)
 */
const validateEmployeeIdQuery = [
    query('eid')
        .notEmpty().withMessage('Employee ID is required')
        .custom(value => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error('Invalid employee ID format');
            }
            return true;
        })
];

/**
 * VALIDATION RESULT HANDLER
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const logger = require('../utils/logger');
        logger.warn(`Validation failed: ${JSON.stringify(errors.array())}`);
        
        return res.status(400).json({
            status: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    
    next();
};

module.exports = {
    createEmployeeValidation,
    updateEmployeeValidation,
    validateEmployeeId,
    validateEmployeeIdQuery,
    validate
};
