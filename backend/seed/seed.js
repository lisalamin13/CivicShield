require('dotenv').config();

const connectDB = require('../config/db');
const AIUsageLog = require('../models/AIUsageLog');
const AuditLog = require('../models/AuditLog');
const ChatMessage = require('../models/ChatMessage');
const ComplianceRule = require('../models/ComplianceRule');
const EvidenceFile = require('../models/EvidenceFile');
const Organization = require('../models/Organization');
const OTPVerification = require('../models/OTPVerification');
const Report = require('../models/Report');
const ReportStatusHistory = require('../models/ReportStatusHistory');
const Subscription = require('../models/Subscription');
const SystemSetting = require('../models/SystemSetting');
const User = require('../models/User');
const { encryptText, hashValue } = require('../utils/crypto');

const seed = async () => {
  await connectDB();

  await Promise.all([
    AIUsageLog.deleteMany({}),
    AuditLog.deleteMany({}),
    ChatMessage.deleteMany({}),
    ComplianceRule.deleteMany({}),
    EvidenceFile.deleteMany({}),
    Organization.deleteMany({}),
    OTPVerification.deleteMany({}),
    Report.deleteMany({}),
    ReportStatusHistory.deleteMany({}),
    Subscription.deleteMany({}),
    SystemSetting.deleteMany({}),
    User.deleteMany({}),
  ]);

  const superAdmin = await User.create({
    name: 'Platform Owner',
    email: 'superadmin@civicshield.com',
    phone: '+15550000001',
    password: 'CivicShield@2026',
    role: 'super_admin',
  });

  const organization = await Organization.create({
    name: 'North Valley College',
    slug: 'north-valley-college',
    type: 'college',
    industry: 'education',
    sizeBand: '201-1000',
    status: 'approved',
    contactEmail: 'compliance@nvc.edu',
    contactPhone: '+15550000010',
    departments: [
      { name: 'Human Resources', code: 'HR' },
      { name: 'Academic Affairs', code: 'ACADEMIC' },
      { name: 'Finance Office', code: 'FIN' },
    ],
  });

  const subscription = await Subscription.create({
    organizationId: organization._id,
    planName: 'Enterprise',
    status: 'active',
    billingCycle: 'yearly',
    price: 6999,
    seatLimit: 75,
    aiTokenLimit: 600000,
    aiTokensUsed: 24100,
    renewalDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
  });

  const orgAdmin = await User.create({
    name: 'Ava Compliance',
    email: 'admin@nvc.edu',
    phone: '+15550000011',
    password: 'CivicShield@2026',
    role: 'org_admin',
    organizationId: organization._id,
    department: 'Human Resources',
  });

  const investigator = await User.create({
    name: 'Liam Investigator',
    email: 'investigator@nvc.edu',
    phone: '+15550000012',
    password: 'CivicShield@2026',
    role: 'investigator',
    organizationId: organization._id,
    department: 'Human Resources',
  });

  const reporter = await User.create({
    name: 'Nina Student',
    email: 'reporter@nvc.edu',
    phone: '+15550000013',
    password: 'CivicShield@2026',
    role: 'reporter',
    organizationId: organization._id,
    department: 'Academic Affairs',
  });

  organization.adminUserId = orgAdmin._id;
  organization.subscriptionId = subscription._id;
  await organization.save();

  await SystemSetting.create({
    key: 'platform',
    supportPhone: '+15550009999',
    twilioSenderNumber: '+15550008888',
    contactEmail: 'support@civicshield.com',
    maintenanceMode: false,
    brandingLogoUrl: '',
    deepseekModelName: 'deepseek-chat',
    aiMonthlyTokenLimit: 500000,
    otpExpiryMinutes: 10,
    otpMaxAttempts: 5,
    updatedBy: superAdmin._id,
  });

  await ComplianceRule.insertMany([
    {
      organizationId: null,
      code: 'HARASSMENT',
      title: 'Harassment',
      category: 'harassment',
      description: 'Verbal, written, or physical conduct that creates a hostile environment.',
      severity: 'high',
      keywords: ['harassment', 'hostile', 'sexual', 'intimidation'],
      responseGuidance: 'Acknowledge, protect confidentiality, and route for prompt review.',
      escalationGuidance: 'Escalate immediately when safety risk or retaliation is mentioned.',
      evidenceHints: ['Screenshots', 'Witness names', 'Incident dates'],
      slaHours: 24,
      isSystem: true,
    },
    {
      organizationId: null,
      code: 'FRAUD',
      title: 'Fraud',
      category: 'fraud',
      description: 'Misrepresentation, embezzlement, billing abuse, or financial manipulation.',
      severity: 'critical',
      keywords: ['fraud', 'embezzlement', 'bribe', 'misuse', 'financial'],
      responseGuidance: 'Preserve records and restrict disclosure to authorized reviewers.',
      escalationGuidance: 'Escalate to audit or legal immediately for active loss exposure.',
      evidenceHints: ['Invoices', 'Approvals', 'Transaction logs'],
      slaHours: 12,
      isSystem: true,
    },
    {
      organizationId: null,
      code: 'DISCRIMINATION',
      title: 'Discrimination',
      category: 'discrimination',
      description: 'Bias or exclusion based on protected characteristics.',
      severity: 'high',
      keywords: ['bias', 'discrimination', 'race', 'gender', 'religion'],
      responseGuidance: 'Document impact, preserve confidentiality, and open formal review.',
      escalationGuidance: 'Escalate if retaliation or repeated patterns are present.',
      evidenceHints: ['Messages', 'Schedules', 'Policy references'],
      slaHours: 24,
      isSystem: true,
    },
  ]);

  const report = await Report.create({
    organizationId: organization._id,
    reporterUserId: reporter._id,
    trackingCode: 'CS-DEMO2026',
    accessKeyHash: hashValue('DEMO2026'),
    anonymous: false,
    subject: 'Repeated retaliation after reporting attendance manipulation',
    category: 'retaliation',
    department: 'Academic Affairs',
    location: 'Main Campus',
    narrativeEncrypted: encryptText(
      'After raising concerns about attendance manipulation, I was excluded from meetings and warned not to speak about it again.',
    ),
    reporterEmailEncrypted: encryptText('reporter@nvc.edu'),
    reporterPhoneEncrypted: encryptText('+15550000013'),
    status: 'under_review',
    priority: 'high',
    assignedTo: investigator._id,
    assignedDepartment: 'Human Resources',
    aiSummary:
      'Reporter alleges attendance abuse and retaliatory exclusion after speaking up about manipulation.',
    aiSentiment: 'negative',
    aiUrgency: 'high',
    aiRiskScore: 84,
    aiTags: ['retaliation', 'attendance', 'high'],
  });

  await ChatMessage.create({
    organizationId: organization._id,
    reportId: report._id,
    senderType: 'org_admin',
    senderUserId: orgAdmin._id,
    bodyEncrypted: encryptText(
      'We have received your report and assigned it for confidential review. We may follow up for clarifying details through this inbox.',
    ),
  });

  await ReportStatusHistory.create({
    organizationId: organization._id,
    reportId: report._id,
    previousStatus: 'submitted',
    newStatus: 'under_review',
    changedByUserId: orgAdmin._id,
    note: 'Assigned to compliance team',
  });

  console.log('CivicShield seed complete');
  console.log('Super admin: superadmin@civicshield.com / CivicShield@2026');
  console.log('Org admin: admin@nvc.edu / CivicShield@2026');
  console.log('Reporter: reporter@nvc.edu / CivicShield@2026');
  console.log('Demo tracking: CS-DEMO2026 / DEMO2026');
  process.exit(0);
};

seed().catch((error) => {
  console.error('Seed failed', error);
  process.exit(1);
});
