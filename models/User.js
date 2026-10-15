/**
 * User Model
 * 
 * WHY THIS STRUCTURE?
 * - Schema defines what a "User" document looks like in MongoDB
 * - Validation ensures data integrity BEFORE saving to database
 * - Indexes make lookups by username/email fast
 * - Timestamps auto-add created_at and updated_at
 * 
 * SECURITY NOTES:
 * - Password is NEVER returned in queries (select: false)
 * - Password is hashed BEFORE saving (pre-save hook)
 * - We use bcrypt which is specifically designed for password hashing
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true, // No two users can have same username
        trim: true,   // Remove whitespace from ends
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true, // Always store emails in lowercase
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email address'
        ]
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // IMPORTANT: Never return password in queries by default
    }
}, {
    // Mongoose will automatically add createdAt and updatedAt
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

/**
 * PRE-SAVE HOOK (Middleware)
 * 
 * WHY?
 * - Runs BEFORE a document is saved to the database
 * - We use it to hash the password automatically
 * - Only hashes if password was modified (not on every save)
 * 
 * BCRYPT EXPLAINED:
 * - bcrypt.genSalt(10) creates a random "salt" 
 *   Salt ensures same password creates different hashes
 *   The "10" is the cost factor (higher = slower but more secure)
 * - bcrypt.hash() combines password + salt into a secure hash
 */
userSchema.pre('save', async function(next) {
    // Only hash the password if it was modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }
    
    try {
        // Generate salt (random data to make hash unique)
        const salt = await bcrypt.genSalt(10);
        // Hash password with salt
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

/**
 * INSTANCE METHOD: comparePassword
 * 
 * WHY?
 * - We need to verify passwords during login
 * - bcrypt.compare() checks if plain password matches stored hash
 * - This is attached to every User document instance
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
    // bcrypt.compare handles the salt automatically
    return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * INSTANCE METHOD: toJSON
 * 
 * WHY?
 * - Extra safety to NEVER send password in API responses
 * - Called automatically when sending user data as JSON
 */
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    return user;
};

// Create indexes for faster lookups
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

// Create and export the model
// mongoose.model('User', userSchema) creates a "users" collection in MongoDB
const User = mongoose.model('User', userSchema);

module.exports = User;
