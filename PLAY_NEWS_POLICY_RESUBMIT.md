# Google Play — News & Magazines policy resubmission

## Why version 43 was rejected

Google flagged the app as **News & Magazines** but found:

1. **Static / unverifiable content** — sample/demo stories or empty feed when API was throttled
2. **No publisher or date** visible on articles
3. **Contact** — needs clear in-app email (social/GitHub alone is not enough)

## Fixes in v1.0.43+46

| Requirement | Fix |
|-------------|-----|
| Fresh content (< 30 days) | Release builds only show stories **≤ 30 days old** |
| Empty feed on review | API **retry**, GitHub **feed.json** fallback, World tab defaults to **All** |
| Publisher + date | On every card and story detail + **external_url** link |
| Website proof | https://zub165.github.io/LocalNewsBreaker/contact.html shows **live feed.json** |
| In-app contact | Settings → Contact us (`zub165@yahoo.com`) |

## Fixes in v1.0.42+45

| Requirement | Fix |
|-------------|-----|
| Fresh content (< 3 months) | Release builds only show stories **≤ 89 days old** with a verified date |
| No static demo feed | **Sample stories disabled** in release (`kReleaseMode`) |
| Publisher on every article | **Publisher + published date** on World cards, Search cards, and Story detail |
| Original source | Story detail shows **Publisher**, **Published**, and **View original article** link when available |
| In-app contact | **Settings → Contact us** (`zub165@yahoo.com`) + dedicated **Contact & Publisher** page |
| Website contact | https://zub165.github.io/LocalNewsBreaker/contact.html |

## Before resubmitting in Play Console

1. Upload **AAB build 46** (`mobile/build/app/outputs/bundle/release/app-release.aab`)
2. **Store listing → Contact details** — set email: `zub165@yahoo.com`
3. **App content → News apps → Entity details** — contact URL:
   `https://zub165.github.io/LocalNewsBreaker/contact.html`
4. **App content → News apps** — confirm declaration matches a **citizen news + RSS aggregator** (not static magazine)
5. **Release notes** (suggested):

   > News policy update: live feed only (no demo content), publisher and publication date on every article, in-app Contact & Publisher page, stories limited to last 90 days.

6. **Review instructions** for Google:

   > Open World tab — live stories show publisher and date. Tap any story for Source & publication. Settings → Contact us for publisher email. API: http://208.109.215.53:8004

## Optional: change category

If you prefer **not** to meet full News policy, change Play Console category from **News & Magazines** to **News & Weather** or remove the News app declaration — only if the app is repositioned as a **citizen reporting tool** rather than a news reader.

## Verify on device before upload

- World feed shows **green live banner** and dated stories with publishers
- Story detail shows **Source & publication** card
- Settings → **Contact us** opens email `zub165@yahoo.com`
- No “Showing sample stories” banner in release build
