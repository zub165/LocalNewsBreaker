import type { AuthSession, Story } from '../types/story';
import { hybridStore } from '../storage/hybridStore';

/** Dev uses Vite proxy (`/api`). Production uses full API host from env. */
export function apiOrigin(): string {
  if (import.meta.env.DEV) return '';
  return (import.meta.env.VITE_API_BASE_URL || 'http://208.109.215.53:8004').replace(/\/$/, '');
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

async function request<T>(
  paths: string[],
  init: RequestInit = {},
): Promise<T> {
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

export const api = {
  async health(): Promise<{ status: string }> {
    return request(['/api/v1/health/', '/api/health']);
  },

  async fetchNews(params: { category?: string; limit?: number; offset?: number } = {}): Promise<Story[]> {
    const q = new URLSearchParams({ status: 'published' });
    if (params.category) q.set('category', params.category);
    if (params.limit != null) q.set('limit', String(params.limit));
    if (params.offset != null) q.set('offset', String(params.offset));
    const suffix = `?${q.toString()}`;

    const payload = await request<unknown>([
      `/api/v1/news/${suffix}`,
      `/api/news${suffix}`,
    ]);
    return asStories(payload);
  },

  async fetchStory(id: number): Promise<Story> {
    return request<Story>([`/api/v1/stories/${id}/`, `/api/stories/${id}`]);
  },

  async searchNews(q: string, category?: string): Promise<Story[]> {
    const params = new URLSearchParams({ q });
    if (category) params.set('category', category);
    const suffix = `?${params.toString()}`;
    const payload = await request<unknown>([
      `/api/v1/search/${suffix}`,
      `/api/search${suffix}`,
    ]);
    return asStories(payload);
  },

  async submitStory(body: {
    title: string;
    body: string;
    category: string;
    location?: string;
    media_urls?: string[];
  }): Promise<{ success: boolean; data?: { id: number; truth_index: number; status: string } }> {
    return request(['/api/v1/submit/', '/api/submit'], {
      method: 'POST',
      body: JSON.stringify({ ...body, source: 'web_app' }),
    });
  },

  async login(username: string, password: string): Promise<AuthSession> {
    const data = await request<AuthSession & { access?: string }>(['/api/v1/auth/login/', '/api/auth/login/'], {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    hybridStore.setSession(data.access, data.user);
    return data;
  },

  async register(username: string, password: string, email?: string): Promise<AuthSession> {
    const data = await request<AuthSession & { access?: string }>(['/api/v1/auth/register/', '/api/auth/register/'], {
      method: 'POST',
      body: JSON.stringify({ username, password, email }),
    });
    hybridStore.setSession(data.access, data.user);
    return data;
  },

  async logout(): Promise<void> {
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
