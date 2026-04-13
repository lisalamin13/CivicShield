const mongoose = require('mongoose');

const HEX_OBJECT_ID = /^[a-f0-9]{24}$/i;

const buildCandidates = (organizationId) => {
    const normalizedOrganizationId = String(organizationId);
    const candidates = [normalizedOrganizationId];

    if (HEX_OBJECT_ID.test(normalizedOrganizationId)) {
        candidates.push(new mongoose.Types.ObjectId(normalizedOrganizationId));
    }

    return candidates;
};

exports.buildOrganizationFilter = (field, organizationId) => ({
    [field]: { $in: buildCandidates(organizationId) }
});

exports.buildReportOrganizationFilter = (organizationId) => ({
    $or: [
        { organizationId: String(organizationId) },
        { organization: { $in: buildCandidates(organizationId) } }
    ]
});
