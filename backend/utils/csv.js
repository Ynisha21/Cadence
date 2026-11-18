/** Escapes a value for CSV and neutralises spreadsheet formula injection (=, +, -, @). */
function escapeCell(value) {
  if (value === null || value === undefined) return '';
  let s = value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** columns: [{ header, value: (row) => any }] */
function toCsv(rows, columns) {
  const head = columns.map((c) => escapeCell(c.header)).join(',');
  const body = rows.map((r) => columns.map((c) => escapeCell(c.value(r))).join(','));
  return '\uFEFF' + [head, ...body].join('\r\n');
}

module.exports = { toCsv, escapeCell };
