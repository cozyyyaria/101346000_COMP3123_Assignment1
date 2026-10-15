/**
 * Employee Routes
 * 
 * ALL ROUTES ARE PROTECTED
 * 
 * The 'protect' middleware runs on EVERY route:
 * - Verifies JWT token
 * - Attaches user to request
 * - Returns 401 if not authenticated
 * 
 * WHY router.use(protect)?
 * - Applies middleware to ALL routes in this router
 * - Don't need to add 'protect' to each route individually
 * - Cleaner and less error-prone
 */

const express = require('express');
const router = express.Router();

// Controllers
const {
    getAllEmployees,
    createEmployee,
    getEmployeeById,
    updateEmployee,
    deleteEmployee
} = require('../controllers/employeeController');

// Middleware
const { protect } = require('../middleware/auth');

// Validators
const {
    createEmployeeValidation,
    updateEmployeeValidation,
    validateEmployeeId,
    validateEmployeeIdQuery,
    validate
} = require('../validators/employeeValidator');

/**
 * APPLY AUTHENTICATION TO ALL ROUTES
 * 
 * This means every route below requires a valid JWT
 * If no token or invalid token → 401 Unauthorized
 */
router.use(protect);

/**
 * GET /api/v1/emp/employees
 * 
 * Returns all employees for authenticated user
 * No validation needed - just authentication
 */
router.get('/employees', getAllEmployees);

/**
 * POST /api/v1/emp/employees
 * 
 * Creates new employee for authenticated user
 * Validates all required fields
 */
router.post('/employees', createEmployeeValidation, validate, createEmployee);

/**
 * GET /api/v1/emp/employees/:eid
 * 
 * Returns specific employee if owned by user
 * Validates that eid is valid MongoDB ObjectId
 */
router.get('/employees/:eid', validateEmployeeId, validate, getEmployeeById);

/**
 * PUT /api/v1/emp/employees/:eid
 * 
 * Updates employee if owned by user
 * All fields optional for update
 */
router.put('/employees/:eid', validateEmployeeId, updateEmployeeValidation, validate, updateEmployee);

/**
 * DELETE /api/v1/emp/employees?eid=xxx
 * 
 * Deletes employee if owned by user
 * Uses query parameter as per assignment spec
 * Returns 204 No Content on success
 */
router.delete('/employees', validateEmployeeIdQuery, validate, deleteEmployee);

module.exports = router;
