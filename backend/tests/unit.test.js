const test = require('node:test');
const assert = require('node:assert/strict');
const { scoreTask, rankTasks } = require('../services/prioritizer');
const { toCsv, escapeCell } = require('../utils/csv');
const { parseDateRange, previousRange, bucketStart, nextBucket } = require('../utils/dateRange');

const NOW = new Date('2026-10-31T12:00:00Z');
const inDays = (n) => new Date(NOW.getTime() + n * 86400000);

test('overdue tasks outrank high-priority tasks that are not due', () => {
  const ranked = rankTasks([
    { title: 'A', priority: 'High', status: 'Pending', dueDate: inDays(20), createdAt: NOW },
    { title: 'B', priority: 'Low', status: 'Pending', dueDate: inDays(-2), createdAt: NOW },
  ], NOW);
  assert.equal(ranked[0].task.title, 'B');
  assert.match(ranked[0].reasons[0], /Overdue/);
});

test('completed tasks are never ranked', () => {
  assert.equal(rankTasks([{ title: 'x', priority: 'High', status: 'Completed', createdAt: NOW }], NOW).length, 0);
});

test('tasks without due dates get only priority/status points', () => {
  assert.equal(scoreTask({ priority: 'Medium', status: 'Pending' }, NOW).score, 15);
});

test('CSV escapes quotes/commas and blocks formula injection', () => {
  assert.equal(escapeCell('a,"b"'), '"a,""b"""');
  assert.equal(escapeCell('=SUM(A1)'), "'=SUM(A1)");
  assert.equal(escapeCell(null), '');
  const csv = toCsv([{ t: 'Hi' }], [{ header: 'Title', value: (r) => r.t }]);
  assert.ok(csv.endsWith('Title\r\nHi'));
});

test('date range parsing', () => {
  const r = parseDateRange({ range: '7d' }, NOW);
  assert.equal(r.to, NOW);
  assert.equal(NOW - r.from, 7 * 86400000);
  assert.throws(() => parseDateRange({ range: 'abc' }, NOW));
  assert.throws(() => parseDateRange({ from: '2026-10-10', to: '2026-10-01' }, NOW));
  assert.equal(parseDateRange({}, NOW).from, null);
});

test('previous range is equally long and adjacent', () => {
  const cur = parseDateRange({ range: '30d' }, NOW);
  const prev = previousRange(cur);
  assert.equal(prev.to.getTime(), cur.from.getTime());
  assert.equal(cur.to - cur.from, prev.to - prev.from);
  assert.equal(previousRange({ from: null, to: null }), null);
});

test('week buckets start on Monday; months on the 1st', () => {
  assert.equal(bucketStart(new Date('2026-10-31T12:00:00Z'), 'week').toISOString(), '2026-10-26T00:00:00.000Z');
  assert.equal(bucketStart(new Date('2026-10-31T12:00:00Z'), 'month').toISOString(), '2026-10-01T00:00:00.000Z');
  assert.equal(nextBucket(new Date('2026-10-01T00:00:00Z'), 'month').toISOString(), '2026-11-01T00:00:00.000Z');
});
