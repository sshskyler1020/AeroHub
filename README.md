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

## 3. Turn on the Fortnite tracker — using YOUR key for everyone

A static GitHub Pages site has no server, so there's no way to hide a secret
key directly in the site's code — anyone could view-source and take it. To
make the tracker work instantly for every visitor with **no key of their own**,
this project includes a tiny **Cloudflare Worker** that holds your key and
proxies the requests. It's free and takes about 5 minutes:

1. Create a free account at [fortnite-api.com](https://fortnite-api.com) and generate a key.
2. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Create → Create Worker**.
3. Name it (e.g. `as-fn-proxy`) → **Deploy** → **Edit code**.
4. Delete the sample code, paste in the entire contents of `worker/fn-proxy.js` from this
   project, click **Deploy**.
5. Worker → **Settings → Variables and Secrets → Add**:
   - Name: `FN_API_KEY`
   - Value: your fortnite-api.com key
   - Mark it as **Secret**, then **Save and deploy**.
6. Copy your worker's URL — it looks like `https://as-fn-proxy.<you>.workers.dev`.
7. Open `js/tracker.js` in this project, find the line near the top:
   ```js
   const PROXY_URL = '';
   ```
   and paste your worker's URL in between the quotes.
8. Re-upload `js/tracker.js` to your GitHub repo.

Once `PROXY_URL` is set, the **API Key tab disappears automatically** — visitors just
search and get results, using your key behind the scenes.

If you skip this setup (leave `PROXY_URL` blank), the site falls back to visitors
pasting in their own free key under the API Key tab — still fully functional, just
an extra step for them.

**Optional lock-down:** open `worker/fn-proxy.js` and list your site's exact domain(s) in
`ALLOWED_ORIGINS` so only your website can use the worker (stops other sites from
riding on your free-tier quota).

## 4. Embed it in Google Sites

1. In Google Sites, use **Insert → Embed → By URL** and paste your GitHub Pages URL.
2. GitHub Pages doesn't send `X-Frame-Options` or a restrictive CSP by default, so the
   page itself will embed fine.
3. YouTube's embed needs no changes. Twitch is covered in step 2. TikTok isn't embedded
   directly (TikTok doesn't support full-profile embeds) — it's a styled link-out button instead.

## 5. YouTube fix

The original embed used a deprecated `listType=user_uploads` parameter, which YouTube
no longer supports — that's why it was blank. It's now fixed to embed your channel's
uploads playlist directly, resolved from your channel ID (`UCogMw580V6MTPyuse2km1cQ`,
found via your `@aeroskyler` handle). If you ever change your handle, update
`CHANNEL_ID` in `js/main.js`.

## 6. Discord widget

Discord's live-member widget needs your server's numeric ID (not the invite code) and
requires **Server Settings → Widget → Enable Server Widget** to be turned on:

1. In Discord, go to your server → **Settings → Widget** → toggle **Enable Server Widget** on.
2. That same page shows a `data-server="..."` snippet — copy the numeric ID from it.
3. Open `index.html`, find `discord.com/widget?id=SERVER_ID`, and replace `SERVER_ID`
   with that number.

Until that's filled in, the widget iframe will just show blank — the "Join the server"
button next to it always works regardless, since it uses your invite link directly.

## 7. Maps (Creator Code: AeroSkyler)

Epic doesn't offer a public API for island thumbnails/codes/descriptions, and
`fortnite.com` blocks other sites from embedding its pages in an iframe — so
the reliable version of this is a **"View Creator Page" button** that links
straight to `fortnite.com/@AeroSkyler`, already live on the site. That page is
always current since it's literally your real Epic profile.

If you also want specific islands to show as cards right on your homepage
(thumbnail, code, description), open `js/maps.js` and fill in the
`FEATURED_MAPS` array — it's empty by default with an example commented out.
Thumbnails need to be actual image files (save one from your island's page on
fortnite.com and drop it in a new `assets/maps/` folder) since Epic doesn't
provide a stable direct image link.

## File structure

```
index.html
css/style.css
js/main.js       — nav, tabs, Twitch parent fix, YouTube embed
js/tracker.js    — AS FN Tracker: stats lookup, compare, drop wheel, journal, watchlist
js/maps.js       — Featured Fortnite map cards (optional, see section 7)
worker/fn-proxy.js — Cloudflare Worker: serves the tracker with YOUR key, hidden from visitors
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
- Discord's live widget needs your numeric server ID — see section 6 above.
