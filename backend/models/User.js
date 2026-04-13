const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false // This prevents the password from being returned in API calls by default
    },
    role: {
        type: String,
        enum: ['SuperAdmin', 'OrgAdmin', 'DeptHead', 'reporter', 'user'],
        default: 'reporter'
    },
   organization: {
    type: String,
    ref: 'Organization', 
    required: true
},
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Encrypt password using bcrypt before saving to database
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});


// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
        {
            id: this._id,
            role: this.role,
            organizationId: this.organization,
            actorType: 'user'
        },
        process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(enteredPassword, this.password);
};
module.exports = mongoose.model('User', UserSchema);
