import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { StoryCard } from '../components/StoryCard';
import { hybridStore } from '../storage/hybridStore';
import { CATEGORIES, type Story, type StoryCategory } from '../types/story';

function SkeletonGrid() {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-line skeleton-line-sm" />
          <div className="skeleton-line" />
          <div className="skeleton-line" />
          <div className="skeleton-line" />
        </div>
      ))}
    </div>
  );
}

export function FeedPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [category, setCategory] = useState<StoryCategory | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [fromPublicFeed, setFromPublicFeed] = useState(false);
  const [savedTick, setSavedTick] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { stories: data, source } = await api.fetchNews({
        category: category === 'all' ? undefined : category,
        limit: 50,
      });
      setStories(data);
      hybridStore.cacheFeed(data);
      setFromCache(false);
      setFromPublicFeed(source === 'public');
    } catch (e) {
      const cached = hybridStore.getCachedFeed();
      if (cached.length) {
        setStories(cached);
        setFromCache(true);
        setError(`Live feed unavailable — showing cached stories (${hybridStore.getFeedCachedAt()?.slice(0, 10) ?? 'unknown date'}).`);
      } else {
        setError(e instanceof Error ? e.message : 'Failed to load feed');
      }
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleSave = (id: number) => {
    hybridStore.toggleSaved(id);
    setSavedTick((n) => n + 1);
  };

  return (
    <div>
      <h1 className="page-title">World Feed</h1>
      <p className="page-sub">Published community stories from the LocalNewsBreaker API.</p>

      <div className="chip-row">
        <button type="button" className={`chip ${category === 'all' ? 'active' : ''}`} onClick={() => setCategory('all')}>
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            className={`chip ${category === c.value ? 'active' : ''}`}
            onClick={() => setCategory(c.value)}
          >
            {c.label}
          </button>
        ))}
        <button type="button" className="btn btn-outline btn-sm" onClick={() => void load()} disabled={loading}>
          {loading ? 'Loading\u2026' : 'Refresh'}
        </button>
      </div>

      {error ? <div className={`alert ${fromCache || fromPublicFeed ? 'alert-info' : 'alert-error'}`}>{error}</div> : null}

      {loading && !stories.length ? (
        <SkeletonGrid />
      ) : !loading && !stories.length ? (
        <div className="empty-state">
          <div className="empty-state-icon">{'\uD83D\uDCF0'}</div>
          <div className="empty-state-title">No published stories yet</div>
          <p>Be the first to report local news.</p>
        </div>
      ) : (
        <div className="story-grid" key={savedTick}>
          {stories.map((s) => (
            <StoryCard key={s.id} story={s} saved={hybridStore.isSaved(s.id)} onToggleSave={toggleSave} />
          ))}
        </div>
      )}
    </div>
  );
}
