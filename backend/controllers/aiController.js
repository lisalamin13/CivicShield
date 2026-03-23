const { GoogleGenerativeAI } = require("@google/generative-ai");
const Policy = require('../models/Policy');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @desc    Get AI Ethics Advice based on local policies
// @route   POST /api/v1/ai/advise
exports.getEthicsAdvice = async (req, res) => 
{
    try 
    {
        const { userDraft, organizationId } = req.body;

        // 1. Fetch relevant policies from Compliance Module
        const policies = await Policy.find({ organization: organizationId });
        const policyText = policies.map(p => `${p.title}: ${p.content}`).join("\n");

        // 2. Setup the Gemini Model
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        // 3. Create the Prompt (The AI Ethics Advisor logic)
        const prompt = `
            Act as an AI Ethics Advisor for a grievance reporting system called CivicShield.
            
            Here are the Organization's Compliance Policies:
            ${policyText}

            A user is drafting this report: "${userDraft}"

            Based ONLY on the policies above, provide:
            1. Advice on how to make the report more objective.
            2. Any specific policy rules they should mention.
            3. A tone check (ensure it's professional and not just emotional).
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({
            success: true,
            advice: text
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};