const Policy = require('../models/Policy');
const { buildOrganizationFilter } = require('../utils/organizationFilter');
const { generateAIResponse } = require('../services/aiServices');

exports.getEthicsAdvice = async (req, res) => {
    try {
        const userDraft = req.body.userDraft || req.body.text;
        const organizationId = req.body.organizationId || req.body.orgId;

        if (!userDraft || !organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Both a draft and organization ID are required.'
            });
        }

        const policies = await Policy.find(
            buildOrganizationFilter('organization', organizationId)
        );

        const policyText = policies.map((policy) => `${policy.title}: ${policy.content}`).join('\n');
        const prompt = `
            Act as an AI Ethics Advisor for a grievance reporting system called CivicShield.

            Here are the organization's compliance policies:
            ${policyText || 'No policies were found for this organization.'}

            A user is drafting this report: "${userDraft}"

            Based only on the policies above, provide:
            1. Advice on how to make the report more objective.
            2. Any specific policy rules they should mention.
            3. A tone check to keep it professional.
        `;

        const text = await generateAIResponse(prompt);

        res.status(200).json({
            success: true,
            advice: text,
            suggestion: text
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
