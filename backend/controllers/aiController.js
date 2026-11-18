const Task = require('../models/Task');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const analytics = require('../services/analyticsService');
const { rankTasks } = require('../services/prioritizer');
const { generateText, SYSTEM } = require('../services/aiService');

const DISCLAIMER = 'AI suggestions are advisory and may be imperfect. Nothing was changed in your tasks.';
const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : 'none');

// Only the user's OWN incomplete tasks are ever loaded. Client-supplied ids are intersected with ownership.
async function loadRanked(req) {
  const filter = { userId: req.user._id, status: { $ne: 'Completed' } };
  if (req.body.taskIds?.length) filter._id = { $in: req.body.taskIds };
  const tasks = await Task.find(filter).select('title priority status category dueDate createdAt').limit(100).lean();
  if (req.body.taskIds?.length && tasks.length !== new Set(req.body.taskIds).size) {
    throw new ApiError(404, 'One or more tasks were not found');
  }
  return rankTasks(tasks);
}

// Data minimisation: no descriptions, tokens or personal info leave the server.
const lines = (ranked) =>
  ranked.map((r, i) => `${i + 1}. "${r.task.title}" [${r.task.priority}, ${r.task.status}, ${r.task.category}, due ${day(r.task.dueDate)}] score=${r.score} (${r.reasons.join('; ') || 'no urgency signals'})`).join('\n');

const shape = (r) => ({ id: r.task._id, title: r.task.title, priority: r.task.priority, status: r.task.status,
  category: r.task.category, dueDate: r.task.dueDate, score: r.score, reasons: r.reasons });

function respond(res, payload, ai, fallback) {
  res.json({ success: true, ...payload, explanation: ai.text || fallback, aiGenerated: Boolean(ai.text),
    ...(ai.error && { aiNote: ai.error }), disclaimer: DISCLAIMER });
}

exports.prioritize = asyncHandler(async (req, res) => {
  const ranked = (await loadRanked(req)).slice(0, req.body.maxTasks || 10);
  if (!ranked.length) return res.json({ success: true, ranked: [], explanation: 'You have no open tasks. Nice work!', aiGenerated: false, disclaimer: DISCLAIMER });
  const ai = await generateText(SYSTEM, `Today is ${day(new Date())}. These open tasks are already ranked by a rule-based score. Explain briefly why the top ones come first and flag any risk.\n${lines(ranked)}`);
  respond(res, { ranked: ranked.map(shape) }, ai, 'Ranked by overdue status, due-date proximity and priority. See each task\'s reasons.');
});

exports.plan = asyncHandler(async (req, res) => {
  const picked = (await loadRanked(req)).slice(0, req.body.maxTasks || 5);
  if (!picked.length) return res.json({ success: true, plan: [], explanation: 'No open tasks to plan.', aiGenerated: false, disclaimer: DISCLAIMER });
  const hours = req.body.availableHours ? `The user has about ${req.body.availableHours} hours available.` : 'Availability is unknown.';
  const ai = await generateText(SYSTEM, `Today is ${day(new Date())}. ${hours} Suggest a realistic order and rough time blocks for today using these tasks only:\n${lines(picked)}`);
  respond(res, { plan: picked.map(shape) }, ai, 'Suggested order follows the priority score. Start with the first task and work down the list.');
});

exports.summary = asyncHandler(async (req, res) => {
  const q = { range: req.body.range || '7d' };
  const [ov, dl, cats] = await Promise.all([
    analytics.overview(req.user._id, q), analytics.deadlines(req.user._id, q), analytics.categories(req.user._id, q),
  ]);
  const metrics = {
    period: q.range, total: ov.total, completed: ov.completed, pending: ov.pending, inProgress: ov.inProgress,
    overdue: ov.overdue, completionRatePct: ov.completionRate, onTimeRatePct: ov.onTimeRate,
    completedChange: ov.productivityChange, topCategories: cats.slice(0, 3).map((c) => `${c.category} (${c.total})`),
    overdueNow: dl.overdueNow.length, dueSoon: dl.upcoming.tasks.length,
  };
  const ai = await generateText(SYSTEM, `Summarise this user's productivity and suggest 2-3 practical improvements. Metrics (authoritative JSON):\n${JSON.stringify(metrics)}`);
  respond(res, { metrics }, ai, `In the last ${q.range}: ${ov.completed} of ${ov.total} tasks completed (${ov.completionRate}%), ${ov.overdue} overdue.`);
});
