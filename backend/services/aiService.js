const OpenAI = require('openai');

const AIUsageLog = require('../models/AIUsageLog');
const ComplianceRule = require('../models/ComplianceRule');
const SystemSetting = require('../models/SystemSetting');
const { buildDraftReplyPrompt, buildEthicsAdvisorPrompt, buildReportIntelligencePrompt } = require('../templates/prompts');

const getClient = () => {
  if (!process.env.DEEPSEEK_API_KEY) {
    return null;
  }

  const baseURL = process.env.DEEPSEEK_BASE_URL?.endsWith('/v1')
    ? process.env.DEEPSEEK_BASE_URL
    : `${process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'}/v1`;

  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL,
  });
};

const extractJson = (content) => {
  try {
    return JSON.parse(content);
  } catch (_error) {
    const match = content.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  }
};

const keywordCategory = (narrative, rules) => {
  const lowerNarrative = narrative.toLowerCase();
  const matchedRule = rules.find((rule) =>
    rule.keywords.some((keyword) => lowerNarrative.includes(keyword.toLowerCase())),
  );
  return matchedRule?.category || 'general_misconduct';
};

const heuristicIntelligence = (report, rules) => {
  const narrative = report.narrative.toLowerCase();
  const urgentWords = ['threat', 'assault', 'violence', 'retaliation', 'fraud', 'harassment'];
  const positiveWords = ['resolved', 'supportive', 'helpful'];
  const negativeWords = ['abuse', 'unsafe', 'bias', 'corrupt', 'fear', 'bullying'];
  const urgency = urgentWords.some((word) => narrative.includes(word)) ? 'high' : 'medium';
  const sentiment = negativeWords.some((word) => narrative.includes(word))
    ? 'negative'
    : positiveWords.some((word) => narrative.includes(word))
      ? 'positive'
      : 'neutral';
  const category = keywordCategory(report.narrative, rules);

  return {
    summary: `${report.subject}: ${report.narrative.slice(0, 180)}${report.narrative.length > 180 ? '…' : ''}`,
    category,
    urgency,
    sentiment,
    riskScore: urgency === 'high' ? 82 : 54,
    tags: [category, urgency, sentiment],
  };
};

const logUsage = async ({
  organizationId = null,
  userId = null,
  feature,
  status = 'success',
  usage = {},
  modelName,
  latencyMs = 0,
}) =>
  AIUsageLog.create({
    organizationId,
    userId,
    feature,
    modelName,
    tokenIn: usage.prompt_tokens || 0,
    tokenOut: usage.completion_tokens || 0,
    totalTokens: usage.total_tokens || 0,
    latencyMs,
    status,
  });

const getRulesForOrganization = async (organizationId) =>
  ComplianceRule.find({
    isActive: true,
    $or: [{ organizationId }, { organizationId: null }],
  }).lean();

const runChatCompletion = async ({ feature, organizationId, userId, systemPrompt, userPrompt }) => {
  const settings = await SystemSetting.findOne({ key: 'platform' }).lean();
  const client = getClient();
  const modelName = settings?.deepseekModelName || process.env.DEEPSEEK_MODEL || 'deepseek-chat';

  if (!client) {
    await logUsage({
      organizationId,
      userId,
      feature,
      status: 'fallback',
      modelName,
    });
    return null;
  }

  const startedAt = Date.now();
  const completion = await client.chat.completions.create({
    model: modelName,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2,
  });

  await logUsage({
    organizationId,
    userId,
    feature,
    status: 'success',
    usage: completion.usage,
    modelName,
    latencyMs: Date.now() - startedAt,
  });

  return completion.choices?.[0]?.message?.content || '';
};

const ethicsChat = async ({ organizationId, userId, message }) => {
  const rules = await getRulesForOrganization(organizationId);
  const systemPrompt = buildEthicsAdvisorPrompt(rules);
  const modelResponse = await runChatCompletion({
    feature: 'ethics_chat',
    organizationId,
    userId,
    systemPrompt,
    userPrompt: message,
  });

  if (modelResponse) {
    return { answer: modelResponse, source: 'deepseek' };
  }

  return {
    answer:
      'Based on CivicShield policy patterns, document the facts, keep dates and evidence ready, avoid retaliation risks, and submit the report if the concern involves safety, harassment, fraud, retaliation, discrimination, or misconduct.',
    source: 'fallback',
  };
};

const analyzeReport = async ({ report, organizationId, userId }) => {
  const rules = await getRulesForOrganization(organizationId);
  const prompt = buildReportIntelligencePrompt(report, rules);
  const response = await runChatCompletion({
    feature: 'report_intelligence',
    organizationId,
    userId,
    systemPrompt: 'Return only valid JSON.',
    userPrompt: prompt,
  });

  if (response) {
    const parsed = extractJson(response);
    if (parsed) {
      return { ...parsed, source: 'deepseek' };
    }
  }

  return { ...heuristicIntelligence(report, rules), source: 'fallback' };
};

const draftReply = async ({ report, organizationId, userId }) => {
  const response = await runChatCompletion({
    feature: 'draft_reply',
    organizationId,
    userId,
    systemPrompt: 'Write a concise and professional reply suitable for a confidential reporting inbox.',
    userPrompt: buildDraftReplyPrompt(report),
  });

  if (response) {
    return { draft: response, source: 'deepseek' };
  }

  return {
    draft:
      'Thank you for raising this concern through CivicShield. Your report has been received, reviewed for next steps, and routed to the appropriate team. We may request additional details through this secure inbox if needed.',
    source: 'fallback',
  };
};

module.exports = {
  analyzeReport,
  draftReply,
  ethicsChat,
};
