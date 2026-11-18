const ApiError = require('./ApiError');
const DAY = 86400000;

function toDate(value, name, endOfDay = false) {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const d = new Date(dateOnly && endOfDay ? `${value}T23:59:59.999Z` : value);
  if (Number.isNaN(d.getTime())) throw new ApiError(400, `"${name}" is not a valid date`);
  return d;
}

/** Accepts range=7d|30d|90d or from/to (ISO or YYYY-MM-DD). Returns {from, to} (either may be null). */
function parseDateRange(q = {}, now = new Date()) {
  let from = null;
  let to = null;
  if (q.range) {
    const m = /^(\d{1,3})d$/.exec(q.range);
    if (!m) throw new ApiError(400, 'range must look like 7d, 30d or 90d');
    to = now;
    from = new Date(now.getTime() - Number(m[1]) * DAY);
  } else {
    if (q.from) from = toDate(q.from, 'from');
    if (q.to) to = toDate(q.to, 'to', true);
    if (from && !to) to = now;
  }
  if (from && to && from > to) throw new ApiError(400, '"from" must be before "to"');
  return { from, to };
}

/** The equally long period immediately before `range`. */
function previousRange({ from, to }) {
  if (!from || !to) return null;
  const len = to.getTime() - from.getTime();
  return { from: new Date(from.getTime() - len), to: new Date(from.getTime()) };
}

function bucketStart(date, unit) {
  const x = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  if (unit === 'week') x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); // Monday
  if (unit === 'month') x.setUTCDate(1);
  return x;
}

function nextBucket(date, unit) {
  const x = new Date(date);
  if (unit === 'day') x.setUTCDate(x.getUTCDate() + 1);
  else if (unit === 'week') x.setUTCDate(x.getUTCDate() + 7);
  else x.setUTCMonth(x.getUTCMonth() + 1);
  return x;
}

module.exports = { parseDateRange, previousRange, bucketStart, nextBucket, DAY };
