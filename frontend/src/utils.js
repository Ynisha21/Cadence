import { useEffect, useState } from 'react';

export const DAY = 864e5;
export const CATEGORIES = ['Development', 'Study', 'Work', 'Personal'];
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '–');
export const fmtShort = (d, unit = 'day') =>
  new Date(d).toLocaleDateString(undefined, unit === 'month' ? { month: 'short', timeZone: 'UTC' } : { month: 'short', day: 'numeric', timeZone: 'UTC' });

export function toInputDate(d) {
  if (!d) return '';
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}
export const fromInputDate = (v) => (v ? new Date(`${v}T17:00:00`).toISOString() : null);

export function dueInfo(t) {
  if (!t.dueDate) return { label: 'No due date', tone: 'muted' };
  if (t.status === 'Completed') return { label: `Due ${fmtDate(t.dueDate)}`, tone: 'muted' };
  const diff = Math.round((startOfDay(new Date(t.dueDate)) - startOfDay(new Date())) / DAY);
  if (diff < 0) return { label: `${-diff} day${diff === -1 ? '' : 's'} overdue`, tone: 'danger' };
  if (diff === 0) return { label: 'Due today', tone: 'warn' };
  if (diff === 1) return { label: 'Due tomorrow', tone: 'warn' };
  if (diff <= 7) return { label: `Due in ${diff} days`, tone: 'info' };
  return { label: `Due ${fmtDate(t.dueDate)}`, tone: 'muted' };
}

export const fmtHours = (h) => (h == null ? '–' : h >= 48 ? `${(h / 24).toFixed(1)} days` : `${h} h`);
export const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };

export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn().then((data) => live && setState({ data, loading: false, error: null }))
      .catch((error) => live && setState({ data: null, loading: false, error }));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { ...state, reload: () => setTick((t) => t + 1) };
}

export function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}
