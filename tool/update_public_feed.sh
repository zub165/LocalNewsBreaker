#!/usr/bin/env bash
# Refresh public feed.json for GitHub Pages + app offline fallback (Play News policy).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/website/feed.json"
API="${API_BASE:-https://citizen-api.mywaitime.com}/api/v1/news/?status=published&limit=30"

echo "Fetching fresh stories from $API"
RAW=$(curl -fsSL "$API")
python3 - <<'PY' "$RAW" "$OUT"
import json, sys
from datetime import datetime, timezone, timedelta

raw, out = sys.argv[1], sys.argv[2]
data = json.loads(raw)
items = data.get("results") or data.get("stories") or []
now = datetime.now(timezone.utc)
cutoff = now - timedelta(days=30)
fresh = []
for s in items:
    ts = s.get("published_at") or s.get("created_at")
    if not ts:
        continue
    try:
        dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except ValueError:
        continue
    if dt < cutoff:
        continue
    src = s.get("source") or ""
    publisher = s.get("author") or ""
    if not publisher and " - " in (s.get("title") or ""):
        publisher = (s.get("title") or "").split(" - ")[-1].strip()
    if not publisher and src.startswith("rss:"):
        publisher = src.replace("rss:", "").replace("-", " ").title()
    fresh.append({
        **s,
        "publisher": publisher or "LocalNewsBreaker",
    })
fresh.sort(key=lambda x: x.get("published_at") or x.get("created_at") or "", reverse=True)
payload = {
    "updated_at": now.isoformat(),
    "count": len(fresh),
    "stories": fresh,
}
with open(out, "w", encoding="utf-8") as f:
    json.dump(payload, f, indent=2)
print(f"Wrote {len(fresh)} stories to {out}")
PY
