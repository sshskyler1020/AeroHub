/**
 * AS FN Tracker — Cloudflare Worker proxy
 * -----------------------------------------------------------
 * Holds your fortnite-api.com key server-side so visitors never
 * see it, and forwards stat lookups to fortnite-api.com.
 *
 * SETUP (about 5 minutes, free):
 * 1. Go to https://dash.cloudflare.com → Workers & Pages → Create → "Create Worker".
 * 2. Name it something like "as-fn-proxy", click Deploy, then "Edit code".
 * 3. Delete the sample code and paste in this entire file. Click "Deploy".
 * 4. Worker → Settings → Variables → "Add variable":
 *      Name:  FN_API_KEY
 *      Value: <your fortnite-api.com key>
 *      Click "Encrypt" so it's stored as a secret, then Save and Deploy.
 * 5. Copy your worker's URL (looks like https://as-fn-proxy.<you>.workers.dev).
 * 6. Open js/tracker.js in this project, set PROXY_URL to that address.
 * 7. Optional but recommended: Worker → Settings → Triggers → restrict which
 *    domains can call it, or add the ALLOWED_ORIGIN check below.
 * -----------------------------------------------------------
 */

const ALLOWED_ORIGINS = [
  // Add every domain that's allowed to use your key, e.g.:
  // 'https://your-username.github.io',
  // 'https://sites.google.com'
];

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const corsHeaders = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin) ? origin || '*' : 'null',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const name = url.searchParams.get('name');
    const accountType = url.searchParams.get('accountType') || 'epic';

    if (!name) {
      return new Response(JSON.stringify({ error: 'Missing "name" query param' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const apiUrl = `https://fortnite-api.com/v2/stats/br/v2?name=${encodeURIComponent(name)}&accountType=${encodeURIComponent(accountType)}&image=all`;

    const upstream = await fetch(apiUrl, {
      headers: { Authorization: env.FN_API_KEY },
    });

    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  },
};
