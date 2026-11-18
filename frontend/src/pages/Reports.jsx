import { useState } from 'react';
import { Download, FileDown } from 'lucide-react';
import { api } from '../api.js';
import { useUI } from '../context/UIContext.jsx';
import { CATEGORIES, dueInfo, fmtDate, useAsync } from '../utils.js';
import { Card, Empty, ErrorState, PriorityBadge, Skeleton, StatusBadge } from '../components/ui.jsx';

const eod = (d) => (d ? `${d}T23:59:59.999` : '');
const sod = (d) => (d ? `${d}T00:00:00` : '');
const iso = (s) => (s ? new Date(s).toISOString() : '');

export default function Reports() {
  const { toast } = useUI();
  const [f, setF] = useState({ status: '', priority: '', category: '', from: '', to: '', dueFrom: '', dueTo: '', overdue: false });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const params = {
    status: f.status, priority: f.priority, category: f.category,
    from: iso(sod(f.from)), to: iso(eod(f.to)), dueFrom: iso(sod(f.dueFrom)), dueTo: iso(eod(f.dueTo)), overdue: f.overdue ? 'true' : '',
  };
  const { data, error, reload } = useAsync(() => api.tasks.list({ ...params, limit: 8, sortBy: 'createdAt', order: 'desc' }), [JSON.stringify(params)]);

  async function download() {
    setBusy(true);
    try {
      const blob = await api.exportCsv(params);
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: `tasks-${new Date().toISOString().slice(0, 10)}.csv` });
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      toast('CSV downloaded');
    } catch (e) { toast(e.message, 'error'); }
    setBusy(false);
  }

  const total = data?.pagination.total;
  return (
    <div className="stack">
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div><h1>Reports</h1><p>Filter your tasks and export them as CSV for spreadsheets or BI tools.</p></div>
        <button className="btn" onClick={download} disabled={busy || total === 0}><Download size={18} />{busy ? 'Preparing…' : 'Download CSV'}</button>
      </div>

      <Card title="Filters">
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
          <label className="field"><span>Status</span><select className="select" value={f.status} onChange={set('status')}><option value="">Any</option><option>Pending</option><option>In Progress</option><option>Completed</option></select></label>
          <label className="field"><span>Priority</span><select className="select" value={f.priority} onChange={set('priority')}><option value="">Any</option><option>High</option><option>Medium</option><option>Low</option></select></label>
          <label className="field"><span>Category</span><select className="select" value={f.category} onChange={set('category')}><option value="">Any</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="field"><span>Created from</span><input className="input" type="date" value={f.from} onChange={set('from')} /></label>
          <label className="field"><span>Created to</span><input className="input" type="date" value={f.to} onChange={set('to')} /></label>
          <label className="field"><span>Due from</span><input className="input" type="date" value={f.dueFrom} onChange={set('dueFrom')} /></label>
          <label className="field"><span>Due to</span><input className="input" type="date" value={f.dueTo} onChange={set('dueTo')} /></label>
          <label className="check" style={{ alignSelf: 'end', minHeight: 44 }}><input type="checkbox" checked={f.overdue} onChange={set('overdue')} />Overdue only</label>
        </div>
      </Card>

      <Card title="Preview" subtitle={total != null ? `${total} task${total === 1 ? '' : 's'} will be exported` : 'Loading…'}>
        {error ? <ErrorState error={error} onRetry={reload} /> : !data ? <Skeleton h={180} /> : data.data.length === 0 ? (
          <Empty icon={FileDown} title="Nothing to export" text="No tasks match these filters. Loosen a filter to see results." />
        ) : (
          <div className="table-wrap">
            <table className="t">
              <thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Priority</th><th>Due</th><th>Completed</th></tr></thead>
              <tbody>
                {data.data.map((t) => (
                  <tr key={t._id}><td><b>{t.title}</b></td><td>{t.category}</td><td><StatusBadge status={t.status} /></td><td><PriorityBadge priority={t.priority} /></td>
                    <td><span className={`tone-${dueInfo(t).tone}`}>{t.dueDate ? fmtDate(t.dueDate) : '–'}</span></td><td>{t.completedAt ? fmtDate(t.completedAt) : '–'}</td></tr>
                ))}
              </tbody>
            </table>
            {total > 8 && <p className="note" style={{ marginTop: 10 }}>Showing the 8 most recent. The CSV contains all {total}.</p>}
          </div>
        )}
      </Card>
    </div>
  );
}
