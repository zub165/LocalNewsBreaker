import { FormEvent, useState } from 'react';
import { api } from '../api/client';
import { StoryCard } from '../components/StoryCard';
import { hybridStore } from '../storage/hybridStore';
import { CATEGORIES, type Story, type StoryCategory } from '../types/story';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<StoryCategory | ''>('');
  const [results, setResults] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [savedTick, setSavedTick] = useState(0);

  const toggleSave = (id: number) => {
    hybridStore.toggleSaved(id);
    setSavedTick((n) => n + 1);
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const data = await api.searchNews(query.trim(), category || undefined);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">Search &amp; Discover</h1>
      <p className="page-sub">Search published stories by keyword and category.</p>

      <form className="form-card form-grid" onSubmit={(e) => void onSubmit(e)}>
        <label>
          Keywords
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Rome, council, weather, festival" />
        </label>
        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value as StoryCategory | '')}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading || !query.trim()}>
          {loading ? 'Searching\u2026' : 'Search'}
        </button>
      </form>

      {error ? <div className="alert alert-error">{error}</div> : null}

      {searched && !loading && !results.length ? (
        <div className="empty-state">
          <div className="empty-state-icon">{'\uD83D\uDD0D'}</div>
          <div className="empty-state-title">No stories matched</div>
          <p>Try different keywords or browse all categories from the feed.</p>
        </div>
      ) : null}

      {results.length > 0 ? (
        <div className="story-grid" style={{ marginTop: '1.25rem' }} key={savedTick}>
          {results.map((s) => (
            <StoryCard
              key={s.id}
              story={s}
              saved={hybridStore.isSaved(s.id)}
              onToggleSave={toggleSave}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
