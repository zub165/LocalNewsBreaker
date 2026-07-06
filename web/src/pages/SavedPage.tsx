import { useMemo, useState } from 'react';
import { StoryCard } from '../components/StoryCard';
import { hybridStore } from '../storage/hybridStore';
import type { Story } from '../types/story';

export function SavedPage() {
  const [tick, setTick] = useState(0);
  const stories = useMemo(() => {
    const ids = new Set(hybridStore.getSavedIds());
    const byId = new Map<number, Story>();
    for (const story of [...hybridStore.getCachedFeed(), ...hybridStore.getSavedStories()]) {
      if (ids.has(story.id)) byId.set(story.id, story);
    }
    return [...byId.values()];
  }, [tick]);

  return (
    <div>
      <h1 className="page-title">Saved Stories</h1>
      <p className="page-sub">Stories you\u2019ve bookmarked in this browser.</p>

      {!stories.length ? (
        <div className="empty-state">
          <div className="empty-state-icon">{'\uD83D\uDC96'}</div>
          <div className="empty-state-title">No saved stories yet</div>
          <p>Save stories from the feed or search results to read them later.</p>
        </div>
      ) : (
        <div className="story-grid">
          {stories.map((s) => (
            <StoryCard
              key={s.id}
              story={s}
              saved
              onToggleSave={() => {
                hybridStore.toggleSaved(s.id, s);
                setTick((n) => n + 1);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
