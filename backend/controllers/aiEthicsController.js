const Policy = require('../models/Policy');
const { generateAIResponse } = require('../services/aiServices');

exports.consultAdvisor = async (req, res) => {
    try {
        const { userQuery } = req.body;
        
        // IMPORTANT: Use req.organizationId (set by your middleware)
        const organizationId = req.organizationId; 

        // 1. Fetch policies specifically for ADBU
        // Ensure the key 'organization' matches your Schema field name
        const policies = await Policy.find({ organization: organizationId });
        
        if (!policies || policies.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: `No policies found for Organization: ${organizationId}` 
            });
        }

        // 2. Format context for Gemini
        const policyContext = policies.map(p => `- ${p.title}: ${p.content}`).join('\n');

        // 3. Construct the prompt
        const prompt = `
            You are the CivicShield AI Ethics Advisor for an institution.
            Institutional Policies:
            ${policyContext}

            User Question: "${userQuery}"

            Instructions: Use the policies above to provide guidance. Be professional and anonymous.
        `;

        // 4. Get the AI advice
        const advice = await generateAIResponse(prompt);

        res.status(200).json({
            success: true,
            data: advice
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};