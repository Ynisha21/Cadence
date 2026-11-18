const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const { buildTaskFilter, isOverdue } = require('../services/taskService');
const { toCsv } = require('../utils/csv');

const COLUMNS = [
  { header: 'Task ID', value: (t) => t._id },
  { header: 'Title', value: (t) => t.title },
  { header: 'Category', value: (t) => t.category },
  { header: 'Status', value: (t) => t.status },
  { header: 'Priority', value: (t) => t.priority },
  { header: 'Created At', value: (t) => t.createdAt },
  { header: 'Due Date', value: (t) => t.dueDate },
  { header: 'Completed At', value: (t) => t.completedAt },
  { header: 'Overdue', value: (t) => (isOverdue(t) ? 'Yes' : 'No') },
];

exports.exportTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find(buildTaskFilter(req.user._id, req.valid.query)).sort({ createdAt: -1 }).limit(10000).lean();
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="tasks-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(toCsv(tasks, COLUMNS));
});
