export type StoryCategory =
  | 'world'
  | 'politics'
  | 'business'
  | 'tech'
  | 'science'
  | 'health'
  | 'sports'
  | 'entertainment'
  | 'local';

export type StoryStatus = 'draft' | 'pending' | 'published' | 'rejected';

export interface Story {
  id: number;
  title: string;
  body: string;
  status: StoryStatus;
  category: StoryCategory;
  truth_index: number | null;
  truth_rationale?: string;
  media_urls: string[];
  location: string;
  language: string;
  source: string;
  publisher?: string;
  external_url?: string;
  created_at: string | null;
  updated_at?: string | null;
  published_at?: string | null;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
}

export interface AuthSession {
  access: string;
  user: User;
}

export const CATEGORIES: { value: StoryCategory; label: string }[] = [
  { value: 'local', label: 'Local' },
  { value: 'world', label: 'World' },
  { value: 'politics', label: 'Politics' },
  { value: 'business', label: 'Business' },
  { value: 'tech', label: 'Tech' },
  { value: 'science', label: 'Science' },
  { value: 'health', label: 'Health' },
  { value: 'sports', label: 'Sports' },
  { value: 'entertainment', label: 'Entertainment' },
];

export function storyPublisher(story: Story): string {
  if (story.publisher?.trim()) return story.publisher.trim();
  const title = story.title ?? '';
  if (title.includes(' - ')) return title.split(' - ').pop()!.trim();
  if (story.source?.startsWith('rss:')) {
    return story.source
      .replace('rss:', '')
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  if (story.source?.includes('citizen')) return 'LocalNewsBreaker Citizen Reporter';
  return story.source || 'LocalNewsBreaker';
}

export function storyDate(story: Story): string | null {
  return story.published_at || story.created_at;
}

const MAX_STORY_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function isFreshStory(story: Story): boolean {
  const raw = storyDate(story);
  if (!raw) return false;
  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return false;
  return Date.now() - dt.getTime() <= MAX_STORY_AGE_MS;
}

export function truthPercent(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) return 0;
  if (value <= 1) return Math.round(value * 100);
  return Math.round(value);
}

export function truthLabel(value: number | null | undefined): string {
  const pct = truthPercent(value);
  if (pct >= 80) return 'High confidence';
  if (pct >= 60) return 'Moderate';
  if (pct >= 40) return 'Review suggested';
  return 'Low confidence';
}
