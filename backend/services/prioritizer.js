const { DAY } = require('../utils/dateRange');

const PRIORITY_POINTS = { High: 30, Medium: 15, Low: 0 };

/** Deterministic, explainable score. The AI only narrates this ranking, it never invents it. */
function scoreTask(task, now = new Date()) {
  let score = PRIORITY_POINTS[task.priority] ?? 0;
  const reasons = [];
  if (task.priority === 'High') reasons.push('High priority');

  if (task.dueDate) {
    const days = (new Date(task.dueDate).getTime() - now.getTime()) / DAY;
    if (days < 0) {
      score += 100 + Math.min(Math.abs(days), 30);
      reasons.push(`Overdue by ${Math.ceil(-days)} day(s)`);
    } else if (days <= 1) { score += 50; reasons.push('Due within 24 hours'); }
    else if (days <= 3) { score += 30; reasons.push('Due within 3 days'); }
    else if (days <= 7) { score += 15; reasons.push('Due within a week'); }
  }
  if (task.status === 'In Progress') { score += 5; reasons.push('Already in progress'); }
  return { score: Math.round(score), reasons };
}

function rankTasks(tasks, now = new Date()) {
  const far = Number.MAX_SAFE_INTEGER;
  return tasks
    .filter((t) => t.status !== 'Completed')
    .map((t) => ({ task: t, ...scoreTask(t, now) }))
    .sort((a, b) =>
      b.score - a.score ||
      (a.task.dueDate ? new Date(a.task.dueDate).getTime() : far) - (b.task.dueDate ? new Date(b.task.dueDate).getTime() : far) ||
      new Date(a.task.createdAt) - new Date(b.task.createdAt)
    );
}

module.exports = { scoreTask, rankTasks };
