import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { TruthBadge } from '../components/StoryCard';
import { hybridStore } from '../storage/hybridStore';
import type { Story } from '../types/story';

export function StoryPage() {
  const { id } = useParams();
  const storyId = Number(id);
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(storyId)) {
      setError('Invalid story ID');
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.fetchStory(storyId);
        if (!cancelled) {
          setStory(data);
          setSaved(hybridStore.isSaved(storyId));
        }
      } catch (e) {
        const cached = hybridStore.getCachedFeed().find((s) => s.id === storyId);
        if (!cancelled) {
          if (cached) {
            setStory(cached);
            setSaved(hybridStore.isSaved(storyId));
            setError('Showing cached copy \u2014 live story unavailable.');
          } else {
            setError(e instanceof Error ? e.message : 'Story not found');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [storyId]);

  if (loading) return <p className="page-sub">Loading story\u2026</p>;
  if (error && !story) return <div className="alert alert-error">{error}</div>;
  if (!story) return <div className="empty-state">Story not found.</div>;

  const date = story.published_at || story.created_at;

  return (
    <article className="story-detail">
      {error ? <div className="alert alert-info">{error}</div> : null}
      <div className="story-meta">
        <span className="badge badge-cat">{story.category}</span>
        <TruthBadge value={story.truth_index} />
        {story.location ? <span>{'\uD83D\uDCCD'} {story.location}</span> : null}
        {date ? <span>{'\uD83D\uDCC5'} {new Date(date).toLocaleString()}</span> : null}
        <span className={`badge ${story.status === 'published' ? 'badge-published' : story.status === 'pending' ? 'badge-pending' : 'badge-status'}`}>
          {story.status}
        </span>
      </div>
      <h1>{story.title}</h1>
      {story.truth_rationale ? (
        <div className="status-banner">
          {'\uD83E\uDD16'} <strong>Truth Index rationale:</strong> {story.truth_rationale}
        </div>
      ) : null}
      <div className="story-body">{story.body}</div>
      {story.media_urls?.length ? (
        <div style={{ marginTop: '1.25rem' }}>
          <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>Media attachments</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {story.media_urls.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start' }}>
                {'\uD83D\uDCCE'} View media
              </a>
            ))}
          </div>
        </div>
      ) : null}
      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`btn btn-outline save-btn${saved ? ' saved' : ''}`}
          onClick={() => {
            hybridStore.toggleSaved(story.id);
            setSaved(hybridStore.isSaved(story.id));
          }}
        >
          {saved ? '\u2605 Saved' : '\u2606 Save locally'}
        </button>
        <a className="btn btn-ghost" href="#/">
          {'\u2190'} Back to feed
        </a>
      </div>
    </article>
  );
}
