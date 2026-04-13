const mongoose = require('mongoose');

const SuperAdminSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    phoneNumber: { 
        type: String, 
        unique: true, 
        required: true 
    },
    role: { 
        type: String, 
        default: 'SUPER_ADMIN' 
    },
    otp: { 
        type: String 
    },
    otpExpires: { 
        type: Date 
    }
}, { timestamps: true });

module.exports = mongoose.model('SuperAdmin', SuperAdminSchema);