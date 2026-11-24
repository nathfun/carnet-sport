/* Synchro iPhone ↔ ordi via le serveur Cloudflare.
   Hors ligne d'abord : tout reste enregistré sur l'appareil, la synchro se fait dès qu'il y a du réseau.
   Fusion : séances (log) réunies par id, le reste « le plus récent gagne » rubrique par rubrique. */
(() => {
const C = () => window.CARNET;
const CFG_KEY = 'carnet-sync';
const LOCAL = new Set(['_mt', '_ldel', '_mdel', 'inbox', 'seen']);
let cfg = {}; try { cfg = JSON.parse(localStorage.getItem(CFG_KEY)) || {}; } catch (e) { }
const saveCfg = () => { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) { } };
const on = () => !!(cfg.url && cfg.key);
let snap = null, lastIds = null, dirty = false, busy = false, timer = null, status = '', applying = false;

/* ---------- suivi des modifications (appelé à chaque enregistrement) ---------- */
function track(S) {
  if (applying) return;
  S._mt = S._mt || {}; S._ldel = S._ldel || []; S._mdel = S._mdel || [];
  const first = !snap; snap = snap || {}; const now = Date.now();
  for (const k of Object.keys(S)) {
    if (LOCAL.has(k)) continue;
    const j = JSON.stringify(S[k]);
    if (!first && snap[k] !== j) { S._mt[k] = now; dirty = true; }
    snap[k] = j;
  }
  const ids = new Set((S.log || []).map(l => l.id));
  if (lastIds) for (const id of lastIds) if (!ids.has(id) && !S._ldel.includes(id)) S._ldel.push(id);
  lastIds = ids; if (S._ldel.length > 800) S._ldel = S._ldel.slice(-800);
  if (dirty && on()) { clearTimeout(timer); timer = setTimeout(() => run(), 20000); }
}
const uid = () => (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : Date.now().toString(36) + Math.random().toString(36).slice(2, 12));

/* ---------- appels au serveur ---------- */
async function api(path, opt = {}) {
  const r = await fetch(cfg.url.replace(/\/+$/, '') + path, { ...opt, cache: 'no-store', headers: { Authorization: 'Bearer ' + cfg.key, ...(opt.headers || {}) } });
  if (r.status === 401) throw new Error('cle');
  return r;
}

/* ---------- fusion ---------- */
function merge(S, R) {
  const lm = S._mt || {}, rm = R._mt || {}, mt = { ...lm };
  const ldel = [...new Set([...(S._ldel || []), ...(R._ldel || [])])].slice(-800);
  const mdel = [...new Set([...(S._mdel || []), ...(R._mdel || [])])].slice(-800);
  const out = {};
  for (const k of new Set([...Object.keys(S), ...Object.keys(R)])) {
    if (LOCAL.has(k)) continue;
    const lt = lm[k] || 0, rt = rm[k] || 0;
    if (k === 'log') {
      const by = new Map(), [older, newer] = lt > rt ? [R.log || [], S.log || []] : [S.log || [], R.log || []];
      for (const l of older) if (l && l.id) by.set(l.id, l);
      for (const l of newer) if (l && l.id) by.set(l.id, l);
      for (const id of ldel) by.delete(id);
      out.log = [...by.values()].sort((a, b) => a.start - b.start);
      mt.log = Math.max(lt, rt);
    } else if (k === 'badges') { const a = S.badges || {}, b = R.badges || {}; out.badges = {}; for (const id of new Set([...Object.keys(a), ...Object.keys(b)])) out.badges[id] = (id in a && id in b && typeof a[id] === 'number' && typeof b[id] === 'number') ? Math.min(a[id], b[id]) : (id in a ? a[id] : b[id]); mt.badges = Math.max(lt, rt); }
    else if (!(k in R)) out[k] = S[k];
    else if (!(k in S)) { out[k] = R[k]; mt[k] = rt; }
    else if (lt > rt) out[k] = S[k];
    else { out[k] = R[k]; mt[k] = rt; }
  }
  out._mt = mt; out._ldel = ldel; out._mdel = mdel;
  return out;
}
function apply(S, M) {
  applying = true;
  for (const k of Object.keys(S)) if (!LOCAL.has(k) && !(k in M)) delete S[k];
  Object.assign(S, M);
  C().refreshRec && C().refreshRec();
  C().save();
  applying = false;
  snap = null; lastIds = null; track(S); // nouveau point de départ, sans marquer de modif
}
const sortD = v => Array.isArray(v) ? v.map(sortD) : v && typeof v === 'object' ? Object.keys(v).sort().reduce((o, k) => (o[k] = sortD(v[k]), o), {}) : v;
const canon = o => JSON.stringify(sortD(o));
const payload = S => { const d = {}; for (const k of Object.keys(S)) if (!['inbox', 'seen'].includes(k)) d[k] = S[k]; return d; };

/* ---------- photos et GIF ---------- */
const allLocal = () => new Promise(res => C().media.ready().then(() => C().media.tx(st => { const q = st.getAll(); q.onsuccess = () => res(q.result || []); })));
async function syncMedia(S) {
  let local = await allLocal();
  const noUid = local.filter(m => !m.uid);
  if (noUid.length) { await C().media.tx(st => { for (const m of noUid) { m.uid = uid(); st.put(m); } }); }
  const del = new Set(S._mdel || []);
  const remote = await (await api('/media')).json(), rset = new Set(remote.map(r => r.uid)), lset = new Set(local.map(m => m.uid));
  let up = 0, down = 0, skipped = 0;
  // suppressions
  const goneLocal = local.filter(m => del.has(m.uid));
  if (goneLocal.length) await C().media.tx(st => { for (const m of goneLocal) st.raw.delete(m.k); });
  for (const r of remote) if (del.has(r.uid)) await api('/media/' + r.uid, { method: 'DELETE' });
  // envois
  for (const m of local) {
    if (del.has(m.uid) || rset.has(m.uid)) continue;
    if (m.blob.size > 24 * 1024 * 1024) { skipped++; continue; }
    const r = await api('/media/' + m.uid, { method: 'PUT', body: m.blob, headers: { 'Content-Type': m.type || m.blob.type || 'application/octet-stream', 'X-Ex': encodeURIComponent(m.ex), 'X-T': String(m.t || '') } });
    if (r.ok) up++;
  }
  // réceptions
  for (const r of remote) {
    if (del.has(r.uid) || lset.has(r.uid)) continue;
    const res = await api('/media/' + r.uid); if (!res.ok) continue;
    const blob = await res.blob();
    await C().media.tx(st => st.raw.add({ uid: r.uid, ex: r.ex, type: r.type || blob.type, t: r.t, blob }));
    down++;
  }
  return { up, down, skipped };
}

/* ---------- synchro complète ---------- */
async function run(opts = {}) {
  if (!on() || busy || !navigator.onLine || !C()) return;
  busy = true; clearTimeout(timer); setStatus('Synchro…');
  try {
    const S = C().S(); track(S);
    let r = await (await api('/state')).json();
    if (r.data && !cfg.rev && !opts.choice) { busy = false; setStatus(''); return firstChoice(); }
    if (opts.choice === 'mine') { const now = Date.now(); for (const k of Object.keys(S)) if (!LOCAL.has(k)) S._mt[k] = now; }
    if (opts.choice === 'theirs') S._mt = {};
    for (let tries = 0; tries < 3; tries++) {
      const M = r.data ? merge(S, r.data) : null;
      const changedHere = M && canon(payload({ ...S, ...M })) !== canon(payload(S));
      if (M && changedHere) apply(S, M);
      const needPush = !r.data || dirty || opts.choice || canon(payload(S)) !== canon(r.data);
      if (!needPush) { cfg.rev = r.rev; break; }
      const p = await api('/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ base: r.rev || 0, data: payload(S) }) });
      if (p.status === 409) { r = await (await api('/state')).json(); continue; }
      if (!p.ok) throw new Error('serveur');
      cfg.rev = (await p.json()).rev; dirty = false; break;
    }
    const m = await syncMedia(S);
    cfg.last = Date.now(); saveCfg();
    setStatus('✓ Synchronisé' + (m.down ? ` · ${m.down} média(s) reçu(s)` : '') + (m.up ? ` · ${m.up} envoyé(s)` : '') + (m.skipped ? ` · ${m.skipped} vidéo(s) trop lourde(s)` : ''));
    if (C().S().draft == null || document.body.dataset.view !== 'workout') C().render();
    if (opts.loud) C().toast('Synchronisé ✓');
  } catch (e) {
    setStatus(e.message === 'cle' ? '✕ Clé refusée par le serveur' : '✕ Pas de connexion au serveur');
    if (opts.loud) C().toast(e.message === 'cle' ? 'Clé de synchro refusée' : 'Serveur de synchro injoignable');
  }
  busy = false;
}
function setStatus(t) { status = t; const el = document.getElementById('syncst'); if (el) el.textContent = t || lastTxt(); }
const lastTxt = () => cfg.last ? 'Dernière synchro : ' + new Date(cfg.last).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Jamais synchronisé';

function firstChoice() {
  C().sheet(`<h2>Première synchro</h2><p>Le serveur contient déjà les données d'un autre appareil. Lesquelles garder pour le programme, les réglages et le reste ?</p>
  <p class="tiny">Dans les deux cas, les séances des deux appareils sont réunies, rien n'est perdu.</p>
  <button class="p wide" data-sync="theirs">Prendre celles de l'autre appareil</button>
  <button class="wide" style="margin-top:8px" data-sync="mine">Garder celles de cet appareil</button>
  <button class="ghost wide" style="margin-top:8px" data-close>Annuler</button>`);
}

/* ---------- réglages ---------- */
function html() {
  return `<div class="sec">Synchro iPhone ↔ ordi</div>
  <p class="tiny">Tes séances, programmes, réglages et photos passent d'un appareil à l'autre dès qu'il y a du réseau. À la salle sans réseau, rien ne change : ça se synchronise en sortant.</p>
  <label style="margin-top:8px">Adresse du serveur<input id="syncurl" value="${(cfg.url || '').replace(/"/g, '&quot;')}" placeholder="https://carnet-sport-sync.….workers.dev" inputmode="url" autocapitalize="off" autocomplete="off"></label>
  <label style="margin-top:8px">Clé de synchro<input id="synckey" type="password" value="${(cfg.key || '').replace(/"/g, '&quot;')}" placeholder="Colle ta clé" autocapitalize="off" autocomplete="off"></label>
  <div class="row" style="margin-top:8px"><button class="sm" data-sync="gen">Créer une clé</button><button class="sm" data-sync="show">Afficher / masquer</button></div>
  <button class="p wide" style="margin-top:10px" data-sync="save">${on() ? 'Synchroniser maintenant' : 'Activer la synchro'}</button>
  <p class="tiny" id="syncst" style="margin-top:6px">${status || (on() ? lastTxt() : 'Synchro désactivée')}</p>
  ${on() ? '<button class="ghost wide sm" data-sync="off">Désactiver sur cet appareil</button>' : ''}`;
}
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-sync]'); if (!b) return; const a = b.dataset.sync;
  const ki = document.getElementById('synckey'), ui = document.getElementById('syncurl');
  if (a === 'gen') { const v = Array.from(crypto.getRandomValues(new Uint8Array(24)), x => 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'[x % 56]).join(''); ki.value = v; ki.type = 'text'; try { await navigator.clipboard.writeText(v); C().toast('Clé créée et copiée'); } catch (_) { C().toast('Clé créée : copie-la'); } }
  else if (a === 'show') ki.type = ki.type === 'password' ? 'text' : 'password';
  else if (a === 'save') {
    const url = ui.value.trim(), key = ki.value.trim();
    if (!/^https:\/\/[^ ]+$/.test(url)) return C().toast("L'adresse doit commencer par https://");
    if (key.length < 16) return C().toast('La clé doit faire au moins 16 caractères');
    if (url !== cfg.url || key !== cfg.key) { cfg = { url, key }; saveCfg(); }
    await run({ loud: true });
  }
  else if (a === 'off') { cfg = {}; saveCfg(); C().toast('Synchro désactivée sur cet appareil'); C().render(); }
  else if (a === 'mine' || a === 'theirs') { C().closeSheet(); await run({ choice: a, loud: true }); }
});

/* ---------- déclencheurs ---------- */
addEventListener('online', () => run());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') run(); else if (dirty) run(); });
setTimeout(() => run(), 1500);

window.SYNC = { track, run, html, on, uid, tomb: u => { const S = C() && C().S(); if (S && u) { S._mdel = S._mdel || []; if (!S._mdel.includes(u)) S._mdel.push(u); dirty = true; C().save(); } } };
})();
