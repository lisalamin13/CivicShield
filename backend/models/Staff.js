const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true }, // Hash this!
    role: { type: String, enum: ['Investigator', 'Admin', 'Compliance_Officer'], default: 'Investigator' },
    department: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Staff', StaffSchema);