// Serveur de synchro de Carnet sport (Cloudflare Worker + KV).
// Stocke l'état de l'app ("state") et les photos/GIF ("m:<uid>").
// Accès protégé par la clé SYNC_KEY (secret Cloudflare), jamais dans le code.
const ORIGINS = ['https://nathfun.github.io', 'http://localhost:8765'];
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

const same = (a, b) => {
  if (!a || !b || a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
};

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
    const url = new URL(req.url), p = url.pathname.replace(/\/+$/, '') || '/';
    if (p === '/') return json(req, { ok: true, app: 'carnet-sport-sync' });

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
