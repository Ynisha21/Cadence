import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarClock, Check, CheckCircle2, CircleDashed, Loader, Plus, Sparkles, Timer, Target } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { dueInfo, fmtHours, greeting, useAsync } from '../utils.js';
import { Card, Empty, ErrorState, Kpi, PriorityBadge, Ring, Segmented, Skeleton } from '../components/ui.jsx';
import { StatusDonut, TrendChart } from '../components/charts.jsx';
import TaskModal from '../components/TaskModal.jsx';

const RANGES = [{ value: '7d', label: '7 days' }, { value: '30d', label: '30 days' }, { value: '90d', label: '90 days' }];

function DeadlineList({ tasks, empty, onDone }) {
  if (!tasks.length) return <Empty icon={CheckCircle2} title={empty.title} text={empty.text} />;
  return (
    <div className="list">
      {tasks.map((t) => {
        const d = dueInfo(t);
        return (
          <div className="row" key={t._id}>
            <button className="tick" onClick={() => onDone(t)} aria-label={`Mark "${t.title}" as completed`}><Check size={15} /></button>
            <div className="row-main">
              <div className="row-title">{t.title}</div>
              <div className="row-meta"><span className={`tone-${d.tone}`}>{d.label}</span><span>{t.category}</span></div>
            </div>
            <PriorityBadge priority={t.priority} />
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useUI();
  const [range, setRange] = useState('30d');
  const [modal, setModal] = useState(false);

  const { data, loading, error, reload } = useAsync(async () => {
    const p = { range };
    const [overview, trends, deadlines] = await Promise.all([
      api.analytics.overview(p), api.analytics.trends({ ...p, unit: range === '90d' ? 'week' : 'day' }), api.analytics.deadlines(p),
    ]);
    return { ov: overview.data, tr: trends.data, dl: deadlines.data };
  }, [range]);

  async function complete(t) {
    try { await api.tasks.update(t._id, { status: 'Completed' }); toast('Task completed'); reload(); }
    catch (e) { toast(e.message, 'error'); }
  }

  if (error) return <ErrorState error={error} onRetry={reload} />;
  const first = user.name.split(' ')[0];
  const ov = data?.ov;
  const change = ov?.productivityChange;
  const label = RANGES.find((r) => r.value === range).label;

  return (
    <div className="stack">
      <div className="toolbar" style={{ justifyContent: 'space-between', marginBottom: 0 }}>
        <span className="muted">Showing the last {label}</span>
        <Segmented label="Time range" value={range} onChange={setRange} options={RANGES} />
      </div>

      {!ov ? <Skeleton h={230} /> : (
        <section className="hero">
          <div>
            <h1>{greeting()}, {first}.</h1>
            <p>{ov.total === 0
              ? 'No tasks were created in this period. Add one to get your numbers going.'
              : `You've completed ${ov.completed} of ${ov.total} tasks created in the last ${label}${ov.overdue ? `, and ${ov.overdue} ${ov.overdue === 1 ? 'is' : 'are'} overdue` : ', with nothing overdue'}.`}</p>
            <div className="hero-stats">
              <div><strong>{ov.inProgress + ov.pending}</strong><span>still open</span></div>
              <div><strong>{ov.overdue}</strong><span>overdue</span></div>
              <div><strong>{data.dl.upcoming.tasks.length}</strong><span>due in {data.dl.upcoming.days} days</span></div>
              <div><strong>{ov.onTimeRate == null ? '–' : `${ov.onTimeRate}%`}</strong><span>finished on time</span></div>
            </div>
            <div className="hero-actions">
              <button className="btn btn-light" onClick={() => setModal(true)}><Plus size={18} />New task</button>
              <Link className="btn btn-outline-light" to="/assistant"><Sparkles size={18} />Plan my day</Link>
            </div>
          </div>
          <Ring value={ov.completionRate} size={168} stroke={15} sub="completion rate" className="on-deep" />
        </section>
      )}

      <div className="kpis">
        {!ov ? [0, 1, 2, 3].map((i) => <Skeleton key={i} h={118} />) : (<>
          <Kpi icon={CheckCircle2} label="Completed" value={ov.completed} delta={change?.absolute} hint={change ? 'vs previous period' : ''} />
          <Kpi icon={Loader} tone="info" label="In progress" value={ov.inProgress} hint="Being worked on" />
          <Kpi icon={CircleDashed} tone="warn" label="Pending" value={ov.pending} hint="Not started" />
          <Kpi icon={AlertTriangle} tone="danger" label="Overdue" value={ov.overdue} hint={ov.overdue ? 'Needs attention' : 'All caught up'} />
          <Kpi icon={Timer} tone="info" label="Avg. time to finish" value={fmtHours(ov.avgCompletionHours)} hint="Created to completed" />
          <Kpi icon={Target} label="On-time rate" value={ov.onTimeRate == null ? '–' : `${ov.onTimeRate}%`} hint="Done by the due date" />
        </>)}
      </div>

      {data && (
        <>
          <div className="grid-2">
            <Card title="Tasks completed" subtitle={`By ${data.tr.unit}, last ${label}`}>
              <TrendChart points={data.tr.points} unit={data.tr.unit} />
            </Card>
            <Card title="Status split" subtitle="Tasks created in this period">
              <StatusDonut completed={ov.completed} inProgress={ov.inProgress} pending={ov.pending} />
            </Card>
          </div>
          <div className="grid-eq">
            <Card title="Due soon" subtitle={`Next ${data.dl.upcoming.days} days`} action={<CalendarClock size={20} className="muted" />}>
              <DeadlineList tasks={data.dl.upcoming.tasks} onDone={complete} empty={{ title: 'Nothing due soon', text: 'Tasks with upcoming due dates will appear here.' }} />
            </Card>
            <Card title="Overdue" subtitle="Open tasks past their due date" action={<AlertTriangle size={20} className="muted" />}>
              <DeadlineList tasks={data.dl.overdueNow} onDone={complete} empty={{ title: 'Nothing overdue', text: 'Nice. Keep it that way.' }} />
            </Card>
          </div>
        </>
      )}
      {loading && data && <div className="note" aria-live="polite">Updating…</div>}
      {modal && <TaskModal onClose={() => setModal(false)} onSaved={(m) => { setModal(false); toast(m); reload(); }} />}
    </div>
  );
}
