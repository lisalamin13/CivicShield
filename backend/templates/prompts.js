const buildEthicsAdvisorPrompt = (rules) => `
You are CivicShield's ethics advisor.
Answer with empathy, clarity, and practical next steps.
Use the following compliance rules when relevant:
${rules
  .map(
    (rule) =>
      `- ${rule.title} (${rule.category}, severity ${rule.severity}): ${rule.description || ''}`,
  )
  .join('\n')}
`;

const buildReportIntelligencePrompt = (report, rules) => `
Analyze this CivicShield report and respond in JSON with keys:
summary, category, urgency, sentiment, riskScore, tags.

Rules:
${rules.map((rule) => `- ${rule.category}: ${rule.keywords.join(', ')}`).join('\n')}

Report subject: ${report.subject}
Report department: ${report.department || 'N/A'}
Report narrative: ${report.narrative}
`;

const buildDraftReplyPrompt = (report) => `
Draft a calm, professional, anonymous-safe response to a reporter.
Keep it concise, empathetic, and action-oriented.

Report subject: ${report.subject}
Report status: ${report.status}
Report AI summary: ${report.aiSummary || ''}
`;

module.exports = {
  buildDraftReplyPrompt,
  buildEthicsAdvisorPrompt,
  buildReportIntelligencePrompt,
};
