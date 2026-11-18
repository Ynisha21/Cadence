const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** One filter builder shared by the task list, CSV export and anything else that lists tasks. */
function buildTaskFilter(userId, q = {}, now = new Date()) {
  const f = { userId }; // ownership is always part of the query
  if (q.status) f.status = q.status;
  if (q.priority) f.priority = q.priority;
  if (q.category) f.category = q.category;
  if (q.search) f.title = { $regex: escapeRegex(q.search), $options: 'i' };

  const created = {};
  if (q.from) created.$gte = new Date(q.from);
  if (q.to) created.$lte = new Date(q.to);
  if (Object.keys(created).length) f.createdAt = created;

  const due = {};
  if (q.dueFrom) due.$gte = new Date(q.dueFrom);
  if (q.dueTo) due.$lte = new Date(q.dueTo);
  if (q.overdue === 'true') {
    due.$lt = now;
    f.$and = [{ status: { $ne: 'Completed' } }];
  }
  if (Object.keys(due).length) f.dueDate = due;
  return f;
}

function isOverdue(task, now = new Date()) {
  return Boolean(task.dueDate) && task.status !== 'Completed' && new Date(task.dueDate) < now;
}

module.exports = { buildTaskFilter, isOverdue };
