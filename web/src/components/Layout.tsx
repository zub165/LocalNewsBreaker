import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  darkMode: boolean;
  onToggleDark: () => void;
}

const NAV_ITEMS: { to: string; end?: boolean; label: string }[] = [
  { to: '/', end: true, label: 'Feed' },
  { to: '/search', label: 'Search' },
  { to: '/submit', label: 'Report' },
  { to: '/saved', label: 'Saved' },
];

export function Layout({ darkMode, onToggleDark }: LayoutProps) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <a className="logo" href="#/">
            Local<span>NewsBreaker</span>
          </a>

          <nav className="main-nav" aria-label="Main">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end}>
                {item.label}
              </NavLink>
            ))}
            <NavLink to="/my-stories">My Stories</NavLink>
          </nav>

          <div className="header-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onToggleDark} title="Toggle theme">
              {darkMode ? '\u2600\uFE0F' : '\uD83C\uDF19'}
            </button>
            {user ? (
              <>
                <span className="username">{user.username}</span>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => void logout()}>
                  Log out
                </button>
              </>
            ) : (
              <NavLink className="btn btn-primary btn-sm" to="/login">
                Sign in
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        {!import.meta.env.DEV && window.location.protocol === 'https:' && (import.meta.env.VITE_API_BASE_URL || '').startsWith('http:') ? (
          <div className="alert alert-info">
            Web app is on HTTPS but the API is HTTP. Browsers may block requests until you set{' '}
            <code>VITE_API_BASE_URL</code> to an HTTPS endpoint (Nginx + SSL on your VPS).
          </div>
        ) : null}
        <Outlet />
      </main>

      <footer className="site-footer">
        <a href="/LocalNewsBreaker/">Marketing site</a>
        <a href="/LocalNewsBreaker/privacy.html">Privacy</a>
        <a href="/LocalNewsBreaker/support.html">Support</a>
      </footer>
    </div>
  );
}
