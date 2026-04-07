const mongoose = require('mongoose');

const AccessKeySchema = new mongoose.Schema({
    organizationId: { type: String, required: true, index: true },
    keyName: { type: String, required: true }, // e.g., "HR-Portal-Key"
    apiKey: { type: String, unique: true, required: true },
    permissions: [{ type: String, enum: ['read', 'write', 'admin'], default: ['read'] }],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('AccessKey', AccessKeySchema);