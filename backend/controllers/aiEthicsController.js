const Policy = require('../models/Policy');
const { generateAIResponse } = require('../services/aiServices');
const { buildOrganizationFilter } = require('../utils/organizationFilter');

exports.consultAdvisor = async (req, res) => {
    try {
        const { userQuery } = req.body;
        const organizationId = req.organizationId;

        if (!userQuery) {
            return res.status(400).json({ success: false, error: 'A user query is required.' });
        }

        const policies = await Policy.find(
            buildOrganizationFilter('organization', organizationId)
        );

        if (!policies.length) {
            return res.status(404).json({
                success: false,
                error: `No policies found for organization: ${organizationId}`
            });
        }

        const policyContext = policies.map((policy) => `- ${policy.title}: ${policy.content}`).join('\n');

        const prompt = `
            You are the CivicShield AI Ethics Advisor for an institution.

            Institutional policies:
            ${policyContext}

            User question: "${userQuery}"

            Instructions: Use the policies above to provide guidance. Be professional and anonymous.
        `;

        const advice = await generateAIResponse(prompt);

        res.status(200).json({
            success: true,
            data: advice
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
