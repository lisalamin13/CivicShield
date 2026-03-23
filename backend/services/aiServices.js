const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ 
    model: "gemini-3-flash-preview",
    // Adding safety settings to ensure it doesn't block "sensitive" grievances
    safetySettings:
    [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" }
    ]
});

exports.analyzeGrievance = async (grievanceText) => 
{ // Renamed parameter to grievanceText
    try 
    {
        const prompt = `Analyze this anonymous grievance for a whistleblower portal:
                        1. Provide a 2-sentence executive_summary.
                        2. Classify it into EXACTLY ONE of these categories: [Safety, Financial Fraud, Workplace Harassment, Infrastructure, Legal Compliance, Other].
                        3. Assign an urgency_score from 0-100 based on physical danger or financial loss.

                        Format the response as a valid JSON object only with these keys: 
                        "executive_summary", "category", "urgency_score".

                        Grievance Text: ${grievanceText}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        // This is where the error was: we call .text() as a function
        let rawContent = response.text();
        
        console.log("RAW AI RESPONSE:", rawContent);

        // Clean any markdown formatting
        const cleanedJson = rawContent
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
        
        return JSON.parse(cleanedJson);
    } 
    catch (error) 
    {
        console.error("DETAILED AI ERROR:", error.message);
        
        return { 
            summary: "Summary unavailable.", 
            category: "Uncategorized", 
            score: 50 
        };
    }
};