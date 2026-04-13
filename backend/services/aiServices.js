const OpenAI = require('openai');

const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

const getClient = () => {
    if (!process.env.DEEPSEEK_API_KEY) {
        throw new Error('DEEPSEEK_API_KEY is not configured.');
    }

    return new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: DEEPSEEK_BASE_URL
    });
};

const extractText = (completion) =>
    completion?.choices?.[0]?.message?.content?.trim() || '';

const parseJsonResponse = (rawContent) => {
    const cleanedJson = rawContent
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

    return JSON.parse(cleanedJson);
};

exports.analyzeGrievance = async (grievanceText) => {
    try {
        const completion = await getClient().chat.completions.create({
            model: DEFAULT_MODEL,
            response_format: { type: 'json_object' },
            messages: [
                {
                    role: 'system',
                    content: [
                        'You analyze anonymous whistleblower grievances.',
                        'Reply in valid json only.',
                        'Use exactly these keys: executive_summary, category, urgency_score.'
                    ].join(' ')
                },
                {
                    role: 'user',
                    content: `Analyze this anonymous grievance for a whistleblower portal:
1. Provide a 2-sentence executive_summary.
2. Classify it into EXACTLY ONE of these categories: [Safety, Financial Fraud, Workplace Harassment, Infrastructure, Legal Compliance, Other].
3. Assign an urgency_score from 0-100 based on physical danger or financial loss.

Return valid json only with these keys:
{
  "executive_summary": "string",
  "category": "string",
  "urgency_score": 0
}

Grievance Text: ${grievanceText}`
                }
            ]
        });

        return parseJsonResponse(extractText(completion));
    } catch (error) {
        console.error('DETAILED AI ERROR:', error.message);

        return {
            executive_summary: 'Summary unavailable.',
            category: 'Uncategorized',
            urgency_score: 50
        };
    }
};

exports.generateAIResponse = async (prompt) => {
    try {
        const completion = await getClient().chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional, neutral ethics advisor for a grievance reporting platform.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });

        return extractText(completion);
    } catch (error) {
        console.error('ETHICS ADVISOR ERROR:', error.message);
        return "I'm sorry, I'm having trouble connecting to the institutional policy engine right now. Please try again later.";
    }
};
