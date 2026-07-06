# LocalNewsBreaker Web App (React)

Browser client for the LocalNewsBreaker Django API — same data as the Flutter mobile app.

## Features

- **Feed** — published stories by category (API + local cache fallback)
- **Search** — keyword + category search
- **Report** — submit stories to the editor queue
- **Saved** — bookmark stories in `localStorage`
- **Sign in** — JWT auth; **My Stories** when logged in
- **Hybrid storage** — cache feed offline; sync from `http://208.109.215.53:8004`

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
# VITE_API_BASE_URL=http://208.109.215.53:8004
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

GitHub Pages is **HTTPS**. If `VITE_API_BASE_URL` is **HTTP**, browsers block mixed content. For production web:

1. Put Nginx + SSL in front of your VPS API, or  
2. Set `DJANGO_CORS_ALLOWED_ORIGINS=https://zub165.github.io` and use `VITE_API_BASE_URL=https://your-domain`

Local dev works via the Vite proxy (same-origin `/api`).
