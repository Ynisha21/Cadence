import { useEffect, useState } from 'react';
import { AlertTriangle, TrendingDown, TrendingUp, X } from 'lucide-react';

export const Logo = ({ className = 'logo' }) => (
  <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
    <rect width="32" height="32" rx="9" fill="#5fe0c9" />
    <path d="M8 17l5 5 11-12" fill="none" stroke="#0c2b29" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function Card({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <div className="card-head">
          <div>{title && <h3>{title}</h3>}{subtitle && <p>{subtitle}</p>}</div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ icon: Icon, label, value, hint, tone = 'success', delta }) {
  return (
    <div className="card kpi">
      <div className="kpi-top"><span className={`chip chip-${tone}`}><Icon size={18} /></span>{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-hint">{delta != null && <Delta value={delta} />}{hint}</div>
    </div>
  );
}

export function Delta({ value }) {
  if (!value) return <span className="delta">0</span>;
  const up = value > 0;
  const I = up ? TrendingUp : TrendingDown;
  return <span className={`delta ${up ? 'up' : 'down'}`}><I size={14} />{up ? '+' : ''}{value}</span>;
}

const STATUS_TONE = { Completed: 'success', 'In Progress': 'info', Pending: 'warn' };
const PRIORITY_TONE = { High: 'danger', Medium: 'warn', Low: 'info' };
export const StatusBadge = ({ status }) => <span className={`badge badge-${STATUS_TONE[status]}`}>{status}</span>;
export const PriorityBadge = ({ priority }) => <span className={`badge badge-${PRIORITY_TONE[priority]}`}>{priority}</span>;
export const Badge = ({ children, tone }) => <span className={`badge plain ${tone ? `badge-${tone}` : ''}`}>{children}</span>;

export function Empty({ icon: Icon, title, text, action }) {
  return (
    <div className="empty">
      <span className="chip chip-success"><Icon size={26} /></span>
      <h4>{title}</h4>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export const Skeleton = ({ h = 120 }) => <div className="skeleton" style={{ height: h }} aria-hidden="true" />;

export function ErrorState({ error, onRetry }) {
  return (
    <div className="card">
      <Empty icon={AlertTriangle} title="We couldn't load this" text={error?.message}
        action={onRetry && <button className="btn btn-ghost" onClick={onRetry}>Try again</button>} />
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Segmented({ value, onChange, options, label }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

export function Ring({ value = 0, size = 132, stroke = 12, sub = 'complete', className = '' }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [v, setV] = useState(0);
  useEffect(() => { const t = requestAnimationFrame(() => setV(value)); return () => cancelAnimationFrame(t); }, [value]);
  return (
    <div className={`ring ${className}`} style={{ width: size, height: size, fontSize: size / 9 }} role="img" aria-label={`${Math.round(value)} percent ${sub}`}>
      <svg viewBox={`0 0 ${size} ${size}`}>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
        <circle className="ring-bar" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(v, 100) / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div className="ring-label"><strong>{Math.round(value)}%</strong><span>{sub}</span></div>
    </div>
  );
}
