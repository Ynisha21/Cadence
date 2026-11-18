import { Link } from 'react-router-dom';
import { BarChart3, CalendarClock, Check, FileDown, ShieldCheck, Sparkles, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Heatmap } from '../components/charts.jsx';
import { Logo, Ring } from '../components/ui.jsx';

// Deterministic sample data for the preview card.
const sample = Array.from({ length: 84 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 6, 6 + i));
  return { date: d.toISOString(), completed: [0, 2, 1, 3, 0, 4, 1, 2, 0, 3, 1, 0, 2, 4][(i * 7 + (i % 5)) % 14] };
});

const FEATURES = [
  { icon: Target, title: 'Clear numbers, not vibes', text: 'Completion rate, on-time rate and overdue work, each with a written definition so the figures never contradict each other.' },
  { icon: BarChart3, title: 'Trends you can act on', text: 'See which weeks you shipped the most, which categories eat your time and whether high-priority work really gets done.' },
  { icon: CalendarClock, title: 'Deadlines in view', text: 'Overdue and upcoming tasks sit next to your charts, with one tap to mark them done.' },
  { icon: Sparkles, title: 'A plan for today', text: 'The assistant ranks tasks by urgency with plain rules, then explains the order and suggests a realistic day.' },
  { icon: FileDown, title: 'Your data, exportable', text: 'Filter your tasks and download a CSV for spreadsheets or BI tools.' },
  { icon: ShieldCheck, title: 'Private by design', text: 'Every request is checked against your account. The assistant never edits tasks without you.' },
];

export default function Landing() {
  const { user } = useAuth();
  const cta = user ? { to: '/dashboard', label: 'Open dashboard' } : { to: '/register', label: 'Create free account' };
  return (
    <div className="l-wrap">
      <header className="l-nav">
        <div className="brand"><Logo /> Cadence</div>
        <nav>
          {user ? <Link className="btn btn-sm" to="/dashboard">Dashboard</Link> : (<><Link className="btn btn-ghost btn-sm" to="/login">Log in</Link><Link className="btn btn-sm" to="/register">Get started</Link></>)}
        </nav>
      </header>

      <section className="l-hero">
        <div>
          <h1>See how you actually get things done.</h1>
          <p className="lead">Cadence is a task manager that turns your to-do list into clear metrics, charts and a daily plan, so you can spot what slows you down and fix it.</p>
          <div className="l-cta">
            <Link className="btn btn-lg" to={cta.to}>{cta.label}</Link>
            {!user && <Link className="btn btn-ghost btn-lg" to="/login">Log in</Link>}
          </div>
        </div>
        <div className="preview" aria-hidden="true">
          <div className="preview-top on-deep">
            <Ring value={72} size={112} stroke={11} sub="completed" className="on-deep" />
            <div><strong style={{ fontFamily: 'var(--display)', fontSize: '1.25rem' }}>This month</strong><p style={{ color: 'var(--on-deep-muted)', fontSize: '.9rem' }}>18 of 25 tasks done, 2 overdue</p></div>
          </div>
          <Heatmap points={sample} />
          <div className="mini-list">
            <div className="mini"><span className="tick done"><Check size={13} /></span>Send project proposal<em>Done</em></div>
            <div className="mini"><span className="tick" />Revise chapter 4 notes<em>Due tomorrow</em></div>
            <div className="mini"><span className="tick" />Fix login bug<em>Due in 3 days</em></div>
          </div>
        </div>
      </section>

      <h2 className="section-title">Everything you need to understand your workload</h2>
      <section className="features">
        {FEATURES.map(({ icon: I, title, text }) => (
          <div className="card feature" key={title}><span className="chip chip-success"><I size={18} /></span><h3>{title}</h3><p>{text}</p></div>
        ))}
      </section>

      <h2 className="section-title">Up and running in three steps</h2>
      <section className="steps">
        <div className="card step"><b>1</b><h3>Add your tasks</h3><p className="muted">Give each one a priority, category and due date.</p></div>
        <div className="card step"><b>2</b><h3>Check your dashboard</h3><p className="muted">Watch completion, overdue work and trends update as you go.</p></div>
        <div className="card step"><b>3</b><h3>Ask for a plan</h3><p className="muted">Get a ranked list and a suggested order for the day.</p></div>
      </section>

      <footer className="l-foot"><span>Cadence</span><span>Built with React, Node.js, Express and MongoDB</span></footer>
    </div>
  );
}
