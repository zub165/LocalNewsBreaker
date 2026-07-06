import type { Story, User } from '../types/story';

const KEYS = {
  token: 'lnb_access_token',
  tokenLegacy: 'access_token',
  user: 'lnb_user',
  userLegacy: 'user',
  feedCache: 'lnb_feed_cache',
  feedCachedAt: 'lnb_feed_cached_at',
  savedIds: 'lnb_saved_story_ids',
  savedStories: 'lnb_saved_stories',
  prefs: 'lnb_prefs',
} as const;

export interface UserPrefs {
  defaultCategory: string;
  darkMode: boolean;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const hybridStore = {
  getToken(): string | null {
    return localStorage.getItem(KEYS.token) ?? localStorage.getItem(KEYS.tokenLegacy);
  },

  setSession(access: string, user: User): void {
    localStorage.setItem(KEYS.token, access);
    localStorage.setItem(KEYS.tokenLegacy, access);
    writeJson(KEYS.user, user);
    localStorage.setItem(KEYS.userLegacy, JSON.stringify(user));
  },

  clearSession(): void {
    localStorage.removeItem(KEYS.token);
    localStorage.removeItem(KEYS.tokenLegacy);
    localStorage.removeItem(KEYS.user);
    localStorage.removeItem(KEYS.userLegacy);
  },

  getUser(): User | null {
    return readJson<User | null>(KEYS.user, null) ?? readJson<User | null>(KEYS.userLegacy, null);
  },

  cacheFeed(stories: Story[]): void {
    writeJson(KEYS.feedCache, stories);
    localStorage.setItem(KEYS.feedCachedAt, new Date().toISOString());
  },

  getCachedFeed(): Story[] {
    return readJson<Story[]>(KEYS.feedCache, []);
  },

  getFeedCachedAt(): string | null {
    return localStorage.getItem(KEYS.feedCachedAt);
  },

  getSavedIds(): number[] {
    return readJson<number[]>(KEYS.savedIds, []);
  },

  getSavedStories(): Story[] {
    const map = readJson<Record<string, Story>>(KEYS.savedStories, {});
    return Object.values(map).sort((a, b) => {
      const da = new Date(a.published_at || a.created_at || 0).getTime();
      const db = new Date(b.published_at || b.created_at || 0).getTime();
      return db - da;
    });
  },

  toggleSaved(id: number, story?: Story): boolean {
    const ids = new Set(this.getSavedIds());
    const map = readJson<Record<string, Story>>(KEYS.savedStories, {});
    if (ids.has(id)) {
      ids.delete(id);
      delete map[String(id)];
    } else {
      ids.add(id);
      if (story) map[String(id)] = story;
    }
    writeJson(KEYS.savedIds, [...ids]);
    writeJson(KEYS.savedStories, map);
    return ids.has(id);
  },

  isSaved(id: number): boolean {
    return this.getSavedIds().includes(id);
  },

  getPrefs(): UserPrefs {
    return readJson<UserPrefs>(KEYS.prefs, { defaultCategory: 'local', darkMode: false });
  },

  setPrefs(prefs: Partial<UserPrefs>): UserPrefs {
    const next = { ...this.getPrefs(), ...prefs };
    writeJson(KEYS.prefs, next);
    return next;
  },
};
