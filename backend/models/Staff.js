const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
    organizationId: { 
        type: String, 
        required: true, 
        index: true 
    },
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
        enum: ['Admin', 'Investigator', 'Compliance_Officer'], 
        default: 'Admin' 
    },
    otp: { type: String },
    otpExpires: { type: Date },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Staff', StaffSchema);
