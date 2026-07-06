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
