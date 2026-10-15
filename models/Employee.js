/**
 * Employee Model
 * 
 * KEY CONCEPT: User-Employee Relationship
 * 
 * The 'user' field creates a relationship:
 * - type: mongoose.Schema.Types.ObjectId → stores a reference ID
 * - ref: 'User' → tells Mongoose this references the User model
 * 
 * This allows:
 * 1. Each employee to "belong to" one user
 * 2. Finding all employees for a specific user
 * 3. Preventing users from seeing other users' employees
 * 
 * DATA OWNERSHIP is enforced by:
 * - Always including user ID in queries
 * - Setting user from authenticated token (not from request body)
 */

const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        minlength: [2, 'First name must be at least 2 characters'],
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    last_name: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        minlength: [2, 'Last name must be at least 2 characters'],
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email address'
        ]
    },
    position: {
        type: String,
        required: [true, 'Position is required'],
        trim: true,
        maxlength: [100, 'Position cannot exceed 100 characters']
    },
    salary: {
        type: Number,
        required: [true, 'Salary is required'],
        min: [0, 'Salary cannot be negative']
    },
    date_of_joining: {
        type: Date,
        required: [true, 'Date of joining is required']
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        trim: true,
        maxlength: [100, 'Department cannot exceed 100 characters']
    },
    /**
     * USER REFERENCE - THIS IS THE KEY RELATIONSHIP!
     * 
     * WHY?
     * - Links employee to the user who created them
     * - Enables access control (ownership)
     * - Required field ensures every employee has an owner
     * 
     * mongoose.Schema.Types.ObjectId is MongoDB's unique ID type
     * ref: 'User' tells Mongoose which model this references
     */
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required']
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

// Index for faster queries by user (we'll query by user often!)
// This makes "find all employees for user X" very fast
employeeSchema.index({ user: 1 });

// Compound index for user + _id (for finding specific employee of a user)
employeeSchema.index({ user: 1, _id: 1 });

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
