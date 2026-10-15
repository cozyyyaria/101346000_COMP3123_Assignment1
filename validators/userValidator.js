/**
 * User Input Validators
 * 
 * WHY EXPRESS-VALIDATOR?
 * - Declarative validation rules
 * - Built-in sanitization (cleaning input)
 * - Easy error handling
 * - Works as middleware in Express
 * 
 * HOW IT WORKS:
 * 1. Define validation rules with body('fieldName').rule()
 * 2. Attach validators as middleware to routes
 * 3. Use validationResult() to check for errors
 * 4. Return 400 Bad Request if validation fails
 */

const { body, validationResult } = require('express-validator');

/**
 * SIGNUP VALIDATION
 * 
 * Validates:
 * - username: required, 3-30 chars, alphanumeric
 * - email: required, valid email format
 * - password: required, min 6 chars, at least one letter and number
 */
const signupValidation = [
    body('username')
        .trim() // Remove whitespace
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(), // Converts to lowercase, removes dots from gmail, etc.
    
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number')
];

/**
 * LOGIN VALIDATION
 * 
 * Supports login with either username or email
 * At least one of them must be provided
 */
const loginValidation = [
    // Custom validation: either username or email must be provided
    body().custom((value, { req }) => {
        if (!req.body.username && !req.body.email) {
            throw new Error('Username or email is required');
        }
        return true;
    }),
    
    body('username')
        .optional()
        .trim()
        .notEmpty().withMessage('Username cannot be empty if provided'),
    
    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('Password is required')
];

/**
 * VALIDATION RESULT HANDLER
 * 
 * This middleware checks if any validation errors occurred
 * If yes, returns 400 with error details
 * If no, continues to the next middleware/controller
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        // Log validation failure
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
    signupValidation,
    loginValidation,
    validate
};
