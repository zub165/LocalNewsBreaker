import type { AuthSession, Story } from '../types/story';
import { isFreshStory, storyPublisher } from '../types/story';
import { hybridStore } from '../storage/hybridStore';

/** Dev uses Vite proxy (`/api`). Production uses full API host from env. */
export function apiOrigin(): string {
  if (import.meta.env.DEV) return '';
  return (import.meta.env.VITE_API_BASE_URL || 'http://208.109.215.53:8004').replace(/\/$/, '');
}

/** HTTPS GitHub Pages feed snapshot (same origin — no mixed content). */
export function publicFeedUrl(): string {
  const base = import.meta.env.BASE_URL || '/';
  if (base.includes('/app/')) {
    return `${base.replace(/app\/?$/, '')}feed.json`;
  }
  return '/LocalNewsBreaker/feed.json';
}

export function isHttpsWithHttpApi(): boolean {
  if (import.meta.env.DEV) return false;
  if (typeof window === 'undefined' || window.location.protocol !== 'https:') return false;
  const api = import.meta.env.VITE_API_BASE_URL || 'http://208.109.215.53:8004';
  return api.startsWith('http:');
}

function authHeaders(): HeadersInit {
  const token = hybridStore.getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function parseError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const data = JSON.parse(text) as Record<string, unknown>;
    const detail = data.detail ?? data.error ?? data.message;
    if (detail != null) return String(detail);
  } catch {
    /* plain text */
  }
  if (text.includes('<!DOCTYPE')) {
    return `HTTP ${res.status} — server returned HTML (check API URL)`;
  }
  return text.slice(0, 300) || `HTTP ${res.status}`;
}

async function request<T>(paths: string[], init: RequestInit = {}): Promise<T> {
  let lastRes: Response | null = null;

  for (let i = 0; i < paths.length; i += 1) {
    const path = paths[i];
    const res = await fetch(`${apiOrigin()}${path}`, {
      ...init,
      headers: { ...authHeaders(), ...(init.headers as Record<string, string> | undefined) },
    });
    if (res.status === 404 && i < paths.length - 1) continue;
    lastRes = res;
    break;
  }

  if (!lastRes) throw new Error('No API path matched');

  if (!lastRes.ok) {
    throw new Error(await parseError(lastRes));
  }

  if (lastRes.status === 204) return undefined as T;
  return (await lastRes.json()) as T;
}

function asStories(payload: unknown): Story[] {
  if (Array.isArray(payload)) return payload as Story[];
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    for (const key of ['stories', 'results', 'data', 'items']) {
      const val = obj[key];
      if (Array.isArray(val)) return val as Story[];
    }
  }
  return [];
}

function normalizeStories(items: Story[]): Story[] {
  return items
    .filter(isFreshStory)
    .map((s) => ({
      ...s,
      publisher: s.publisher || storyPublisher(s),
    }))
    .sort((a, b) => {
      const da = new Date(a.published_at || a.created_at || 0).getTime();
      const db = new Date(b.published_at || b.created_at || 0).getTime();
      return db - da;
    });
}

async function fetchPublicFeed(category?: string): Promise<Story[]> {
  const res = await fetch(publicFeedUrl());
  if (!res.ok) throw new Error(`Public feed unavailable (HTTP ${res.status})`);
  const payload = await res.json();
  let items = normalizeStories(asStories(payload));
  if (category) {
    items = items.filter((s) => s.category === category);
  }
  return items;
}

export type FeedSource = 'live' | 'public';

export const api = {
  async health(): Promise<{ status: string }> {
    if (isHttpsWithHttpApi()) {
      const res = await fetch(publicFeedUrl());
      return { status: res.ok ? 'ok (public feed)' : 'error' };
    }
    return request(['/api/v1/health/', '/api/health']);
  },

  async fetchNews(
    params: { category?: string; limit?: number; offset?: number } = {},
  ): Promise<{ stories: Story[]; source: FeedSource }> {
    const category = params.category;

    if (isHttpsWithHttpApi()) {
      const stories = await fetchPublicFeed(category);
      return { stories, source: 'public' };
    }

    try {
      const q = new URLSearchParams({ status: 'published' });
      if (category) q.set('category', category);
      if (params.limit != null) q.set('limit', String(params.limit));
      if (params.offset != null) q.set('offset', String(params.offset));
      const suffix = `?${q.toString()}`;

      const payload = await request<unknown>([`/api/v1/news/${suffix}`, `/api/news${suffix}`]);
      const stories = normalizeStories(asStories(payload));
      if (stories.length) return { stories, source: 'live' };
    } catch {
      /* fallback below */
    }

    const stories = await fetchPublicFeed(category);
    return { stories, source: 'public' };
  },

  async fetchStory(id: number): Promise<Story> {
    if (isHttpsWithHttpApi()) {
      const { stories } = await api.fetchNews({ limit: 100 });
      const hit = stories.find((s) => s.id === id);
      if (hit) return hit;
      throw new Error('Story not found in public feed');
    }
    return request<Story>([`/api/v1/stories/${id}/`, `/api/stories/${id}`]);
  },

  async searchNews(q: string, category?: string): Promise<Story[]> {
    if (isHttpsWithHttpApi()) {
      const { stories } = await api.fetchNews({ category, limit: 100 });
      const needle = q.toLowerCase();
      return stories.filter(
        (s) => s.title.toLowerCase().includes(needle) || s.body.toLowerCase().includes(needle),
      );
    }
    const params = new URLSearchParams({ q });
    if (category) params.set('category', category);
    const suffix = `?${params.toString()}`;
    const payload = await request<unknown>([`/api/v1/search/${suffix}`, `/api/search${suffix}`]);
    return normalizeStories(asStories(payload));
  },

  async submitStory(body: {
    title: string;
    body: string;
    category: string;
    location?: string;
    media_urls?: string[];
  }): Promise<{ success: boolean; data?: { id: number; truth_index: number; status: string } }> {
    if (isHttpsWithHttpApi()) {
      throw new Error(
        'Submit requires HTTPS API. Use the Android/iOS app or configure SSL on the VPS API.',
      );
    }
    return request(['/api/v1/submit/', '/api/submit'], {
      method: 'POST',
      body: JSON.stringify({ ...body, source: 'web_app' }),
    });
  },

  async login(username: string, password: string): Promise<AuthSession> {
    if (isHttpsWithHttpApi()) {
      throw new Error('Sign-in requires HTTPS API. Use the mobile app or enable SSL on the VPS.');
    }
    const data = await request<AuthSession & { access?: string }>(['/api/v1/auth/login/', '/api/auth/login/'], {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    hybridStore.setSession(data.access, data.user);
    return data;
  },

  async register(username: string, password: string, email?: string): Promise<AuthSession> {
    if (isHttpsWithHttpApi()) {
      throw new Error('Registration requires HTTPS API. Use the mobile app or enable SSL on the VPS.');
    }
    const data = await request<AuthSession & { access?: string }>(['/api/v1/auth/register/', '/api/auth/register/'], {
      method: 'POST',
      body: JSON.stringify({ username, password, email }),
    });
    hybridStore.setSession(data.access, data.user);
    return data;
  },

  async logout(): Promise<void> {
    if (isHttpsWithHttpApi()) {
      hybridStore.clearSession();
      return;
    }
    try {
      await request(['/api/v1/auth/logout/', '/api/auth/logout/'], { method: 'POST' });
    } finally {
      hybridStore.clearSession();
    }
  },

  async me(): Promise<{ id: number; username: string; email: string }> {
    return request(['/api/v1/users/me/', '/api/users/me/']);
  },

  async mySubmissions(): Promise<Story[]> {
    const payload = await request<unknown>(['/api/v1/news/my/', '/api/news/my/']);
    return asStories(payload);
  },

  async deleteOrRejectStory(id: number, status: 'rejected' | 'published' = 'rejected'): Promise<{ success: boolean }> {
    try {
      const res = await fetch(`${apiOrigin()}/api/v1/stories/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.status === 200 || res.status === 204) return { success: true };
      if (res.status !== 404 && res.status !== 405 && res.status !== 401) {
        throw new Error(await parseError(res));
      }
    } catch {
      /* fall through */
    }
    return request(['/api/v1/approve/', '/api/approve'], {
      method: 'POST',
      body: JSON.stringify({ id, status }),
    });
  },
};
