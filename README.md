# Aero Skyler — website

Static site: home hub with your channels, merch links, and **AS FN Tracker**
(a Fortnite stats tool exclusive to this site). No build step — plain HTML/CSS/JS,
so it runs directly on GitHub Pages.

## 1. Put it on GitHub Pages

1. Create a new GitHub repo (e.g. `aeroskyler-site`).
2. Upload everything in this folder (`index.html`, `css/`, `js/`, `assets/`) to the repo root.
3. Repo → **Settings → Pages** → Source: `Deploy from a branch` → Branch: `main` / `(root)` → Save.
4. Your site goes live at `https://<your-username>.github.io/aeroskyler-site/`
   (or your custom domain if you set one under Settings → Pages).

## 2. Fix the Twitch embed's `parent` param — do this before going live

Twitch's player refuses to load unless it's told which domain(s) it's allowed
to be embedded on. `js/main.js` already rebuilds this automatically using
`window.location.hostname`, and also appends `sites.google.com` as a safety
net for step 4 below. If Twitch still shows a "this content is not available"
message:

- Open `js/main.js`, find `fixTwitchParent`.
- Add your **exact** GitHub Pages hostname (and custom domain, if any) to `extraParents`.
- If embedded in Google Sites, add the exact `sites.google.com` URL's hostname too — Google Sites sometimes serves through `sites.google.com` directly and sometimes through a `googleusercontent.com` mirror, both are already included, but double-check in your browser's console for the exact blocked hostname if it still fails.

## 3. Turn on the Fortnite tracker

AS FN Tracker pulls live stats from the free [fortnite-api.com](https://fortnite-api.com)
service — it needs an API key:

1. Create a free account at fortnite-api.com and generate a key.
2. On your live site, open **AS FN Tracker → API Key tab**, paste the key, click **Save key**.
3. The key is stored only in `localStorage` in that browser — it's never written into the
   site's code or repo, so it's safe to make the repo public.

Note: because this is a static site with no server, each visitor who wants to use the
tracker needs to paste in their *own* free key the first time. If you'd rather have it
work instantly for everyone with no setup step, you'd need a small serverless proxy
(e.g. a Cloudflare Worker) that holds your key server-side and forwards requests —
let me know if you want that built out too.

## 4. Embed it in Google Sites

1. In Google Sites, use **Insert → Embed → By URL** and paste your GitHub Pages URL.
2. GitHub Pages doesn't send `X-Frame-Options` or a restrictive CSP by default, so the
   page itself will embed fine.
3. YouTube's embed needs no changes. Twitch is covered in step 2. TikTok isn't embedded
   directly (TikTok doesn't support full-profile embeds) — it's a styled link-out button instead.

## File structure

```
index.html
css/style.css
js/main.js       — nav, tabs, Twitch parent fix
js/tracker.js    — AS FN Tracker: stats lookup, compare, drop wheel, journal, watchlist
assets/logo-sm.png
assets/banner.jpg
```

## What's exclusive to this site (not in the stock Fortnite Tracker Network tool)

- **Player Compare** — two Epic usernames side by side.
- **Storm Drop Wheel** — spins a random named POI to land at.
- **Match Journal** — private per-browser notes after a session.
- **Watchlist** — save players and reload their stats in one click.
- **Creator code banner** built into the tracker itself.

## Things worth doing next (didn't want to guess and get it wrong)

- Real Twitch **live/offline badge** next to the panel title needs Twitch API OAuth —
  the embedded player already shows live/offline automatically, so this is cosmetic only.
- The merch section links out to Printify rather than embedding the storefront — Printify
  blocks iframe embedding for checkout security, so linking out is the reliable option.
- Swap in your real X/Twitter and Instagram URLs in `index.html` — I used
  `@aeroskylerfn` based on the banner image; update the `href`s in the Socials section
  if that's not right.
