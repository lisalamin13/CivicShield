const mongoose = require('mongoose');

const Organization = require('../models/Organization');
const Report = require('../models/Report');
const Subscription = require('../models/Subscription');
const User = require('../models/User');

const castOrganizationId = (organizationId) =>
  typeof organizationId === 'string'
    ? new mongoose.Types.ObjectId(organizationId)
    : organizationId;

const buildMonthlySeries = async (match = {}) =>
  Report.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    {
      $project: {
        _id: 0,
        label: {
          $concat: [
            { $toString: '$_id.year' },
            '-',
            {
              $cond: [{ $lt: ['$_id.month', 10] }, { $concat: ['0', { $toString: '$_id.month' }] }, { $toString: '$_id.month' }],
            },
          ],
        },
        count: 1,
      },
    },
  ]);

const getPlatformOverview = async () => {
  const [organizations, users, reports, subscriptions, monthlyReports, categoryMix] = await Promise.all([
    Organization.countDocuments(),
    User.countDocuments(),
    Report.countDocuments(),
    Subscription.countDocuments({ status: 'active' }),
    buildMonthlySeries(),
    Report.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  return {
    organizations,
    users,
    reports,
    activeSubscriptions: subscriptions,
    monthlyReports,
    categoryMix,
  };
};

const getOrganizationOverview = async (organizationId) => {
  const scopedOrganizationId = castOrganizationId(organizationId);
  const [reports, openReports, averageRisk, departmentHotspots, monthlyReports] = await Promise.all([
    Report.countDocuments({ organizationId: scopedOrganizationId }),
    Report.countDocuments({
      organizationId: scopedOrganizationId,
      status: { $in: ['submitted', 'under_review', 'investigating', 'waiting_on_reporter'] },
    }),
    Report.aggregate([
      { $match: { organizationId: scopedOrganizationId } },
      { $group: { _id: null, averageRisk: { $avg: '$aiRiskScore' } } },
    ]),
    Report.aggregate([
      { $match: { organizationId: scopedOrganizationId } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    buildMonthlySeries({ organizationId: scopedOrganizationId }),
  ]);

  const velocity = monthlyReports.length ? monthlyReports[monthlyReports.length - 1].count : 0;
  const trailingAverage =
    monthlyReports.length > 0
      ? Math.round(monthlyReports.reduce((sum, item) => sum + item.count, 0) / monthlyReports.length)
      : 0;

  return {
    reports,
    openReports,
    averageRisk: Math.round(averageRisk[0]?.averageRisk || 0),
    departmentHotspots,
    monthlyReports,
    forecastNextMonth: Math.max(velocity, trailingAverage),
  };
};

module.exports = {
  getOrganizationOverview,
  getPlatformOverview,
};
