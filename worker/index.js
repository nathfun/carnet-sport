// Serveur de synchro de Carnet sport (Cloudflare Worker + KV).
// Stocke l'état de l'app ("state") et les photos/GIF ("m:<uid>").
// Accès protégé par la clé SYNC_KEY (secret Cloudflare), jamais dans le code.
const ORIGINS = ['https://nathfun.github.io', 'http://localhost:8765'];
const APP_URL = 'https://nathfun.github.io/carnet-sport/';
const RUN = ['Run', 'TrailRun', 'VirtualRun'], BIKE = ['Ride', 'VirtualRide', 'GravelRide', 'MountainBikeRide', 'EBikeRide'];
const MAX_MEDIA = 24 * 1024 * 1024;

const cors = req => {
  const o = req.headers.get('Origin');
  return {
    'Access-Control-Allow-Origin': ORIGINS.includes(o) ? o : ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Ex, X-T, X-Base',
    'Access-Control-Max-Age': '86400', 'Vary': 'Origin',
  };
};
const json = (req, body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors(req), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

/* ---------- Strava ---------- */
const sha = async t => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)))].map(b => b.toString(16).padStart(2, '0')).join('');
const verifyToken = env => sha('strava-webhook:' + env.SYNC_KEY).then(h => h.slice(0, 24));
async function stravaToken(env) {
  const t = await env.KV.get('strava', 'json'); if (!t) return null;
  if (t.expires_at * 1000 > Date.now() + 60000) return t.access_token;
  const r = await fetch('https://www.strava.com/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: env.STRAVA_CLIENT_ID, client_secret: env.STRAVA_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: t.refresh_token }) });
  if (!r.ok) return null;
  const n = await r.json(); await env.KV.put('strava', JSON.stringify({ ...t, access_token: n.access_token, refresh_token: n.refresh_token, expires_at: n.expires_at }));
  return n.access_token;
}
function toEntry(a) {
  const kind = RUN.includes(a.sport_type || a.type) ? 'run' : BIKE.includes(a.sport_type || a.type) ? 'bike' : null;
  if (!kind || !a.distance) return null;
  const start = Date.parse(a.start_date), km = Math.round(a.distance / 10) / 100, sec = a.moving_time || a.elapsed_time;
  const e = { id: 'strava_' + a.id, kind, name: a.name || (kind === 'run' ? 'Course à pied' : 'Sortie vélo'), start, end: start + sec * 1000, km, sec, elev: Math.round(a.total_elevation_gain || 0), ex: [], vol: 0, src: 'strava' };
  if (a.average_heartrate) e.hr = Math.round(a.average_heartrate);
  if (kind === 'run') e.pace = Math.round(sec / km); else e.kmh = Math.round(km / (sec / 3600) * 10) / 10;
  return e;
}
async function addToState(env, entries, removeIds = []) {
  const cur = await env.KV.get('state', 'json') || { rev: 0, data: {} };
  const d = cur.data || {}; d.log = d.log || []; d._ldel = d._ldel || []; d._mt = d._mt || {};
  const del = new Set(d._ldel); let n = 0;
  for (const id of removeIds) { const i = d.log.findIndex(l => l.id === id); if (i >= 0) { d.log.splice(i, 1); n++; } if (!del.has(id)) d._ldel.push(id); }
  for (const e of entries) { if (!e || del.has(e.id)) continue; const i = d.log.findIndex(l => l.id === e.id); if (i >= 0) d.log[i] = { ...d.log[i], ...e }; else d.log.push(e); n++; }
  if (!n) return 0;
  d.log.sort((a, b) => a.start - b.start); d._mt.log = Date.now();
  await env.KV.put('state', JSON.stringify({ rev: cur.rev + 1, at: Date.now(), data: d }));
  return n;
}
async function fetchActivity(env, id) {
  const tok = await stravaToken(env); if (!tok) return null;
  const r = await fetch('https://www.strava.com/api/v3/activities/' + id, { headers: { Authorization: 'Bearer ' + tok } });
  return r.ok ? r.json() : null;
}
async function backfill(env, n = 60) {
  const tok = await stravaToken(env); if (!tok) return -1;
  const r = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=' + n, { headers: { Authorization: 'Bearer ' + tok } });
  if (!r.ok) return -1;
  const added = await addToState(env, (await r.json()).map(toEntry).filter(Boolean));
  const t = await env.KV.get('strava', 'json'); if (t) await env.KV.put('strava', JSON.stringify({ ...t, last: Date.now() }));
  return added;
}
async function ensureWebhook(env, origin) {
  const q = `client_id=${env.STRAVA_CLIENT_ID}&client_secret=${env.STRAVA_CLIENT_SECRET}`;
  const list = await fetch('https://www.strava.com/api/v3/push_subscriptions?' + q).then(r => r.ok ? r.json() : []).catch(() => []);
  const cb = origin + '/strava/webhook';
  if (Array.isArray(list) && list.some(s => s.callback_url === cb)) return true;
  for (const s of Array.isArray(list) ? list : []) await fetch(`https://www.strava.com/api/v3/push_subscriptions/${s.id}?${q}`, { method: 'DELETE' });
  const body = new URLSearchParams({ client_id: env.STRAVA_CLIENT_ID, client_secret: env.STRAVA_CLIENT_SECRET, callback_url: cb, verify_token: await verifyToken(env) });
  const r = await fetch('https://www.strava.com/api/v3/push_subscriptions', { method: 'POST', body });
  return r.ok;
}
const page = (title, msg) => new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><body style="font:17px system-ui;padding:40px 24px;text-align:center;background:#111;color:#fff"><h1 style="font-size:26px">${title}</h1><p>${msg}</p><p><a style="display:inline-block;margin-top:16px;padding:14px 22px;background:#fc4c02;color:#fff;border-radius:12px;text-decoration:none;font-weight:700" href="${APP_URL}">Retour à l'app</a></p></body>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });

const same = (a, b) => {
  if (!a || !b || a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
};

export default {
  async fetch(req, env, ctx) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
    const url = new URL(req.url), p = url.pathname.replace(/\/+$/, '') || '/';
    if (p === '/') return json(req, { ok: true, app: 'carnet-sport-sync', strava: !!env.STRAVA_CLIENT_ID });

    // ---- Strava : routes publiques (appelées par Strava, pas par l'app) ----
    if (p === '/strava/webhook' && req.method === 'GET') {
      if (url.searchParams.get('hub.verify_token') !== await verifyToken(env)) return new Response('refusé', { status: 403 });
      return Response.json({ 'hub.challenge': url.searchParams.get('hub.challenge') });
    }
    if (p === '/strava/webhook' && req.method === 'POST') {
      const ev = await req.json().catch(() => null), t = await env.KV.get('strava', 'json');
      if (ev && t && String(ev.owner_id) === String(t.athlete_id)) {
        if (ev.object_type === 'activity') ctx.waitUntil((async () => {
          if (ev.aspect_type === 'delete') return addToState(env, [], ['strava_' + ev.object_id]);
          const a = await fetchActivity(env, ev.object_id); if (a) await addToState(env, [toEntry(a)]);
        })());
        if (ev.object_type === 'athlete' && ev.updates && String(ev.updates.authorized) === 'false') ctx.waitUntil(env.KV.delete('strava'));
      }
      return new Response('ok');
    }
    if (p === '/strava/callback') {
      const st = url.searchParams.get('state') || '', code = url.searchParams.get('code');
      if (!st || !(await env.KV.get('stravastate:' + st))) return page('Lien expiré', "Relance la connexion Strava depuis l'app.");
      await env.KV.delete('stravastate:' + st);
      if (!code) return page('Connexion annulée', "Strava n'a pas été connecté.");
      if (!/activity:read/.test(url.searchParams.get('scope') || '')) return page('Autorisation incomplète', "Coche bien l'accès à tes activités, puis recommence.");
      const r = await fetch('https://www.strava.com/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: env.STRAVA_CLIENT_ID, client_secret: env.STRAVA_CLIENT_SECRET, code, grant_type: 'authorization_code' }) });
      if (!r.ok) return page('Erreur Strava', 'La connexion a échoué, réessaie dans un instant.');
      const t = await r.json();
      await env.KV.put('strava', JSON.stringify({ access_token: t.access_token, refresh_token: t.refresh_token, expires_at: t.expires_at, athlete_id: t.athlete && t.athlete.id, name: t.athlete ? (t.athlete.firstname || '') + ' ' + (t.athlete.lastname || '') : '' }));
      const hook = await ensureWebhook(env, url.origin);
      const n = await backfill(env);
      return page('Strava connecté ✓', `${n > 0 ? n + ' sortie(s) ajoutée(s). ' : ''}${hook ? 'Tes prochaines courses et sorties vélo arriveront toutes seules dans l\'app.' : 'Les nouvelles sorties seront récupérées à chaque ouverture de l\'app.'}`);
    }

    const key = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    if (!env.SYNC_KEY || env.SYNC_KEY.length < 16 || !same(key, env.SYNC_KEY)) return json(req, { error: 'clé invalide' }, 401);

    // ---- état ----
    if (p === '/state' && req.method === 'GET') {
      const s = await env.KV.get('state', 'json');
      return json(req, s || { rev: 0, data: null });
    }
    if (p === '/state' && req.method === 'PUT') {
      const body = await req.json().catch(() => null);
      if (!body || typeof body.data !== 'object') return json(req, { error: 'données invalides' }, 400);
      const cur = await env.KV.get('state', 'json'), rev = cur ? cur.rev : 0;
      if (+body.base !== rev) return json(req, { error: 'conflit', rev }, 409);
      const next = { rev: rev + 1, at: Date.now(), data: body.data };
      await env.KV.put('state', JSON.stringify(next));
      return json(req, { rev: next.rev, at: next.at });
    }

    // ---- Strava : routes de l'app ----
    if (p === '/strava/status' && req.method === 'GET') {
      const t = await env.KV.get('strava', 'json');
      return json(req, { configured: !!(env.STRAVA_CLIENT_ID && env.STRAVA_CLIENT_SECRET), connected: !!t, name: t ? t.name : '', last: t ? t.last || 0 : 0 });
    }
    if (p === '/strava/link' && req.method === 'POST') {
      if (!env.STRAVA_CLIENT_ID) return json(req, { error: 'Strava pas configuré sur le serveur' }, 400);
      const st = crypto.randomUUID(); await env.KV.put('stravastate:' + st, '1', { expirationTtl: 900 });
      const q = new URLSearchParams({ client_id: env.STRAVA_CLIENT_ID, redirect_uri: url.origin + '/strava/callback', response_type: 'code', approval_prompt: 'auto', scope: 'read,activity:read_all', state: st });
      return json(req, { url: 'https://www.strava.com/oauth/authorize?' + q });
    }
    if (p === '/strava/pull' && req.method === 'POST') {
      const t = await env.KV.get('strava', 'json'); if (!t) return json(req, { error: 'pas connecté' }, 400);
      if (t.last && Date.now() - t.last < 10 * 60 * 1000 && !url.searchParams.get('force')) return json(req, { added: 0, skipped: true });
      return json(req, { added: await backfill(env, 30) });
    }
    if (p === '/strava/unlink' && req.method === 'POST') {
      const tok = await stravaToken(env);
      if (tok) await fetch('https://www.strava.com/oauth/deauthorize', { method: 'POST', headers: { Authorization: 'Bearer ' + tok } }).catch(() => { });
      await env.KV.delete('strava'); return json(req, { ok: true });
    }

    // ---- médias ----
    if (p === '/media' && req.method === 'GET') {
      const out = []; let cursor;
      do { const r = await env.KV.list({ prefix: 'm:', cursor }); for (const k of r.keys) out.push({ uid: k.name.slice(2), ...(k.metadata || {}) }); cursor = r.list_complete ? null : r.cursor; } while (cursor);
      return json(req, out);
    }
    const m = p.match(/^\/media\/([A-Za-z0-9_-]{6,64})$/);
    if (m) {
      const k = 'm:' + m[1];
      if (req.method === 'GET') {
        const r = await env.KV.getWithMetadata(k, 'arrayBuffer');
        if (!r.value) return json(req, { error: 'introuvable' }, 404);
        return new Response(r.value, { headers: { ...cors(req), 'Content-Type': (r.metadata && r.metadata.type) || 'application/octet-stream', 'Cache-Control': 'no-store' } });
      }
      if (req.method === 'PUT') {
        const buf = await req.arrayBuffer();
        if (!buf.byteLength || buf.byteLength > MAX_MEDIA) return json(req, { error: 'fichier trop lourd' }, 413);
        const meta = { ex: decodeURIComponent(req.headers.get('X-Ex') || '').slice(0, 80), type: (req.headers.get('Content-Type') || '').slice(0, 60), t: +req.headers.get('X-T') || Date.now(), size: buf.byteLength };
        await env.KV.put(k, buf, { metadata: meta });
        return json(req, { ok: true });
      }
      if (req.method === 'DELETE') { await env.KV.delete(k); return json(req, { ok: true }); }
    }
    return json(req, { error: 'introuvable' }, 404);
  },
};
