/**
 * User Routes
 * 
 * WHY EXPRESS ROUTER?
 * - Modular route handling
 * - Group related routes together
 * - Can apply middleware to groups of routes
 * - Cleaner main server file
 * 
 * ROUTE PATTERN:
 * router.METHOD(PATH, [MIDDLEWARE], CONTROLLER)
 * 
 * MIDDLEWARE CHAIN:
 * For /signup: signupValidation → validate → signup controller
 * Each middleware calls next() to proceed to next in chain
 */

const express = require('express');
const router = express.Router();

// Controllers
const { signup, login } = require('../controllers/userController');

// Validators
const { signupValidation, loginValidation, validate } = require('../validators/userValidator');

/**
 * POST /api/v1/user/signup
 * 
 * MIDDLEWARE CHAIN:
 * 1. signupValidation - defines validation rules
 * 2. validate - checks if validation passed
 * 3. signup - actual controller logic
 * 
 * If validation fails, returns 400 and never reaches signup
 */
router.post('/signup', signupValidation, validate, signup);

/**
 * POST /api/v1/user/login
 * 
 * Rate limiting is applied in main server.js
 */
router.post('/login', loginValidation, validate, login);

module.exports = router;
