import { useState } from 'react';
import { BarChart3, CheckCircle2, Timer } from 'lucide-react';
import { api } from '../api.js';
import { CATEGORIES, fmtHours, useAsync } from '../utils.js';
import { Card, Delta, Empty, ErrorState, Kpi, Ring, Segmented, Skeleton } from '../components/ui.jsx';
import { CategoryBars, Heatmap, PriorityBars, TrendChart } from '../components/charts.jsx';

const RANGES = [{ value: '7d', label: '7 days' }, { value: '30d', label: '30 days' }, { value: '90d', label: '90 days' }, { value: 'custom', label: 'Custom' }];
const UNITS = [{ value: 'day', label: 'Daily' }, { value: 'week', label: 'Weekly' }, { value: 'month', label: 'Monthly' }];

export default function Analytics() {
  const [f, setF] = useState({ range: '30d', from: '', to: '', unit: 'day', category: '', priority: '', status: '' });
  const set = (patch) => setF((x) => ({ ...x, ...patch }));
  const customReady = f.range !== 'custom' || (f.from && f.to);

  const { data, error, loading, reload } = useAsync(async () => {
    if (!customReady) return null;
    const p = { category: f.category, priority: f.priority, status: f.status, ...(f.range === 'custom' ? { from: f.from, to: f.to } : { range: f.range }) };
    const [ov, tr, cat, pri, heat] = await Promise.all([
      api.analytics.overview(p), api.analytics.trends({ ...p, unit: f.unit }), api.analytics.categories(p), api.analytics.priorities(p),
      api.analytics.trends({ category: f.category, priority: f.priority, range: '90d', unit: 'day' }),
    ]);
    return { ov: ov.data, tr: tr.data, cat: cat.data, pri: pri.data, heat: heat.data };
  }, [f.range, f.from, f.to, f.unit, f.category, f.priority, f.status]);

  if (error) return <ErrorState error={error} onRetry={reload} />;
  const ov = data?.ov; const ch = ov?.productivityChange;

  return (
    <div className="stack">
      <div className="page-head" style={{ marginBottom: 0 }}><div><h1>Analytics</h1><p>Understand your completion patterns, workload and deadlines.</p></div></div>

      <Card>
        <div className="toolbar" style={{ marginBottom: 0 }}>
          <Segmented label="Time range" value={f.range} onChange={(v) => set({ range: v })} options={RANGES} />
          {f.range === 'custom' && (<>
            <input className="input input-sm" style={{ width: 'auto' }} type="date" aria-label="From" value={f.from} onChange={(e) => set({ from: e.target.value })} />
            <input className="input input-sm" style={{ width: 'auto' }} type="date" aria-label="To" value={f.to} onChange={(e) => set({ to: e.target.value })} />
          </>)}
          <select className="select select-sm" style={{ width: 'auto' }} aria-label="Category" value={f.category} onChange={(e) => set({ category: e.target.value })}>
            <option value="">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          <select className="select select-sm" style={{ width: 'auto' }} aria-label="Priority" value={f.priority} onChange={(e) => set({ priority: e.target.value })}>
            <option value="">All priorities</option><option>High</option><option>Medium</option><option>Low</option></select>
          <select className="select select-sm" style={{ width: 'auto' }} aria-label="Status" value={f.status} onChange={(e) => set({ status: e.target.value })}>
            <option value="">All statuses</option><option>Pending</option><option>In Progress</option><option>Completed</option></select>
        </div>
        <p className="note" style={{ marginTop: 10 }}>Totals, categories and priorities count tasks <b>created</b> in the range. The trend counts tasks <b>completed</b> in the range.</p>
      </Card>

      {!customReady ? <Card><Empty icon={BarChart3} title="Pick a start and end date" text="Choose both dates to see your custom range." /></Card>
        : !data ? <Skeleton h={300} /> : (<>
          <div className="grid-2">
            <Card title="Completion rate" subtitle="Share of tasks finished">
              <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                <Ring value={ov.completionRate} size={140} stroke={13} />
                <div className="metric-grid" style={{ flex: 1, minWidth: 220 }}>
                  <div className="metric"><strong>{ov.completed}/{ov.total}</strong><span>tasks completed</span></div>
                  <div className="metric"><strong>{ov.overdue}</strong><span>overdue now</span></div>
                </div>
              </div>
            </Card>
            <div className="stack">
              <Kpi icon={CheckCircle2} label="On-time completion" value={ov.onTimeRate == null ? '–' : `${ov.onTimeRate}%`} hint={ov.onTimeRate == null ? 'No completed tasks with due dates' : 'Finished by the due date'} />
              <Kpi icon={Timer} tone="info" label="Average time to finish" value={fmtHours(ov.avgCompletionHours)} hint="Elapsed time, not hours worked" />
            </div>
          </div>

          <Card title="Completion trend" subtitle="Tasks completed per period"
            action={<div className="toolbar" style={{ margin: 0 }}>
              {ch && <span className="muted" style={{ fontSize: '.88rem' }}>vs previous period: <Delta value={ch.absolute} />{ch.percent != null && <> ({ch.percent > 0 ? '+' : ''}{ch.percent}%)</>}</span>}
              <Segmented label="Group by" value={f.unit} onChange={(v) => set({ unit: v })} options={UNITS} />
            </div>}>
            <TrendChart points={data.tr.points} unit={data.tr.unit} height={290} />
          </Card>

          <div className="grid-eq">
            <Card title="Workload by category" subtitle="Total vs completed">
              {data.cat.length ? <CategoryBars data={data.cat} /> : <Empty icon={BarChart3} title="No data" text="No tasks match these filters." />}
            </Card>
            <Card title="Priority outcomes" subtitle="Are high-priority tasks getting done?">
              {data.pri.length ? <PriorityBars data={data.pri} /> : <Empty icon={BarChart3} title="No data" text="No tasks match these filters." />}
            </Card>
          </div>

          <Card title="Category breakdown" subtitle="Share of workload and completion rate">
            <div className="table-wrap">
              <table className="t">
                <thead><tr><th>Category</th><th className="num">Tasks</th><th className="num">Share</th><th style={{ minWidth: 160 }}>Completion</th></tr></thead>
                <tbody>
                  {data.cat.map((c) => (
                    <tr key={c.category}><td><b>{c.category}</b></td><td className="num">{c.total}</td><td className="num">{c.share}%</td>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div className="bar" style={{ flex: 1 }}><i style={{ width: `${c.completionRate}%` }} /></div><span className="num" style={{ width: 44, textAlign: 'right' }}>{c.completionRate}%</span></div></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Activity, last 90 days" subtitle="Each square is one day. Darker means more tasks completed.">
            <Heatmap points={data.heat.points} />
          </Card>
        </>)}
      {loading && data && <div className="note" aria-live="polite">Updating…</div>}
    </div>
  );
}
