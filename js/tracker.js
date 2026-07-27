/* =========================================================
   AS FN TRACKER
   Talks to the free fortnite-api.com stats endpoint.
   The visitor supplies their own free API key (Settings tab);
   it is stored only in localStorage on their own device.
========================================================= */

const FN_API = 'https://fortnite-api.com/v2/stats/br/v2';

// If you set up the Cloudflare Worker proxy (see worker/fn-proxy.js), put its
// URL here — then every visitor's lookups use YOUR key automatically and
// nobody has to paste in their own. Leave blank to fall back to visitors
// entering their own free key in the API Key tab.
const PROXY_URL = ''; // e.g. 'https://as-fn-proxy.YOUR-SUBDOMAIN.workers.dev'

const KEY_STORAGE = 'as_fn_api_key';
const WATCHLIST_STORAGE = 'as_fn_watchlist';
const JOURNAL_STORAGE = 'as_fn_journal';

const DROP_SPOTS = [
  'Lazy Lake', 'Retail Row', 'Pleasant Park', 'Salty Springs',
  'Sweaty Sands', 'Craggy Cliffs', 'Holly Hedges', 'Lockie\'s Lighthouse',
  'Steamy Stacks', 'Slappy Shores', 'The Citadel', 'Frenzy Fields'
];

// ---------------- API key handling ----------------
function getKey() { return localStorage.getItem(KEY_STORAGE) || ''; }
function setKey(k) { localStorage.setItem(KEY_STORAGE, k); }
function clearKey() { localStorage.removeItem(KEY_STORAGE); }

function refreshKeyStatus() {
  const settingsTab = document.querySelector('.tracker-tab[data-tab="settings"]');
  const settingsPanel = document.querySelector('.tracker-panel[data-panel="settings"]');
  if (usingProxy()) {
    // Site-wide key is active — visitors don't need this tab at all.
    settingsTab?.style.setProperty('display', 'none');
    settingsPanel?.style.setProperty('display', 'none');
    return;
  }
  const el = document.getElementById('keyStatus');
  if (!el) return;
  if (getKey()) {
    el.textContent = 'Key saved on this device';
    el.classList.remove('missing');
    el.classList.add('ok');
  } else {
    el.textContent = 'No key saved';
    el.classList.remove('ok');
    el.classList.add('missing');
  }
}

document.getElementById('saveKeyBtn')?.addEventListener('click', () => {
  const v = document.getElementById('apiKeyInput').value.trim();
  if (v) { setKey(v); document.getElementById('apiKeyInput').value = ''; }
  refreshKeyStatus();
});
document.getElementById('clearKeyBtn')?.addEventListener('click', () => {
  clearKey();
  refreshKeyStatus();
});
refreshKeyStatus();

// ---------------- fetch stats ----------------
function usingProxy() { return Boolean(PROXY_URL); }

async function fetchPlayerStats(name, platform) {
  let url, headers = {};

  if (usingProxy()) {
    // Site-wide key: goes through your Cloudflare Worker, key never reaches the browser.
    url = `${PROXY_URL}?name=${encodeURIComponent(name)}&accountType=${encodeURIComponent(platform)}`;
  } else {
    // Fallback: visitor's own key, stored only in their browser.
    const key = getKey();
    if (!key) {
      throw new Error('Add your free fortnite-api.com key in the API Key tab first.');
    }
    url = `${FN_API}?name=${encodeURIComponent(name)}&accountType=${encodeURIComponent(platform)}&image=all`;
    headers = { Authorization: key };
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    if (res.status === 403) throw new Error(usingProxy() ? 'The site\'s API key was rejected — check the Worker\'s FN_API_KEY variable.' : 'That API key was rejected. Double-check it in the API Key tab.');
    if (res.status === 404) throw new Error(`No player named "${name}" found on that platform.`);
    throw new Error(`Lookup failed (status ${res.status}).`);
  }
  const json = await res.json();
  return json.data;
}

function statTiles(data) {
  const o = data?.stats?.all?.overall;
  if (!o) return [];
  return [
    { label: 'Wins', value: o.wins ?? 0, cls: 'good' },
    { label: 'Win Rate', value: `${(o.winRate ?? 0).toFixed?.(1) ?? o.winRate}%`, cls: 'gold' },
    { label: 'Matches', value: o.matches ?? 0 },
    { label: 'K/D', value: (o.kd ?? 0).toFixed?.(2) ?? o.kd },
    { label: 'Kills', value: o.kills ?? 0 },
    { label: 'Top 10s', value: o.top10 ?? 0 },
    { label: 'Top 25s', value: o.top25 ?? 0 },
    { label: 'Minutes Played', value: o.minutesPlayed ?? 0 },
  ];
}

function renderTiles(container, tiles) {
  container.innerHTML = tiles.map(t =>
    `<div class="stat-tile"><div class="label">${t.label}</div><div class="value ${t.cls || ''}">${t.value}</div></div>`
  ).join('');
}

async function runLookup() {
  const name = document.getElementById('epicName').value.trim();
  const platform = document.getElementById('platform').value;
  const empty = document.getElementById('statsEmpty');
  const result = document.getElementById('statsResult');
  const grid = document.getElementById('statGrid');
  if (!name) return;

  empty.style.display = 'block';
  empty.innerHTML = '<div class="radar"><div class="sweep"></div></div><p>Pulling stats…</p>';
  result.style.display = 'none';

  try {
    const data = await fetchPlayerStats(name, platform);
    const tiles = statTiles(data);
    if (!tiles.length) throw new Error('That player has no ranked Battle Royale stats yet.');
    renderTiles(grid, tiles);
    empty.style.display = 'none';
    result.style.display = 'block';
  } catch (err) {
    empty.innerHTML = `<div class="radar"><div class="sweep"></div></div><p style="color:var(--danger);">${err.message}</p>`;
    result.style.display = 'none';
  }
}
document.getElementById('lookupBtn')?.addEventListener('click', runLookup);
document.getElementById('epicName')?.addEventListener('keydown', e => { if (e.key === 'Enter') runLookup(); });

// ---------------- compare ----------------
async function runCompare() {
  const a = document.getElementById('compareA').value.trim();
  const b = document.getElementById('compareB').value.trim();
  const out = document.getElementById('compareResult');
  if (!a || !b) return;
  out.innerHTML = '<p style="color:var(--ice-dim);">Comparing…</p>';
  try {
    const [da, db] = await Promise.all([fetchPlayerStats(a, 'epic'), fetchPlayerStats(b, 'epic')]);
    const oa = da?.stats?.all?.overall, ob = db?.stats?.all?.overall;
    if (!oa || !ob) throw new Error('One of those players has no stats to compare.');
    const rows = [
      ['Wins', oa.wins, ob.wins],
      ['Win Rate %', oa.winRate?.toFixed?.(1), ob.winRate?.toFixed?.(1)],
      ['K/D', oa.kd?.toFixed?.(2), ob.kd?.toFixed?.(2)],
      ['Kills', oa.kills, ob.kills],
      ['Matches', oa.matches, ob.matches],
      ['Top 10s', oa.top10, ob.top10],
    ];
    out.innerHTML = `
      <div class="stat-grid" style="grid-template-columns:1fr 1fr 1fr;">
        <div class="stat-tile"><div class="label">Stat</div><div class="value" style="font-size:15px;">${da.account.name}</div></div>
        <div class="stat-tile"></div>
        <div class="stat-tile"><div class="label">&nbsp;</div><div class="value" style="font-size:15px;">${db.account.name}</div></div>
        ${rows.map(([label, va, vb]) => `
          <div class="stat-tile"><div class="label">${label}</div><div class="value ${Number(va) >= Number(vb) ? 'good' : ''}">${va}</div></div>
          <div class="stat-tile" style="display:flex;align-items:center;justify-content:center;color:var(--ice-dim);font-family:var(--font-mono);">vs</div>
          <div class="stat-tile"><div class="label">${label}</div><div class="value ${Number(vb) >= Number(va) ? 'good' : ''}">${vb}</div></div>
        `).join('')}
      </div>`;
  } catch (err) {
    out.innerHTML = `<p style="color:var(--danger);">${err.message}</p>`;
  }
}
document.getElementById('compareBtn')?.addEventListener('click', runCompare);

// ---------------- watchlist ----------------
function getWatchlist() { return JSON.parse(localStorage.getItem(WATCHLIST_STORAGE) || '[]'); }
function saveWatchlist(list) { localStorage.setItem(WATCHLIST_STORAGE, JSON.stringify(list)); }

function renderWatchlist() {
  const el = document.getElementById('watchlistList');
  if (!el) return;
  const list = getWatchlist();
  if (!list.length) { el.innerHTML = '<p style="color:var(--ice-dim);font-size:13px;">Nobody saved yet. Search a player and hit "+ Watchlist".</p>'; return; }
  el.innerHTML = list.map((p, i) => `
    <span class="watchlist-chip">
      <span data-load="${i}" style="cursor:pointer;">${p.name} · ${p.platform}</span>
      <button data-remove="${i}" aria-label="Remove ${p.name}">✕</button>
    </span>`).join('');
  el.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', () => {
    const idx = Number(btn.dataset.remove);
    const l = getWatchlist(); l.splice(idx, 1); saveWatchlist(l); renderWatchlist();
  }));
  el.querySelectorAll('[data-load]').forEach(span => span.addEventListener('click', () => {
    const idx = Number(span.dataset.load);
    const p = getWatchlist()[idx];
    document.getElementById('epicName').value = p.name;
    document.getElementById('platform').value = p.platform;
    document.querySelector('.tracker-tab[data-tab="stats"]').click();
    runLookup();
  }));
}
document.getElementById('addWatchBtn')?.addEventListener('click', () => {
  const name = document.getElementById('epicName').value.trim();
  const platform = document.getElementById('platform').value;
  if (!name) return;
  const list = getWatchlist();
  if (!list.some(p => p.name.toLowerCase() === name.toLowerCase() && p.platform === platform)) {
    list.push({ name, platform });
    saveWatchlist(list);
    renderWatchlist();
  }
});
renderWatchlist();

// ---------------- journal ----------------
function getJournal() { return JSON.parse(localStorage.getItem(JOURNAL_STORAGE) || '[]'); }
function saveJournal(list) { localStorage.setItem(JOURNAL_STORAGE, JSON.stringify(list)); }

function renderJournal() {
  const el = document.getElementById('journalList');
  if (!el) return;
  const list = getJournal();
  if (!list.length) { el.innerHTML = '<p style="color:var(--ice-dim);font-size:13px;">No entries yet.</p>'; return; }
  el.innerHTML = list.slice().reverse().map((entry) => {
    const realIdx = list.indexOf(entry);
    return `<div class="journal-entry">
      <time>${new Date(entry.ts).toLocaleString()}</time>
      ${entry.text}
      <button class="del" data-del="${realIdx}" aria-label="Delete entry">✕</button>
    </div>`;
  }).join('');
  el.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', () => {
    const idx = Number(btn.dataset.del);
    const l = getJournal(); l.splice(idx, 1); saveJournal(l); renderJournal();
  }));
}
document.getElementById('journalAddBtn')?.addEventListener('click', () => {
  const ta = document.getElementById('journalInput');
  const text = ta.value.trim();
  if (!text) return;
  const list = getJournal();
  list.push({ text, ts: Date.now() });
  saveJournal(list);
  ta.value = '';
  renderJournal();
});
renderJournal();

// ---------------- drop wheel ----------------
(function setupWheel() {
  const canvas = document.getElementById('dropWheel');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2, cy = canvas.height / 2, r = cx - 4;
  const segAngle = (Math.PI * 2) / DROP_SPOTS.length;
  const colors = ['#3aa0ff', '#8a6bff'];
  let rotation = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    DROP_SPOTS.forEach((_, i) => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, i * segAngle, (i + 1) * segAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i % 2];
      ctx.globalAlpha = 0.85;
      ctx.fill();
    });
    ctx.restore();
    // pointer
    ctx.fillStyle = '#ffcf5c';
    ctx.beginPath();
    ctx.moveTo(cx - 8, 2);
    ctx.lineTo(cx + 8, 2);
    ctx.lineTo(cx, 18);
    ctx.closePath();
    ctx.fill();
  }
  draw();

  document.getElementById('spinBtn')?.addEventListener('click', () => {
    const resultEl = document.getElementById('wheelResult');
    const spins = 4 + Math.random() * 2;
    const target = rotation + spins * Math.PI * 2;
    const duration = 1800;
    const start = performance.now();
    const startRot = rotation;

    function frame(t) {
      const elapsed = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      rotation = startRot + (target - startRot) * eased;
      draw();
      if (elapsed < 1) {
        requestAnimationFrame(frame);
      } else {
        const normalized = ((rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        // pointer is at top (angle -90deg / 270deg from 0)
        const pointerAngle = (Math.PI * 2 - normalized + (3 * Math.PI / 2)) % (Math.PI * 2);
        const idx = Math.floor(pointerAngle / segAngle) % DROP_SPOTS.length;
        resultEl.textContent = `Landing at: ${DROP_SPOTS[idx]}`;
      }
    }
    requestAnimationFrame(frame);
  });
})();
