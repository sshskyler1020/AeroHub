// ============ NAV TOGGLE ============
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle) {
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }));
}

// ============ FOOTER YEAR ============
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ============ TRACKER TABS ============
const tabs = document.querySelectorAll('.tracker-tab');
const panels = document.querySelectorAll('.tracker-panel');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector(`.tracker-panel[data-panel="${tab.dataset.tab}"]`).classList.add('active');
  });
});

// ============ YOUTUBE EMBED ============
// YouTube's old ?listType=user_uploads&list=<handle> embed format was
// deprecated. The reliable way is to embed the channel's "uploads" playlist,
// which is always "UU" + the channel ID with its "UC" prefix stripped.
(function setupYouTube() {
  const iframe = document.getElementById('youtubeEmbed');
  if (!iframe) return;
  const CHANNEL_ID = 'UCogMw580V6MTPyuse2km1cQ'; // AeroSkyler
  const uploadsPlaylist = 'UU' + CHANNEL_ID.slice(2);
  const host = window.location.hostname || 'localhost';
  iframe.src = `https://www.youtube.com/embed/videoseries?list=${uploadsPlaylist}&origin=https://${host}`;
})();

// ============ TWITCH EMBED PARENT FIX ============
// Twitch requires the "parent" query param to match every hostname the
// player is actually served from, including a Google Sites wrapper.
// This rebuilds the src using the real hostname the page is running on,
// then appends common Google Sites hostnames as a safety net.
// If you embed this page elsewhere, add that hostname too (see README).
(function fixTwitchParent() {
  const iframe = document.getElementById('twitchEmbed');
  if (!iframe) return;
  const host = window.location.hostname || 'localhost';
  const extraParents = ['sites.google.com', 'googleusercontent.com'];
  const parents = Array.from(new Set([host, ...extraParents]))
    .filter(Boolean)
    .map(p => `parent=${encodeURIComponent(p)}`)
    .join('&');
  iframe.src = `https://player.twitch.tv/?channel=aero_skyler&${parents}&muted=true`;
})();
