const Task = require('../models/Task');
const { parseDateRange, previousRange, bucketStart, nextBucket, DAY } = require('../utils/dateRange');

/*
 * Metric scope rules (documented in README):
 *  - Overview / categories / priorities / deadline rates: tasks CREATED inside the selected range.
 *  - Trends & productivity change: tasks COMPLETED inside the range (completedAt).
 *  - "Overdue now" / "upcoming" lists: current state, ignore the date range.
 * category + priority filters apply everywhere; status filter applies to the created-in-range scope.
 */

const pct = (num, den, digits = 1) => (den > 0 ? Number(((num / den) * 100).toFixed(digits)) : null);
const sumIf = (cond) => ({ $sum: { $cond: [cond, 1, 0] } });
const isDate = (field) => ({ $eq: [{ $type: field }, 'date'] }); // null-safe date check inside $group

function baseFilters(userId, q) {
  const m = { userId };
  if (q.category) m.category = q.category;
  if (q.priority) m.priority = q.priority;
  return m;
}

function scopeMatch(userId, q, range) {
  const m = baseFilters(userId, q);
  if (q.status) m.status = q.status;
  if (range.from || range.to) {
    m.createdAt = {};
    if (range.from) m.createdAt.$gte = range.from;
    if (range.to) m.createdAt.$lte = range.to;
  }
  return m;
}

async function overview(userId, q = {}, now = new Date()) {
  const range = parseDateRange(q, now);
  const completed = { $eq: ['$status', 'Completed'] };
  const overdue = { $and: [isDate('$dueDate'), { $lt: ['$dueDate', now] }, { $ne: ['$status', 'Completed'] }] };
  const eligible = { $and: [completed, isDate('$dueDate'), isDate('$completedAt')] };

  const [row = {}] = await Task.aggregate([
    { $match: scopeMatch(userId, q, range) },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: sumIf(completed),
        pending: sumIf({ $eq: ['$status', 'Pending'] }),
        inProgress: sumIf({ $eq: ['$status', 'In Progress'] }),
        overdue: sumIf(overdue),
        onTimeEligible: sumIf(eligible),
        onTime: sumIf({ $and: [eligible, { $lte: ['$completedAt', '$dueDate'] }] }),
        avgCompletionMs: {
          $avg: { $cond: [{ $and: [completed, isDate('$completedAt')] }, { $subtract: ['$completedAt', '$createdAt'] }, null] },
        },
      },
    },
  ]);

  const total = row.total || 0;
  const done = row.completed || 0;
  const result = {
    range: { from: range.from, to: range.to },
    total,
    completed: done,
    pending: row.pending || 0,
    inProgress: row.inProgress || 0,
    overdue: row.overdue || 0,
    completionRate: total > 0 ? pct(done, total) : 0,
    onTimeRate: pct(row.onTime || 0, row.onTimeEligible || 0), // null => empty state
    avgCompletionHours: row.avgCompletionMs != null ? Number((row.avgCompletionMs / 3600000).toFixed(1)) : null,
    productivityChange: null,
  };

  const prev = previousRange(range);
  if (prev) {
    const countDone = (r) =>
      Task.countDocuments({ ...baseFilters(userId, q), status: 'Completed', completedAt: { $gte: r.from, $lte: r.to } });
    const [current, previous] = await Promise.all([countDone(range), countDone(prev)]);
    result.productivityChange = {
      current,
      previous,
      absolute: current - previous,
      percent: previous > 0 ? pct(current - previous, previous) : null, // avoid misleading % on zero base
    };
  }
  return result;
}

async function trends(userId, q = {}, now = new Date()) {
  const unit = q.unit || 'day';
  const range = parseDateRange(q.range || q.from || q.to ? q : { range: '30d' }, now);
  const match = { ...baseFilters(userId, q), status: 'Completed', completedAt: { $gte: range.from, $lte: range.to } };
  const trunc = { date: '$completedAt', unit, timezone: 'UTC' };
  if (unit === 'week') trunc.startOfWeek = 'monday';

  const rows = await Task.aggregate([
    { $match: match },
    { $group: { _id: { $dateTrunc: trunc }, completed: { $sum: 1 } } },
  ]);
  const byKey = new Map(rows.map((r) => [r._id.toISOString(), r.completed]));

  const points = [];
  let cursor = bucketStart(range.from, unit);
  const last = bucketStart(range.to, unit);
  for (let i = 0; cursor <= last && i < 400; i += 1) {
    points.push({ date: cursor.toISOString(), completed: byKey.get(cursor.toISOString()) || 0 });
    cursor = nextBucket(cursor, unit);
  }
  return { unit, range, points };
}

async function groupedBreakdown(userId, q, field) {
  const range = parseDateRange(q);
  const rows = await Task.aggregate([
    { $match: scopeMatch(userId, q, range) },
    { $group: { _id: `$${field}`, total: { $sum: 1 }, completed: sumIf({ $eq: ['$status', 'Completed'] }) } },
  ]);
  const grand = rows.reduce((s, r) => s + r.total, 0);
  return rows.map((r) => ({
    [field]: r._id,
    total: r.total,
    completed: r.completed,
    share: pct(r.total, grand) ?? 0,
    completionRate: pct(r.completed, r.total) ?? 0,
  }));
}

async function categories(userId, q = {}) {
  const rows = await groupedBreakdown(userId, q, 'category');
  return rows.sort((a, b) => b.total - a.total);
}

async function priorities(userId, q = {}) {
  const rows = await groupedBreakdown(userId, q, 'priority');
  const order = { High: 0, Medium: 1, Low: 2 };
  return rows.sort((a, b) => order[a.priority] - order[b.priority]);
}

async function deadlines(userId, q = {}, now = new Date()) {
  const base = { ...baseFilters(userId, q), status: { $ne: 'Completed' } };
  const days = q.days || 7;
  const fields = 'title priority status category dueDate';
  const [stats, overdueList, upcoming] = await Promise.all([
    overview(userId, q, now),
    Task.find({ ...base, dueDate: { $lt: now } }).sort({ dueDate: 1 }).limit(10).select(fields).lean(),
    Task.find({ ...base, dueDate: { $gte: now, $lte: new Date(now.getTime() + days * DAY) } })
      .sort({ dueDate: 1 }).limit(10).select(fields).lean(),
  ]);
  return {
    overdueInScope: stats.overdue,
    onTimeRate: stats.onTimeRate,
    overdueNow: overdueList,
    upcoming: { days, tasks: upcoming },
  };
}

async function report(userId, q = {}, now = new Date()) {
  const [ov, tr, cat, pri, dl] = await Promise.all([
    overview(userId, q, now), trends(userId, q, now), categories(userId, q), priorities(userId, q), deadlines(userId, q, now),
  ]);
  return { generatedAt: now, overview: ov, trends: tr, categories: cat, priorities: pri, deadlines: dl };
}

module.exports = { overview, trends, categories, priorities, deadlines, report };
