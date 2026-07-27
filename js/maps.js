/* =========================================================
   FEATURED MAPS
   -----------------------------------------------------------
   Everything here is optional — the "View Creator Page" button
   in index.html already links to your full, always-current
   library at fortnite.com/@AeroSkyler.

   Use this file only if you want to highlight specific islands
   on the homepage itself. Add one object per map:

   {
     title: 'Map name',
     code: 'XXXX-XXXX-XXXX',      // from the Creator Portal → Projects
     description: 'Short blurb, one or two sentences.',
     image: 'assets/maps/your-thumbnail.jpg'   // see note below
   }

   Thumbnails: download the image from your island's page on
   fortnite.com/@AeroSkyler/XXXX-XXXX-XXXX (right-click → Save
   Image), drop it in a new assets/maps/ folder in this project,
   and point "image" at it. Epic doesn't offer a stable direct
   image URL to link to instead, so a local copy is the reliable
   option.
========================================================= */

const FEATURED_MAPS = [
  // Example — delete or edit this, add as many as you like:
  // {
  //   title: 'Storm Runners',
  //   code: '1234-5678-9012',
  //   description: 'A fast-paced parkour deathrun through a lightning storm.',
  //   image: 'assets/maps/storm-runners.jpg'
  // },
];

(function renderMaps() {
  const grid = document.getElementById('mapsGrid');
  const empty = document.getElementById('mapsEmpty');
  if (!grid) return;

  if (!FEATURED_MAPS.length) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  grid.innerHTML = FEATURED_MAPS.map(m => `
    <a class="map-card" href="https://www.fortnite.com/@AeroSkyler/${encodeURIComponent(m.code)}" target="_blank" rel="noopener">
      <div class="map-thumb">
        <img src="${m.image}" alt="${m.title} thumbnail" loading="lazy" onerror="this.parentElement.classList.add('img-fallback'); this.remove();">
      </div>
      <div class="map-body">
        <h4>${m.title}</h4>
        <p>${m.description}</p>
        <span class="map-code">${m.code}</span>
      </div>
    </a>
  `).join('');
})();
