import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { fmtShort } from '../utils.js';

export const COLORS = { done: 'var(--primary)', progress: 'var(--sky)', pending: 'var(--amber)', danger: 'var(--coral)' };
const tick = { fill: 'var(--muted)', fontSize: 12 };

function Tip({ active, payload, label, labelFormatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <strong>{labelFormatter ? labelFormatter(label) : label}</strong>
      {payload.map((p) => <div key={p.dataKey}>{p.name}: {p.value}</div>)}
    </div>
  );
}

export function TrendChart({ points, unit = 'day', height = 260 }) {
  const fmt = (d) => fmtShort(d, unit);
  return (
    <div role="img" aria-label="Completed tasks over time">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={points} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="date" tickFormatter={fmt} tick={tick} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis allowDecimals={false} tick={tick} tickLine={false} axisLine={false} />
          <Tooltip content={<Tip labelFormatter={fmt} />} />
          <Area type="monotone" dataKey="completed" name="Completed" stroke="var(--primary)" strokeWidth={2.5} fill="var(--primary)" fillOpacity={0.14} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusDonut({ completed, inProgress, pending }) {
  const data = [
    { name: 'Completed', value: completed, color: COLORS.done },
    { name: 'In progress', value: inProgress, color: COLORS.progress },
    { name: 'Pending', value: pending, color: COLORS.pending },
  ];
  const total = completed + inProgress + pending;
  return (
    <div className="donut-wrap">
      <div style={{ width: '100%', maxWidth: 220, height: 200 }} role="img" aria-label="Task status distribution">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={total ? data : [{ name: 'None', value: 1, color: 'var(--line)' }]} dataKey="value" innerRadius="64%" outerRadius="100%" paddingAngle={total ? 3 : 0} stroke="none">
              {(total ? data : [{ color: 'var(--line)' }]).map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            {total > 0 && <Tooltip content={<Tip />} />}
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="legend">{data.map((d) => <span key={d.name}><i style={{ background: d.color }} />{d.name} {d.value}</span>)}</div>
    </div>
  );
}

export function CategoryBars({ data, height }) {
  const h = height || Math.max(180, data.length * 46);
  return (
    <div role="img" aria-label="Tasks by category">
      <ResponsiveContainer width="100%" height={h}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 4, bottom: 0 }} barGap={2}>
          <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={tick} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="category" width={92} tick={tick} tickLine={false} axisLine={false} />
          <Tooltip content={<Tip />} cursor={{ fill: 'var(--surface-2)' }} />
          <Bar dataKey="total" name="Total" fill="var(--sky)" radius={[0, 6, 6, 0]} barSize={12} />
          <Bar dataKey="completed" name="Completed" fill="var(--primary)" radius={[0, 6, 6, 0]} barSize={12} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PriorityBars({ data, height = 240 }) {
  return (
    <div role="img" aria-label="Tasks by priority">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="priority" tick={tick} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={tick} tickLine={false} axisLine={false} />
          <Tooltip content={<Tip />} cursor={{ fill: 'var(--surface-2)' }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }} />
          <Bar dataKey="total" name="Total" fill="var(--sky)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="completed" name="Completed" fill="var(--primary)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** GitHub-style grid of daily completions. Expects `points` = [{date, completed}] by day. */
export function Heatmap({ points }) {
  if (!points?.length) return null;
  const map = new Map(points.map((p) => [p.date.slice(0, 10), p.completed]));
  const first = new Date(points[0].date);
  const last = new Date(points[points.length - 1].date);
  const start = new Date(first);
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  const cells = [];
  for (const d = new Date(start); d <= last; d.setUTCDate(d.getUTCDate() + 1)) {
    const k = d.toISOString().slice(0, 10);
    cells.push({ k, v: d < first ? null : map.get(k) ?? 0 });
  }
  const max = Math.max(1, ...cells.map((c) => c.v || 0));
  const level = (v) => (v == null ? 'x' : v === 0 ? 0 : Math.min(4, Math.ceil((v / max) * 4)));
  return (
    <div>
      <div className="heat-scroll">
        <div className="heatmap" role="img" aria-label="Daily completions heatmap">
          {cells.map((c) => <span key={c.k} className={`hm hm-${level(c.v)}`} title={c.v == null ? '' : `${c.k}: ${c.v} completed`} />)}
        </div>
      </div>
      <div className="hm-legend">Fewer <span className="hm" /><span className="hm hm-1" /><span className="hm hm-2" /><span className="hm hm-3" /><span className="hm hm-4" /> More</div>
    </div>
  );
}
