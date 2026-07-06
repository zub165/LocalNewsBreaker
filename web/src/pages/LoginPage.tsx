import { FormEvent, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password, email.trim() || undefined);
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 440, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title">{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
        <p className="page-sub">
          {mode === 'login'
            ? 'Sign in to manage your submissions and preferences.'
            : 'Join the community and start reporting local news.'}
        </p>
      </div>

      <div className="chip-row" style={{ justifyContent: 'center' }}>
        <button type="button" className={`chip ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>
          Sign in
        </button>
        <button type="button" className={`chip ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>
          Register
        </button>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <form className="form-card form-grid" onSubmit={(e) => void onSubmit(e)}>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" placeholder="Your username" />
        </label>
        {mode === 'register' ? (
          <label>
            Email (optional)
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" placeholder="you@example.com" />
          </label>
        ) : null}
        <label>
          Password
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder={mode === 'login' ? 'Enter your password' : 'At least 6 characters'}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
          {loading ? 'Please wait\u2026' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
        <NavLink to="/">Continue without signing in</NavLink>
      </p>
    </div>
  );
}
