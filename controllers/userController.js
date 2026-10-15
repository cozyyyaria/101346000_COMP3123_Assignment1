/**
 * User Controller
 * 
 * WHY CONTROLLERS?
 * - Separates business logic from routing
 * - Makes code reusable and testable
 * - Keeps routes file clean and readable
 * - Single Responsibility Principle
 * 
 * CONTROLLER FLOW:
 * 1. Receive request from route
 * 2. Validate/process data
 * 3. Interact with database (via Model)
 * 4. Send response to client
 */

const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * SIGNUP - Register a new user
 * 
 * POST /api/v1/user/signup
 * 
 * FLOW:
 * 1. Extract user data from request body
 * 2. Check if user already exists
 * 3. Create new user (password auto-hashed by model)
 * 4. Generate JWT token
 * 5. Return success response with token
 */
const signup = catchAsync(async (req, res, next) => {
    const { username, email, password } = req.body;
    
    // Check if user with same email or username exists
    const existingUser = await User.findOne({
        $or: [{ email }, { username }]
    });
    
    if (existingUser) {
        // Determine which field is duplicate
        const field = existingUser.email === email ? 'Email' : 'Username';
        logger.warn(`Signup failed: ${field} already exists - ${email || username}`);
        return next(new AppError(`${field} already exists`, 409));
    }
    
    // Create new user
    // NOTE: Password is automatically hashed by the pre-save hook in User model
    const user = await User.create({
        username,
        email,
        password
    });
    
    // Generate JWT token for immediate login
    const token = generateToken(user._id);
    
    logger.info(`New user registered: ${username} (${email})`);
    
    /**
     * RESPONSE STRUCTURE
     * 
     * WHY THIS FORMAT?
     * - Consistent response shape for all endpoints
     * - 'status' field indicates success/failure
     * - 'message' provides human-readable info
     * - 'data' contains the actual payload
     * 
     * NOTE: Password is NOT included (see User model toJSON method)
     */
    res.status(201).json({
        status: true,
        message: 'User registered successfully',
        data: {
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                created_at: user.created_at
            },
            token
        }
    });
});

/**
 * LOGIN - Authenticate user and return JWT
 * 
 * POST /api/v1/user/login
 * 
 * SUPPORTS TWO LOGIN METHODS:
 * 1. Username + Password
 * 2. Email + Password
 * 
 * WHY BOTH?
 * - Better user experience
 * - Users can choose their preferred method
 */
const login = catchAsync(async (req, res, next) => {
    const { username, email, password } = req.body;
    
    // Build query based on what was provided
    let query = {};
    if (email) {
        query.email = email.toLowerCase();
    } else if (username) {
        query.username = username;
    }
    
    /**
     * IMPORTANT: .select('+password')
     * 
     * WHY?
     * - In User model, password has 'select: false'
     * - This means password is NOT returned by default
     * - We need to explicitly request it for login verification
     */
    const user = await User.findOne(query).select('+password');
    
    // Check if user exists
    if (!user) {
        logger.warn(`Login failed: User not found - ${email || username}`);
        // Generic message for security (don't reveal if email exists)
        return next(new AppError('Invalid credentials', 401));
    }
    
    /**
     * VERIFY PASSWORD
     * 
     * comparePassword() is an instance method on User model
     * It uses bcrypt to compare plain password with hashed password
     */
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
        logger.warn(`Login failed: Invalid password for user ${user.username}`);
        return next(new AppError('Invalid credentials', 401));
    }
    
    // Generate JWT token
    const token = generateToken(user._id);
    
    logger.info(`User logged in: ${user.username}`);
    
    res.status(200).json({
        status: true,
        message: 'Login successful',
        data: {
            user: {
                _id: user._id,
                username: user.username,
                email: user.email
            },
            token
        }
    });
});

module.exports = {
    signup,
    login
};
