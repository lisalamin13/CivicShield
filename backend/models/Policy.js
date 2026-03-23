const mongoose = require('mongoose');

const PolicySchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, enum: ['Ethics', 'Financial', 'Academic', 'General'], default: 'General' }
}, { timestamps: true });

module.exports = mongoose.model('Policy', PolicySchema);