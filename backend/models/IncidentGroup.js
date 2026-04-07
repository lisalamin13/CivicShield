const mongoose = require('mongoose');

const IncidentGroupSchema = new mongoose.Schema({
    organizationId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }],
    status: { type: String, enum: ['Investigating', 'Resolved', 'Dismissed'], default: 'Investigating' },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' }
}, { timestamps: true });

module.exports = mongoose.model('IncidentGroup', IncidentGroupSchema);