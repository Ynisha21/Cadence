import { useState } from 'react';
import { Info, Sparkles } from 'lucide-react';
import { api } from '../api.js';
import { dueInfo } from '../utils.js';
import { Badge, Card, Empty, PriorityBadge, Segmented, Skeleton } from '../components/ui.jsx';

const MODES = [{ value: 'prioritize', label: 'Prioritize' }, { value: 'plan', label: 'Daily plan' }, { value: 'summary', label: 'Summary' }];
const COPY = {
  prioritize: 'Rank your open tasks by urgency and see why each one is where it is.',
  plan: 'Get a suggested order for today, based on your deadlines and priorities.',
  summary: 'Get a short read on how your recent period went, plus ideas to improve.',
};

function Ranked({ items }) {
  if (!items.length) return <Empty icon={Sparkles} title="No open tasks" text="Add a task and come back for a ranking." />;
  const max = Math.max(...items.map((i) => i.score), 1);
  return (
    <div className="ranked">
      {items.map((t, i) => {
        const d = dueInfo(t);
        return (
          <div className="rank" key={t.id}>
            <span className="rank-n" aria-label={`Rank ${i + 1}`}>{i + 1}</span>
            <div style={{ minWidth: 0 }}>
              <div className="row-title">{t.title}</div>
              <div className="row-meta"><PriorityBadge priority={t.priority} /><span>{t.category}</span><span className={`tone-${d.tone}`}>{d.label}</span></div>
              {t.reasons.length > 0 && <div className="reasons">{t.reasons.map((r) => <Badge key={r}>{r}</Badge>)}</div>}
            </div>
            <div className="score"><strong>{t.score}</strong><small>urgency score</small><div className="bar" style={{ marginTop: 6 }}><i style={{ width: `${(t.score / max) * 100}%` }} /></div></div>
          </div>
        );
      })}
    </div>
  );
}

export default function Assistant() {
  const [mode, setMode] = useState('prioritize');
  const [hours, setHours] = useState('');
  const [max, setMax] = useState(5);
  const [range, setRange] = useState('7d');
  const [results, setResults] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    setBusy(true); setError('');
    try {
      const res = mode === 'prioritize' ? await api.ai.prioritize({ maxTasks: 10 })
        : mode === 'plan' ? await api.ai.plan({ maxTasks: Number(max), ...(hours && { availableHours: Number(hours) }) })
        : await api.ai.summary({ range });
      setResults((r) => ({ ...r, [mode]: res }));
    } catch (e) { setError(e.message); }
    setBusy(false);
  }

  const res = results[mode];
  const items = res?.ranked || res?.plan;
  const m = res?.metrics;

  return (
    <div className="stack">
      <div className="page-head" style={{ marginBottom: 0 }}><div><h1>AI assistant</h1><p>Suggestions to help you decide what to do next.</p></div></div>

      <Card>
        <div className="toolbar" style={{ marginBottom: 6 }}>
          <Segmented label="Assistant mode" value={mode} onChange={(v) => { setMode(v); setError(''); }} options={MODES} />
        </div>
        <p className="muted" style={{ marginBottom: 14 }}>{COPY[mode]}</p>
        <div className="toolbar" style={{ marginBottom: 0 }}>
          {mode === 'plan' && (<>
            <label className="field"><span>Hours available (optional)</span><input className="input input-sm" type="number" min="0.5" max="16" step="0.5" style={{ width: 160 }} value={hours} onChange={(e) => setHours(e.target.value)} placeholder="e.g. 4" /></label>
            <label className="field"><span>Tasks to include</span><input className="input input-sm" type="number" min="1" max="15" style={{ width: 120 }} value={max} onChange={(e) => setMax(e.target.value)} /></label>
          </>)}
          {mode === 'summary' && <Segmented label="Period" value={range} onChange={setRange} options={[{ value: '7d', label: 'Last 7 days' }, { value: '30d', label: 'Last 30 days' }]} />}
          <button className="btn" onClick={run} disabled={busy} style={{ alignSelf: 'flex-end' }}><Sparkles size={18} />{busy ? 'Thinking…' : res ? 'Refresh' : 'Generate'}</button>
        </div>
      </Card>

      {error && <div className="form-error" role="alert">{error}</div>}
      {busy && <Skeleton h={220} />}
      {res && !busy && (
        <Card title={mode === 'prioritize' ? 'Suggested priorities' : mode === 'plan' ? 'Suggested plan for today' : 'Your summary'}
          action={<Badge tone={res.aiGenerated ? 'success' : 'info'}>{res.aiGenerated ? 'AI generated' : 'Rule-based'}</Badge>}>
          <div className="stack">
            {res.explanation && <div className="ai-text">{res.explanation}</div>}
            {res.aiNote && !res.aiGenerated && <p className="note">AI note: {res.aiNote}. Showing the rule-based result instead.</p>}
            {m && (
              <div className="metric-grid">
                <div className="metric"><strong>{m.completed}/{m.total}</strong><span>completed</span></div>
                <div className="metric"><strong>{m.overdue}</strong><span>overdue</span></div>
                <div className="metric"><strong>{m.onTimeRatePct == null ? '–' : `${m.onTimeRatePct}%`}</strong><span>on time</span></div>
                <div className="metric"><strong>{m.dueSoon}</strong><span>due soon</span></div>
              </div>
            )}
            {items && <Ranked items={items} />}
            <p className="note" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Info size={14} />{res.disclaimer}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
