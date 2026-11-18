import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, FileDown, LayoutDashboard, ListChecks, LogOut, Moon, Sparkles, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { Logo } from './ui.jsx';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', short: 'Home', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tasks', short: 'Tasks', icon: ListChecks },
  { to: '/analytics', label: 'Analytics', short: 'Insights', icon: BarChart3 },
  { to: '/assistant', label: 'AI assistant', short: 'Assistant', icon: Sparkles },
  { to: '/reports', label: 'Reports', short: 'Reports', icon: FileDown },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useUI();
  const ThemeIcon = theme === 'dark' ? Sun : Moon;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><Logo /> Cadence</div>
        <nav className="nav" aria-label="Main">
          {NAV.map(({ to, label, icon: I }) => (
            <NavLink key={to} to={to}><I size={20} />{label}</NavLink>
          ))}
        </nav>
        <div className="side-foot">
          <div className="me">
            <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
            <div><strong>{user.name}</strong><small>{user.email}</small></div>
          </div>
          <div className="side-actions">
            <button onClick={toggleTheme}><ThemeIcon size={16} />{theme === 'dark' ? 'Light' : 'Dark'}</button>
            <button onClick={logout}><LogOut size={16} />Log out</button>
          </div>
        </div>
      </aside>

      <div>
        <header className="mobile-bar">
          <div className="brand"><Logo /> Cadence</div>
          <div>
            <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme"><ThemeIcon size={20} /></button>
            <button className="icon-btn" onClick={logout} aria-label="Log out"><LogOut size={20} /></button>
          </div>
        </header>
        <main className="main"><Outlet /></main>
      </div>

      <nav className="bottom-nav" aria-label="Main">
        {NAV.map(({ to, short, icon: I }) => (
          <NavLink key={to} to={to}><I size={22} />{short}</NavLink>
        ))}
      </nav>
    </div>
  );
}
