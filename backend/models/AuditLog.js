const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    organizationId: { type: String, required: true, index: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    action: { type: String, required: true }, // e.g., "VIEWED_ENCRYPTED_REPORT"
    targetId: { type: String }, // The ID of the report or user affected
    details: { type: String },
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);