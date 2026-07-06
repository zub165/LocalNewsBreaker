import { truthLabel, truthPercent, storyPublisher, storyDate, type Story } from '../types/story';

interface Props {
  story: Story;
  saved?: boolean;
  onToggleSave?: (id: number, story: Story) => void;
}

export function TruthBadge({ value }: { value: number | null | undefined }) {
  const pct = truthPercent(value);
  const cls = pct >= 80 ? 'badge-truth-high' : pct >= 50 ? 'badge-truth-mid' : 'badge-truth-low';
  return (
    <span className={`badge ${cls}`} title={truthLabel(value)}>
      {pct >= 80 ? '\u2714\uFE0F' : pct >= 50 ? '\u26A0\uFE0F' : '\u26D4'} Truth {pct}%
    </span>
  );
}

export function StoryCard({ story, saved, onToggleSave }: Props) {
  const excerpt = story.body.length > 180 ? `${story.body.slice(0, 180)}\u2026` : story.body;
  const date = storyDate(story);
  const publisher = storyPublisher(story);

  return (
    <article className="story-card">
      <div className="story-meta">
        <span className="badge badge-cat">{story.category}</span>
        <TruthBadge value={story.truth_index} />
        <span title="Publisher">{'\uD83D\uDCF0'} {publisher}</span>
        {story.location ? (
          <span>
            {'\uD83D\uDCCD'} {story.location}
          </span>
        ) : null}
        {date ? (
          <span>
            {'\uD83D\uDCC5'} {new Date(date).toLocaleDateString()}
          </span>
        ) : null}
      </div>
      <h3>
        <a href={`#/story/${story.id}`}>{story.title}</a>
      </h3>
      <p>{excerpt}</p>
      <div className="card-actions">
        <a className="btn btn-outline btn-sm" href={`#/story/${story.id}`}>
          Read more
        </a>
        {onToggleSave ? (
          <button type="button" className={`btn btn-ghost btn-sm save-btn${saved ? ' saved' : ''}`} onClick={() => onToggleSave(story.id, story)}>
            {saved ? '\u2605 Saved' : '\u2606 Save'}
          </button>
        ) : null}
      </div>
    </article>
  );
}
