const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// OWASP currently recommends at least 210,000 iterations for PBKDF2-HMAC-SHA512. 
// This is stored as a named constant rather than a number repeated in 
// multiple places, and is also saved per user, so raising this value 
// again in the future won't invalidate existing users' passwords
const PBKDF2_ITERATIONS = 210000;

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    hash: String,
    salt: String,
    // The PBKDF2 iteration count actually used for this user's hash.
    // Stored per user instead of assumed globally.
    iterations: {
        type: Number,
        required: true,
        default: PBKDF2_ITERATIONS
    },
    // Determines whether this user can perform admin-only actions. 
    // Defaults to the least-privileged role.
    // Nothing in the registration flow reads a client-supplied role
    // value.
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
});

// Set password
userSchema.methods.setPassword = function(password){
    this.salt = crypto.randomBytes(16).toString('hex');
    this.iterations = PBKDF2_ITERATIONS;
    this.hash = crypto.pbkdf2Sync(password, this.salt,
        this.iterations, 64, 'sha512').toString('hex');
};

// Check password
userSchema.methods.validPassword = function(password) {
    // Falls back to 1000, the original hardcoded value, for any
    // existing user whose document predates the iterations field.
    const iterations = this.iterations || 1000;
    const hash = crypto.pbkdf2Sync(password,
        this.salt, iterations, 64, 'sha512').toString('hex');
    return this.hash === hash;
};

// Generate JWT
userSchema.methods.generateJWT = function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            name: this.name,
            role: this.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
};

const User = mongoose.model('users', userSchema);
module.exports = User;
