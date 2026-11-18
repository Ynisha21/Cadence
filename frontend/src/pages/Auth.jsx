import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Heatmap } from '../components/charts.jsx';
import { Logo } from '../components/ui.jsx';

const side = Array.from({ length: 56 }, (_, i) => ({ date: new Date(Date.UTC(2026, 8, 7 + i)).toISOString(), completed: (i * 5 + (i % 3)) % 5 }));

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <aside className="auth-side">
        <Link to="/" className="brand" style={{ padding: 0 }}><Logo /> Cadence</Link>
        <div>
          <h2>Know what you finished, and what slipped.</h2>
          <p>Track tasks, see your completion trends and get a plan for the day.</p>
          <div style={{ marginTop: 28, maxWidth: 420 }} className="preview-top"><div style={{ width: '100%' }} className="preview" aria-hidden="true"><Heatmap points={side} /></div></div>
        </div>
        <small style={{ color: 'var(--on-deep-muted)' }}>Your tasks stay private to your account.</small>
      </aside>
      <main className="auth-main">
        <div className="auth-form">
          <div><h1>{title}</h1><p className="muted" style={{ marginTop: 6 }}>{subtitle}</p></div>
          {children}
          <p className="muted" style={{ fontSize: '.92rem' }}>{footer}</p>
        </div>
      </main>
    </div>
  );
}

function useSubmit(action) {
  const nav = useNavigate();
  const loc = useLocation();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async (e, payload) => {
    e.preventDefault(); setBusy(true); setError('');
    try { await action(payload); nav(loc.state?.from || '/dashboard', { replace: true }); }
    catch (err) { setError(err.message); setBusy(false); }
  };
  return { run, error, busy };
}

export function Login() {
  const { login } = useAuth();
  const [f, setF] = useState({ email: '', password: '' });
  const { run, error, busy } = useSubmit(login);
  return (
    <AuthShell title="Welcome back" subtitle="Log in to see your dashboard." footer={<>New here? <Link to="/register" style={{ color: 'var(--primary-strong)', fontWeight: 700 }}>Create an account</Link></>}>
      <form className="stack" onSubmit={(e) => run(e, f)}>
        <label className="field"><span>Email</span><input className="input" type="email" autoComplete="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label className="field"><span>Password</span><input className="input" type="password" autoComplete="current-password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="btn btn-lg" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <div className="demo"><span>Using the seeded demo data?</span><button type="button" className="btn btn-ghost btn-sm" onClick={() => setF({ email: 'demo@example.com', password: 'Password123' })}>Fill demo login</button></div>
      </form>
    </AuthShell>
  );
}

export function Register() {
  const { register } = useAuth();
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const { run, error, busy } = useSubmit(register);
  return (
    <AuthShell title="Create your account" subtitle="It takes less than a minute." footer={<>Already registered? <Link to="/login" style={{ color: 'var(--primary-strong)', fontWeight: 700 }}>Log in</Link></>}>
      <form className="stack" onSubmit={(e) => run(e, f)}>
        <label className="field"><span>Name</span><input className="input" autoComplete="name" required maxLength={80} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label className="field"><span>Email</span><input className="input" type="email" autoComplete="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label className="field"><span>Password</span><input className="input" type="password" autoComplete="new-password" required minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /><small className="muted">At least 8 characters.</small></label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="btn btn-lg" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
    </AuthShell>
  );
}
