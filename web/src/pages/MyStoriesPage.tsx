import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { api } from '../api/client';
import { StoryCard } from '../components/StoryCard';
import { useAuth } from '../hooks/useAuth';
import type { Story } from '../types/story';

export function MyStoriesPage() {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);

  async function loadStories() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.mySubmissions();
      setStories(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    void loadStories();
  }, [user]);

  async function withdrawStory(id: number) {
    if (!window.confirm('Withdraw this submission?')) return;
    setWithdrawingId(id);
    setError(null);
    try {
      await api.deleteOrRejectStory(id, 'rejected');
      setStories((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Withdraw failed');
    } finally {
      setWithdrawingId(null);
    }
  }

  if (!user) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">{'\uD83D\uDD12'}</div>
        <div className="empty-state-title">Sign in required</div>
        <p>Sign in to view your submissions and track their status.</p>
        <NavLink className="btn btn-primary" to="/login">
          Sign in
        </NavLink>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">My Submissions</h1>
      <p className="page-sub">Track the stories you\u2019ve reported.</p>
      {error ? <div className="alert alert-error">{error}</div> : null}
      {loading ? <p className="page-sub">Loading\u2026</p> : null}
      {!loading && !stories.length ? (
        <div className="empty-state">
          <div className="empty-state-icon">{'\uD83D\uDCFD\uFE0F'}</div>
          <div className="empty-state-title">No submissions yet</div>
          <p>Your reported stories will appear here once submitted.</p>
          <NavLink className="btn btn-primary" to="/submit">
            Report a story
          </NavLink>
        </div>
      ) : (
        <div className="story-grid">
          {stories.map((s) => (
            <div key={s.id}>
              <StoryCard story={s} />
              {s.status === 'pending' ? (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: '0.5rem' }}
                  disabled={withdrawingId === s.id}
                  onClick={() => void withdrawStory(s.id)}
                >
                  {withdrawingId === s.id ? 'Withdrawing…' : 'Withdraw submission'}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
