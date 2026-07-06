# LocalNewsBreaker Web App (React)

Browser client for the LocalNewsBreaker Django API — same data as the Flutter mobile app.

## Features

- **Feed** — published stories by category (API + local cache fallback)
- **Search** — keyword + category search
- **Report** — submit stories to the editor queue
- **Saved** — bookmark stories in `localStorage`
- **Sign in** — JWT auth; **My Stories** when logged in
- **Hybrid storage** — cache feed offline; sync from `https://citizen-api.mywaitime.com`

## Development

```bash
cd web
npm install
npm run dev
```

Open **http://localhost:5180** — Vite proxies `/api` to the backend (port **5180**, not 5173/8004).

Optional `.env`:

```bash
cp .env.example .env
# VITE_API_BASE_URL=https://citizen-api.mywaitime.com
```

## Production build

```bash
cd web
npm run build
```

Output: `website/app/` (GitHub Pages base path `/LocalNewsBreaker/app/`).

Live URL after deploy: **https://zub165.github.io/LocalNewsBreaker/app/**

## GitHub Pages deploy

Push changes under `web/` or `website/` — the **Deploy to GitHub Pages** workflow builds React and publishes the `website/` folder.

If Pages still uses the **`gh-pages`** branch, either switch to **GitHub Actions** in repo Settings → Pages, or copy `website/` to `gh-pages` after building.

## HTTPS + API note

Production API: **`https://citizen-api.mywaitime.com`**. GitHub Pages is **HTTPS** — the web app uses this host directly (no mixed-content block). For sign-in/submit from the browser, add on the API server:

`DJANGO_CORS_ALLOWED_ORIGINS=https://zub165.github.io`

Read-only feed still falls back to same-origin `feed.json` if the API is unreachable.

Local dev works via the Vite proxy (same-origin `/api`).
