const asyncHandler = require('../utils/asyncHandler');
const analytics = require('../services/analyticsService');

const make = (fn) =>
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await fn(req.user._id, req.valid.query) });
  });

exports.overview = make(analytics.overview);
exports.trends = make(analytics.trends);
exports.categories = make(analytics.categories);
exports.priorities = make(analytics.priorities);
exports.deadlines = make(analytics.deadlines);
exports.report = make(analytics.report);
