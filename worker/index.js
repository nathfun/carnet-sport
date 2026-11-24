// Serveur de Carnet sport (Cloudflare Worker + KV) : comptes, synchro, médias, Strava.
// Clés KV : u:<pseudo> (compte), s:<jeton> (session), st:<pseudo> (données), m:<pseudo>:<uid> (photos/GIF),
// strava:<pseudo> + sa:<athlète> (Strava), inv:<code> (invitations). Anciennes clés (state, m:<uid>, strava)
// conservées telles quelles : c'est la copie de secours d'avant les comptes.
const ORIGINS = ['https://nathfun.github.io', 'http://localhost:8765'];
const APP_URL = 'https://nathfun.github.io/carnet-sport/';
const RUN = ['Run', 'TrailRun', 'VirtualRun'], BIKE = ['Ride', 'VirtualRide', 'GravelRide', 'MountainBikeRide', 'EBikeRide'];
const MAX_MEDIA = 24 * 1024 * 1024;

const cors = req => {
  const o = req.headers.get('Origin');
  return {
    'Access-Control-Allow-Origin': ORIGINS.includes(o) ? o : ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Ex, X-T, X-Base',
    'Access-Control-Max-Age': '86400', 'Vary': 'Origin',
  };
};
const json = (req, body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors(req), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

/* ---------- Strava ---------- */
const sha = async t => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)))].map(b => b.toString(16).padStart(2, '0')).join('');
const verifyToken = env => sha('strava-webhook:' + env.SYNC_KEY).then(h => h.slice(0, 24));
const LEG = '__legacy';
const stKey = u => u === LEG ? 'state' : 'st:' + u, mKey = (u, id) => u === LEG ? 'm:' + id : 'm:' + u + ':' + id, svKey = u => u === LEG ? 'strava' : 'strava:' + u;
async function stravaToken(env, u) {
  const t = await env.KV.get(svKey(u), 'json'); if (!t) return null;
  if (t.expires_at * 1000 > Date.now() + 60000) return t.access_token;
  const r = await fetch('https://www.strava.com/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: env.STRAVA_CLIENT_ID, client_secret: env.STRAVA_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: t.refresh_token }) });
  if (!r.ok) return null;
  const n = await r.json(); await env.KV.put(svKey(u), JSON.stringify({ ...t, access_token: n.access_token, refresh_token: n.refresh_token, expires_at: n.expires_at }));
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
async function addToState(env, u, entries, removeIds = []) {
  const cur = await env.KV.get(stKey(u), 'json') || { rev: 0, data: {} };
  const d = cur.data || {}; d.log = d.log || []; d._ldel = d._ldel || []; d._mt = d._mt || {};
  const del = new Set(d._ldel); let n = 0;
  for (const id of removeIds) { const i = d.log.findIndex(l => l.id === id); if (i >= 0) { d.log.splice(i, 1); n++; } if (!del.has(id)) d._ldel.push(id); }
  for (const e of entries) { if (!e || del.has(e.id)) continue; const i = d.log.findIndex(l => l.id === e.id); if (i >= 0) d.log[i] = { ...d.log[i], ...e }; else d.log.push(e); n++; }
  if (!n) return 0;
  d.log.sort((a, b) => a.start - b.start); d._mt.log = Date.now();
  await env.KV.put(stKey(u), JSON.stringify({ rev: cur.rev + 1, at: Date.now(), data: d }));
  return n;
}
async function fetchActivity(env, u, id) {
  const tok = await stravaToken(env, u); if (!tok) return null;
  const r = await fetch('https://www.strava.com/api/v3/activities/' + id, { headers: { Authorization: 'Bearer ' + tok } });
  return r.ok ? r.json() : null;
}
async function backfill(env, u, n = 60) {
  const tok = await stravaToken(env, u); if (!tok) return -1;
  const r = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=' + n, { headers: { Authorization: 'Bearer ' + tok } });
  if (!r.ok) return -1;
  const added = await addToState(env, u, (await r.json()).map(toEntry).filter(Boolean));
  const t = await env.KV.get(svKey(u), 'json'); if (t) await env.KV.put(svKey(u), JSON.stringify({ ...t, last: Date.now() }));
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
async function actDetail(env, u, id) {
  const ck = 'act:' + id, hit = await env.KV.get(ck, 'json'); if (hit) return hit;
  const tok = await stravaToken(env, u); if (!tok) return null;
  const H = { headers: { Authorization: 'Bearer ' + tok } };
  const [ar, sr] = await Promise.all([fetch('https://www.strava.com/api/v3/activities/' + id, H), fetch(`https://www.strava.com/api/v3/activities/${id}/streams?keys=time,distance,latlng,altitude,heartrate,velocity_smooth,moving,cadence&key_by_type=true`, H)]);
  if (!ar.ok) return null;
  const a = await ar.json(), st = sr.ok ? await sr.json() : {};
  const g = k => (st[k] && st[k].data) || [];
  const T = g('time'), D = g('distance'), LL = g('latlng'), ALT = g('altitude'), HR = g('heartrate'), V = g('velocity_smooth'), MV = g('moving'), CAD = g('cadence');
  const run = RUN.includes(a.sport_type || a.type), n = T.length;
  // découpage par km (course) ou par 5 km (vélo), calculé sur les données complètes
  let splits = [];
  if (run && Array.isArray(a.splits_metric) && a.splits_metric.length) splits = a.splits_metric.map(x => ({ km: Math.round(x.distance) / 1000, sec: x.moving_time, elev: Math.round(x.elevation_difference || 0), hr: x.average_heartrate ? Math.round(x.average_heartrate) : null }));
  else if (n && D.length === n) {
    const step = run ? 1000 : 5000; let i0 = 0, mov = 0, hs = 0, hn = 0, next = step;
    for (let i = 1; i < n; i++) {
      const dt = T[i] - T[i - 1]; if (!MV.length || MV[i]) mov += dt; if (HR[i]) { hs += HR[i] * dt; hn += dt; }
      if (D[i] >= next || i === n - 1) { splits.push({ km: Math.round((D[i] - D[i0])) / 1000, sec: mov, elev: ALT.length ? Math.round(ALT[i] - ALT[i0]) : 0, hr: hn ? Math.round(hs / hn) : null }); i0 = i; mov = 0; hs = 0; hn = 0; next += step; }
    }
    splits = splits.filter(x => x.km > 0.05);
  }
  // échantillonnage : 900 points maximum pour les graphiques et la carte
  const keep = Math.max(1, Math.ceil(n / 900)), idx = []; for (let i = 0; i < n; i += keep) idx.push(i); if (n && idx.at(-1) !== n - 1) idx.push(n - 1);
  const pick = (arr, f = x => x) => arr.length === n ? idx.map(i => f(arr[i])) : [];
  const out = {
    id: a.id, run, name: a.name, type: a.sport_type || a.type, start: Date.parse(a.start_date), dist: a.distance, moving: a.moving_time, elapsed: a.elapsed_time,
    elev: a.total_elevation_gain, hrAvg: a.average_heartrate || null, hrMax: a.max_heartrate || null, cad: a.average_cadence ? Math.round(a.average_cadence * (run ? 2 : 1)) : null,
    cal: a.calories || null, vMax: a.max_speed || null, watts: a.average_watts || null, desc: a.description || '',
    splits, efforts: (a.best_efforts || []).map(e => ({ name: e.name, sec: e.moving_time, dist: e.distance, pr: e.pr_rank || 0 })),
    s: { t: pick(T), d: pick(D, x => Math.round(x)), v: pick(V, x => Math.round(x * 100) / 100), hr: pick(HR), alt: pick(ALT, x => Math.round(x * 10) / 10), cad: pick(CAD), ll: pick(LL, p => [Math.round(p[0] * 1e5) / 1e5, Math.round(p[1] * 1e5) / 1e5]) },
  };
  await env.KV.put(ck, JSON.stringify(out), { expirationTtl: 60 * 86400 });
  return out;
}
const page = (title, msg) => new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><body style="font:17px system-ui;padding:40px 24px;text-align:center;background:#111;color:#fff"><h1 style="font-size:26px">${title}</h1><p>${msg}</p><p><a style="display:inline-block;margin-top:16px;padding:14px 22px;background:#fc4c02;color:#fff;border-radius:12px;text-decoration:none;font-weight:700" href="${APP_URL}">Retour à l'app</a></p></body>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });

const same = (a, b) => {
  if (!a || !b || a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
};

/* ---------- comptes ---------- */
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const rnd = n => hex(crypto.getRandomValues(new Uint8Array(n)));
async function hashPw(pass, salt) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: 100000 }, k, 256));
}
const UNAME = /^[a-z0-9][a-z0-9_.-]{2,19}$/;
const pub = x => ({ u: x.u, name: x.name, admin: !!x.admin, sports: x.sports || null });
const getUser = (env, u) => env.KV.get('u:' + u, 'json');
async function newSession(env, u) { const tok = rnd(32); await env.KV.put('s:' + tok, JSON.stringify({ u, t: Date.now() }), { expirationTtl: 90 * 86400 }); return tok; }
async function createUser(env, { u, name, pass, admin = false }) {
  u = String(u || '').trim().toLowerCase(); name = String(name || '').trim().slice(0, 40) || u;
  if (!UNAME.test(u)) return { error: 'Pseudo : 3 à 20 caractères (lettres, chiffres, point, tiret).' };
  if (String(pass || '').length < 6) return { error: 'Mot de passe : 6 caractères minimum.' };
  if (await getUser(env, u)) return { error: 'Ce pseudo est déjà pris.' };
  const salt = rnd(16), user = { u, name, salt, hash: await hashPw(pass, salt), admin, created: Date.now() };
  await env.KV.put('u:' + u, JSON.stringify(user));
  return { user };
}
async function whoAmI(env, req) {
  const key = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!key) return null;
  if (env.SYNC_KEY && env.SYNC_KEY.length >= 16 && same(key, env.SYNC_KEY)) { const a = await env.KV.get('meta:admin'); return a || LEG; }
  if (!/^[0-9a-f]{64}$/.test(key)) return null;
  const s = await env.KV.get('s:' + key, 'json'); return s ? s.u : null;
}
async function copyLegacy(env, u) {
  const st = await env.KV.get('state'); if (st) await env.KV.put(stKey(u), st);
  let cursor, n = 0;
  do { const r = await env.KV.list({ prefix: 'm:', cursor }); for (const k of r.keys) { const id = k.name.slice(2); if (id.includes(':')) continue; const v = await env.KV.getWithMetadata(k.name, 'arrayBuffer'); if (v.value) { await env.KV.put(mKey(u, id), v.value, { metadata: v.metadata }); n++; } } cursor = r.list_complete ? null : r.cursor; } while (cursor);
  const sv = await env.KV.get('strava', 'json'); if (sv) { await env.KV.put(svKey(u), JSON.stringify(sv)); if (sv.athlete_id) await env.KV.put('sa:' + sv.athlete_id, u); }
  return n;
}
async function listMedia(env, u) {
  const out = [], prefix = u === LEG ? 'm:' : 'm:' + u + ':'; let cursor;
  do { const r = await env.KV.list({ prefix, cursor }); for (const k of r.keys) { const id = k.name.slice(prefix.length); if (id.includes(':')) continue; out.push({ uid: id, ...(k.metadata || {}) }); } cursor = r.list_complete ? null : r.cursor; } while (cursor);
  return out;
}

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
      const ev = await req.json().catch(() => null);
      let wu = ev ? await env.KV.get('sa:' + ev.owner_id) : null;
      if (ev && !wu) { const t = await env.KV.get('strava', 'json'); if (t && String(t.athlete_id) === String(ev.owner_id) && !(await env.KV.get('meta:admin'))) wu = LEG; }
      if (ev && wu) {
        if (ev.object_type === 'activity') ctx.waitUntil((async () => {
          if (ev.aspect_type === 'delete') return addToState(env, wu, [], ['strava_' + ev.object_id]);
          const a = await fetchActivity(env, wu, ev.object_id); if (a) await addToState(env, wu, [toEntry(a)]);
        })());
        if (ev.object_type === 'athlete' && ev.updates && String(ev.updates.authorized) === 'false') ctx.waitUntil(Promise.all([env.KV.delete(svKey(wu)), env.KV.delete('sa:' + ev.owner_id)]));
      }
      return new Response('ok');
    }
    if (p === '/strava/callback') {
      const st = url.searchParams.get('state') || '', code = url.searchParams.get('code'), su = st && await env.KV.get('stravastate:' + st);
      if (!su) return page('Lien expiré', "Relance la connexion Strava depuis l'app.");
      await env.KV.delete('stravastate:' + st);
      if (!code) return page('Connexion annulée', "Strava n'a pas été connecté.");
      if (!/activity:read/.test(url.searchParams.get('scope') || '')) return page('Autorisation incomplète', "Coche bien l'accès à tes activités, puis recommence.");
      const r = await fetch('https://www.strava.com/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: env.STRAVA_CLIENT_ID, client_secret: env.STRAVA_CLIENT_SECRET, code, grant_type: 'authorization_code' }) });
      if (!r.ok) return page('Erreur Strava', r.status === 403 ? 'Strava refuse ce compte : l\'application Strava de Nathan n\'accepte pas encore d\'autres comptes (limite d\'athlètes).' : 'La connexion a échoué, réessaie dans un instant.');
      const t = await r.json();
      if (t.athlete && t.athlete.id) { const prev = await env.KV.get('sa:' + t.athlete.id); if (prev && prev !== su) return page('Compte Strava déjà utilisé', 'Ce compte Strava est déjà relié à un autre profil.'); await env.KV.put('sa:' + t.athlete.id, su); }
      await env.KV.put(svKey(su), JSON.stringify({ access_token: t.access_token, refresh_token: t.refresh_token, expires_at: t.expires_at, athlete_id: t.athlete && t.athlete.id, name: t.athlete ? (t.athlete.firstname || '') + ' ' + (t.athlete.lastname || '') : '' }));
      const hook = await ensureWebhook(env, url.origin);
      const n = await backfill(env, su);
      return page('Strava connecté ✓', `${n > 0 ? n + ' sortie(s) ajoutée(s). ' : ''}${hook ? 'Tes prochaines courses et sorties vélo arriveront toutes seules dans l\'app.' : 'Les nouvelles sorties seront récupérées à chaque ouverture de l\'app.'}`);
    }

    // ---- comptes : routes publiques ----
    const body = ['POST', 'PUT'].includes(req.method) && !p.startsWith('/media') ? await req.clone().json().catch(() => ({})) : {};
    if (p === '/auth/status' && req.method === 'GET') return json(req, { claimable: !(await env.KV.get('meta:admin')) });
    if (p === '/auth/claim' && req.method === 'POST') {
      if (await env.KV.get('meta:admin')) return json(req, { error: 'Le compte administrateur existe déjà.' }, 409);
      if (!env.SYNC_KEY || !same(String(body.key || ''), env.SYNC_KEY)) return json(req, { error: 'Clé de synchro incorrecte.' }, 403);
      const r = await createUser(env, { ...body, admin: true }); if (r.error) return json(req, r, 400);
      const n = await copyLegacy(env, r.user.u);
      await env.KV.put('meta:admin', r.user.u);
      return json(req, { token: await newSession(env, r.user.u), user: pub(r.user), media: n });
    }
    if (p === '/auth/register' && req.method === 'POST') {
      const code = String(body.invite || ''), inv = /^[a-z0-9]{6,20}$/.test(code) ? await env.KV.get('inv:' + code, 'json') : null;
      if (!inv || inv.uses <= 0) return json(req, { error: "Lien d'invitation invalide ou expiré. Demande-en un nouveau." }, 403);
      const r = await createUser(env, body); if (r.error) return json(req, r, 400);
      inv.uses--; await env.KV.put('inv:' + code, JSON.stringify(inv), { expirationTtl: Math.max(60, Math.round((inv.exp - Date.now()) / 1000)) });
      await env.KV.put('u:' + r.user.u, JSON.stringify({ ...r.user, by: inv.by }));
      return json(req, { token: await newSession(env, r.user.u), user: pub(r.user) });
    }
    if (p === '/auth/login' && req.method === 'POST') {
      const u = String(body.u || '').trim().toLowerCase(), rk = 'rl:' + u.slice(0, 30), tries = +(await env.KV.get(rk)) || 0;
      if (tries >= 8) return json(req, { error: 'Trop d\'essais. Réessaie dans 15 minutes.' }, 429);
      const user = UNAME.test(u) ? await getUser(env, u) : null;
      if (!user || !same(await hashPw(String(body.pass || ''), user.salt), user.hash)) { await env.KV.put(rk, String(tries + 1), { expirationTtl: 900 }); return json(req, { error: 'Pseudo ou mot de passe incorrect.' }, 401); }
      return json(req, { token: await newSession(env, u), user: pub(user) });
    }
    const im = p.match(/^\/invite\/([a-z0-9]{6,20})$/);
    if (im && req.method === 'GET') { const inv = await env.KV.get('inv:' + im[1], 'json'); return inv && inv.uses > 0 ? json(req, { ok: true, by: inv.byName }) : json(req, { ok: false }, 404); }

    const me = await whoAmI(env, req);
    if (!me) return json(req, { error: 'connexion requise' }, 401);
    const user = me === LEG ? { u: LEG, name: 'Nathan', admin: true } : await getUser(env, me);
    if (!user) return json(req, { error: 'compte introuvable' }, 401);

    // ---- mon compte ----
    if (p === '/me' && req.method === 'GET') return json(req, pub(user));
    if (p === '/me' && req.method === 'POST') {
      if (me === LEG) return json(req, { error: 'Crée d\'abord ton compte.' }, 400);
      if (body.name) user.name = String(body.name).trim().slice(0, 40) || user.name;
      if (Array.isArray(body.sports)) user.sports = body.sports.filter(x => ['gym', 'run', 'bike'].includes(x));
      if (body.pass) { if (!same(await hashPw(String(body.old || ''), user.salt), user.hash)) return json(req, { error: 'Ancien mot de passe incorrect.' }, 403); if (String(body.pass).length < 6) return json(req, { error: 'Mot de passe : 6 caractères minimum.' }, 400); user.salt = rnd(16); user.hash = await hashPw(String(body.pass), user.salt); }
      await env.KV.put('u:' + me, JSON.stringify(user)); return json(req, pub(user));
    }
    if (p === '/auth/logout' && req.method === 'POST') { const k = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, ''); if (/^[0-9a-f]{64}$/.test(k)) await env.KV.delete('s:' + k); return json(req, { ok: true }); }
    if (p === '/invite' && req.method === 'POST') {
      if (me === LEG) return json(req, { error: 'Crée d\'abord ton compte.' }, 400);
      const code = rnd(5).replace(/[^a-z0-9]/g, ''), exp = Date.now() + 30 * 86400e3;
      await env.KV.put('inv:' + code, JSON.stringify({ by: me, byName: user.name, uses: 20, exp }), { expirationTtl: 30 * 86400 });
      return json(req, { code, url: APP_URL + '?invite=' + code, exp });
    }
    // ---- administration (Nathan) ----
    if (p.startsWith('/admin/')) {
      if (!user.admin || me === LEG) return json(req, { error: 'réservé à l\'administrateur' }, 403);
      if (p === '/admin/users' && req.method === 'GET') { const out = []; let cursor; do { const r = await env.KV.list({ prefix: 'u:', cursor }); for (const k of r.keys) { const x = await env.KV.get(k.name, 'json'); if (x) out.push({ ...pub(x), created: x.created }); } cursor = r.list_complete ? null : r.cursor; } while (cursor); return json(req, out); }
      if (p === '/admin/users' && req.method === 'POST') { const r = await createUser(env, body); if (r.error) return json(req, r, 400); await env.KV.put('u:' + r.user.u, JSON.stringify({ ...r.user, by: me })); return json(req, pub(r.user)); }
      if (p === '/admin/reset' && req.method === 'POST') { const x = await getUser(env, String(body.u || '').toLowerCase()); if (!x) return json(req, { error: 'Pseudo inconnu.' }, 404); if (String(body.pass || '').length < 6) return json(req, { error: 'Mot de passe : 6 caractères minimum.' }, 400); x.salt = rnd(16); x.hash = await hashPw(String(body.pass), x.salt); await env.KV.put('u:' + x.u, JSON.stringify(x)); return json(req, { ok: true }); }
      return json(req, { error: 'introuvable' }, 404);
    }

    // ---- état ----
    if (p === '/state' && req.method === 'GET') {
      const s = await env.KV.get(stKey(me), 'json');
      return json(req, s || { rev: 0, data: null });
    }
    if (p === '/state' && req.method === 'PUT') {
      if (!body || typeof body.data !== 'object' || !body.data) return json(req, { error: 'données invalides' }, 400);
      const cur = await env.KV.get(stKey(me), 'json'), rev = cur ? cur.rev : 0;
      if (+body.base !== rev) return json(req, { error: 'conflit', rev }, 409);
      const next = { rev: rev + 1, at: Date.now(), data: body.data };
      await env.KV.put(stKey(me), JSON.stringify(next));
      return json(req, { rev: next.rev, at: next.at });
    }

    // ---- Strava : routes de l'app ----
    if (p === '/strava/status' && req.method === 'GET') {
      const t = await env.KV.get(svKey(me), 'json');
      return json(req, { configured: !!(env.STRAVA_CLIENT_ID && env.STRAVA_CLIENT_SECRET), connected: !!t, name: t ? t.name : '', last: t ? t.last || 0 : 0 });
    }
    if (p === '/strava/link' && req.method === 'POST') {
      if (!env.STRAVA_CLIENT_ID) return json(req, { error: 'Strava pas configuré sur le serveur' }, 400);
      const st = crypto.randomUUID(); await env.KV.put('stravastate:' + st, me, { expirationTtl: 900 });
      const q = new URLSearchParams({ client_id: env.STRAVA_CLIENT_ID, redirect_uri: url.origin + '/strava/callback', response_type: 'code', approval_prompt: 'auto', scope: 'read,activity:read_all', state: st });
      return json(req, { url: 'https://www.strava.com/oauth/authorize?' + q });
    }
    if (p === '/strava/pull' && req.method === 'POST') {
      const t = await env.KV.get(svKey(me), 'json'); if (!t) return json(req, { error: 'pas connecté' }, 400);
      if (t.last && Date.now() - t.last < 10 * 60 * 1000 && !url.searchParams.get('force')) return json(req, { added: 0, skipped: true });
      return json(req, { added: await backfill(env, me, 30) });
    }
    const am = p.match(/^\/strava\/act\/(\d{1,20})$/);
    if (am && req.method === 'GET') {
      const d = await actDetail(env, me, am[1]);
      return d ? json(req, d) : json(req, { error: 'indisponible' }, 404);
    }
    if (p === '/strava/unlink' && req.method === 'POST') {
      const tok = await stravaToken(env, me), t = await env.KV.get(svKey(me), 'json');
      if (tok) await fetch('https://www.strava.com/oauth/deauthorize', { method: 'POST', headers: { Authorization: 'Bearer ' + tok } }).catch(() => { });
      if (t && t.athlete_id) await env.KV.delete('sa:' + t.athlete_id);
      await env.KV.delete(svKey(me)); return json(req, { ok: true });
    }

    // ---- médias : les miens + les GIF partagés de l'administrateur (jamais les photos du corps) ----
    const admin = await env.KV.get('meta:admin');
    if (p === '/media' && req.method === 'GET') {
      const mine = await listMedia(env, me);
      const shared = admin && admin !== me ? (await listMedia(env, admin)).filter(x => x.ex && x.ex !== 'body').map(x => ({ ...x, shared: true })) : [];
      return json(req, [...mine, ...shared]);
    }
    const m = p.match(/^\/media\/([A-Za-z0-9_-]{6,64})$/);
    if (m) {
      const k = mKey(me, m[1]);
      if (req.method === 'GET') {
        let r = await env.KV.getWithMetadata(k, 'arrayBuffer');
        if (!r.value && admin && admin !== me) { const r2 = await env.KV.getWithMetadata(mKey(admin, m[1]), 'arrayBuffer'); if (r2.value && r2.metadata && r2.metadata.ex !== 'body') r = r2; }
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
