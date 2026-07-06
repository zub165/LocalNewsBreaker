import { FormEvent, useState } from 'react';
import { api } from '../api/client';
import { hybridStore } from '../storage/hybridStore';
import { CATEGORIES, type StoryCategory } from '../types/story';

export function SubmitPage() {
  const prefs = hybridStore.getPrefs();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<StoryCategory>(prefs.defaultCategory as StoryCategory);
  const [mediaUrl, setMediaUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.submitStory({
        title: title.trim(),
        body: body.trim(),
        category,
        location: location.trim(),
        media_urls: mediaUrl.trim() ? [mediaUrl.trim()] : [],
      });
      const truth = res.data?.truth_index;
      setSuccess(
        `Story submitted (ID ${res.data?.id}). Status: ${res.data?.status ?? 'pending'}${
          truth != null ? ` · Truth Index: ${truth <= 1 ? Math.round(truth * 100) : Math.round(truth)}%` : ''
        }.`,
      );
      setTitle('');
      setBody('');
      setLocation('');
      setMediaUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">Report News</h1>
      <p className="page-sub">Share a story from your community. It will be reviewed and assigned a Truth Index.</p>

      {error ? <div className="alert alert-error">{error}</div> : null}
      {success ? <div className="alert alert-success">{success}</div> : null}

      <form className="form-card form-grid" onSubmit={(e) => void onSubmit(e)}>
        <label>
          Headline *
          <span className="hint">A clear, concise title for your story</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={5} placeholder="e.g. Downtown power outage affects businesses" />
        </label>
        <label>
          Story details *
          <span className="hint">What happened? Include key facts and context (min. 40 characters)</span>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} required minLength={40} placeholder="Describe the event in detail\u2026" />
          <span className="hint" style={{ textAlign: 'right' }}>{body.length} characters</span>
        </label>
        <label>
          Location
          <span className="hint">Where did this happen?</span>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, neighborhood, or landmark" />
        </label>
        <label>
          Category
          <span className="hint">What type of story is this?</span>
          <select value={category} onChange={(e) => setCategory(e.target.value as StoryCategory)}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Media URL (optional)
          <span className="hint">Link to an image or video related to this story</span>
          <input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
          {loading ? 'Submitting\u2026' : 'Submit for review'}
        </button>
      </form>
    </div>
  );
}
