import { useState } from 'react';
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
  const { user, logout, deleteAccount } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [accountMsg, setAccountMsg] = useState<string | null>(null);

  async function onDeleteAccount() {
    if (!window.confirm('Delete your account permanently? This cannot be undone.')) return;
    setDeleting(true);
    setAccountMsg(null);
    try {
      await deleteAccount();
      setAccountMsg('Account deleted.');
      setAccountOpen(false);
    } catch (e) {
      setAccountMsg(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

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
                <button type="button" className="btn btn-ghost btn-sm username" onClick={() => setAccountOpen((v) => !v)}>
                  {user.username}
                </button>
                {accountOpen ? (
                  <div className="account-panel">
                    <p className="hint">Signed in as <strong>{user.username}</strong></p>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => void logout()}>
                      Log out
                    </button>
                    <button type="button" className="btn btn-outline btn-sm" disabled={deleting} onClick={() => void onDeleteAccount()}>
                      {deleting ? 'Deleting…' : 'Delete account'}
                    </button>
                    <a className="btn btn-ghost btn-sm" href="/LocalNewsBreaker/delete-account.html" target="_blank" rel="noreferrer">
                      Delete policy
                    </a>
                  </div>
                ) : null}
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
        {accountMsg ? <div className="alert alert-info">{accountMsg}</div> : null}
        <Outlet />
      </main>

      <footer className="site-footer">
        <a href="/LocalNewsBreaker/">Marketing site</a>
        <a href="/LocalNewsBreaker/privacy.html">Privacy</a>
        <a href="/LocalNewsBreaker/contact.html">Contact</a>
        <a href="/LocalNewsBreaker/support.html">Support</a>
      </footer>
    </div>
  );
}
