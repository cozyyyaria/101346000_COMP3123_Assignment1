/**
 * Employee Controller
 * 
 * CRITICAL SECURITY CONCEPT: DATA OWNERSHIP
 * 
 * Every operation MUST verify that:
 * 1. User is authenticated (handled by auth middleware)
 * 2. Employee belongs to the authenticated user
 * 
 * HOW OWNERSHIP IS ENFORCED:
 * - We get userId from req.user (set by auth middleware)
 * - We NEVER trust user ID from request body or URL
 * - All queries include { user: req.user._id }
 * - This ensures User A cannot access User B's employees
 * 
 * EXAMPLE ATTACK SCENARIO:
 * - User A knows User B's employee ID
 * - User A tries: GET /api/v1/emp/employees/xyz (where xyz belongs to B)
 * - Our query: Employee.findOne({ _id: xyz, user: A._id })
 * - Returns null because employee belongs to B, not A
 * - User A gets 404 "Not found" - cannot access B's data
 */

const Employee = require('../models/Employee');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * GET ALL EMPLOYEES
 * 
 * GET /api/v1/emp/employees
 * 
 * Returns only employees belonging to the authenticated user
 */
const getAllEmployees = catchAsync(async (req, res, next) => {
    /**
     * KEY SECURITY LINE: { user: req.user._id }
     * 
     * This ensures we ONLY return employees owned by this user
     * User A will never see User B's employees
     */
    const employees = await Employee.find({ user: req.user._id })
        .sort({ created_at: -1 }); // Newest first
    
    logger.info(`User ${req.user.username} fetched ${employees.length} employees`);
    
    res.status(200).json({
        status: true,
        message: 'Employees retrieved successfully',
        data: employees
    });
});

/**
 * CREATE EMPLOYEE
 * 
 * POST /api/v1/emp/employees
 * 
 * Creates a new employee owned by the authenticated user
 */
const createEmployee = catchAsync(async (req, res, next) => {
    const {
        first_name,
        last_name,
        email,
        position,
        salary,
        date_of_joining,
        department
    } = req.body;
    
    /**
     * KEY SECURITY LINE: user: req.user._id
     * 
     * WHY?
     * - Sets the owner of this employee
     * - Gets user from JWT token (verified by auth middleware)
     * - NEVER accept user ID from request body
     * 
     * If we accepted user ID from body, attacker could:
     * - Send { user: "otherUserId", ... }
     * - Create employees in other users' accounts
     */
    const employee = await Employee.create({
        first_name,
        last_name,
        email,
        position,
        salary,
        date_of_joining,
        department,
        user: req.user._id // Owner set from authenticated user
    });
    
    logger.info(`User ${req.user.username} created employee: ${first_name} ${last_name}`);
    
    res.status(201).json({
        status: true,
        message: 'Employee created successfully',
        data: employee
    });
});

/**
 * GET EMPLOYEE BY ID
 * 
 * GET /api/v1/emp/employees/:eid
 * 
 * Returns a specific employee if owned by authenticated user
 */
const getEmployeeById = catchAsync(async (req, res, next) => {
    const { eid } = req.params;
    
    /**
     * OWNERSHIP CHECK
     * 
     * Query requires BOTH:
     * - _id: eid (the employee ID)
     * - user: req.user._id (must belong to this user)
     * 
     * If employee belongs to different user, this returns null
     */
    const employee = await Employee.findOne({
        _id: eid,
        user: req.user._id
    });
    
    if (!employee) {
        logger.warn(`User ${req.user.username} tried to access non-existent/unauthorized employee: ${eid}`);
        return next(new AppError('Employee not found', 404));
    }
    
    logger.info(`User ${req.user.username} fetched employee: ${employee.first_name} ${employee.last_name}`);
    
    res.status(200).json({
        status: true,
        message: 'Employee retrieved successfully',
        data: employee
    });
});

/**
 * UPDATE EMPLOYEE
 * 
 * PUT /api/v1/emp/employees/:eid
 * 
 * Updates an employee if owned by authenticated user
 */
const updateEmployee = catchAsync(async (req, res, next) => {
    const { eid } = req.params;
    
    // Fields that can be updated
    const allowedUpdates = [
        'first_name',
        'last_name',
        'email',
        'position',
        'salary',
        'date_of_joining',
        'department'
    ];
    
    // Build update object with only allowed fields
    const updates = {};
    allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    });
    
    /**
     * findOneAndUpdate with ownership check
     * 
     * Options:
     * - new: true → return updated document (not old one)
     * - runValidators: true → run schema validators on update
     */
    const employee = await Employee.findOneAndUpdate(
        { _id: eid, user: req.user._id }, // Query (includes ownership)
        updates, // Update data
        { new: true, runValidators: true } // Options
    );
    
    if (!employee) {
        logger.warn(`User ${req.user.username} tried to update non-existent/unauthorized employee: ${eid}`);
        return next(new AppError('Employee not found', 404));
    }
    
    logger.info(`User ${req.user.username} updated employee: ${employee.first_name} ${employee.last_name}`);
    
    res.status(200).json({
        status: true,
        message: 'Employee updated successfully',
        data: employee
    });
});

/**
 * DELETE EMPLOYEE
 * 
 * DELETE /api/v1/emp/employees?eid=xxx
 * 
 * Note: Uses query parameter (?eid=xxx) as per assignment requirements
 */
const deleteEmployee = catchAsync(async (req, res, next) => {
    const { eid } = req.query;
    
    /**
     * findOneAndDelete with ownership check
     * 
     * User can only delete their own employees
     */
    const employee = await Employee.findOneAndDelete({
        _id: eid,
        user: req.user._id
    });
    
    if (!employee) {
        logger.warn(`User ${req.user.username} tried to delete non-existent/unauthorized employee: ${eid}`);
        return next(new AppError('Employee not found', 404));
    }
    
    logger.info(`User ${req.user.username} deleted employee: ${employee.first_name} ${employee.last_name}`);
    
    /**
     * 204 NO CONTENT
     * 
     * WHY 204?
     * - Standard response for successful DELETE
     * - Indicates success but no content to return
     * - Body is empty
     */
    res.status(204).send();
});

module.exports = {
    getAllEmployees,
    createEmployee,
    getEmployeeById,
    updateEmployee,
    deleteEmployee
};
