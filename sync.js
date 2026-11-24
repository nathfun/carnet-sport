/* Compte + synchro via le serveur Cloudflare (un compte par personne).
   Hors ligne d'abord : tout reste enregistré sur l'appareil, la synchro se fait dès qu'il y a du réseau.
   Fusion : séances (log) réunies par id, le reste « le plus récent gagne » rubrique par rubrique. */
(() => {
const C = () => window.CARNET;
const CFG_KEY = 'carnet-sync';
const SERVER = 'https://carnet-sport-sync.nathanbouvier45.workers.dev';
const LOCAL = new Set(['_mt', '_ldel', '_mdel', '_owner', 'inbox', 'seen']);
let cfg = {}; try { cfg = JSON.parse(localStorage.getItem(CFG_KEY)) || {}; } catch (e) { }
const saveCfg = () => { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) { } };
const base = () => (cfg.url || SERVER).replace(/\/+$/, '');
const on = () => !!cfg.token;
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
  const r = await fetch(base() + path, { ...opt, cache: 'no-store', headers: { ...(cfg.token ? { Authorization: 'Bearer ' + cfg.token } : {}), ...(opt.headers || {}) } });
  if (r.status === 401 && cfg.token && !opt.noLogout) { cfg.token = null; cfg.expired = true; saveCfg(); setTimeout(() => C() && C().render(), 0); throw new Error('cle'); }
  return r;
}
async function post(path, body, extra = {}) { const r = await api(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}), ...extra }); let j = {}; try { j = await r.json(); } catch (e) { } if (!r.ok) throw new Error(j.error || 'Erreur ' + r.status); return j; }

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
  // suppressions (dont les GIF partagés que Nathan a retirés)
  const goneLocal = local.filter(m => del.has(m.uid) || (m.shared && !rset.has(m.uid)));
  if (goneLocal.length) await C().media.tx(st => { for (const m of goneLocal) st.raw.delete(m.k); });
  for (const r of remote) if (del.has(r.uid) && !r.shared) await api('/media/' + r.uid, { method: 'DELETE' });
  // envois
  for (const m of local) {
    if (m.shared || del.has(m.uid) || rset.has(m.uid)) continue;
    if (m.blob.size > 24 * 1024 * 1024) { skipped++; continue; }
    const r = await api('/media/' + m.uid, { method: 'PUT', body: m.blob, headers: { 'Content-Type': m.type || m.blob.type || 'application/octet-stream', 'X-Ex': encodeURIComponent(m.ex), 'X-T': String(m.t || '') } });
    if (r.ok) up++;
  }
  // réceptions
  for (const r of remote) {
    if (del.has(r.uid) || lset.has(r.uid)) continue;
    const res = await api('/media/' + r.uid); if (!res.ok) continue;
    const blob = await res.blob();
    await C().media.tx(st => st.raw.add({ uid: r.uid, ex: r.ex, type: r.type || blob.type, t: r.t, blob, ...(r.shared ? { shared: true } : {}) }));
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
    if (cfg.strava) { try { const q = await api('/strava/pull' + (opts.loud ? '?force=1' : ''), { method: 'POST' }); if (q.ok) { const j = await q.json(); if (j.added > 0) cfg.stravaNew = j.added; } } catch (_) { } }
    let r = await (await api('/state')).json();
    if (r.data && !cfg.rev && !opts.choice) { if (!(S.log || []).length) opts.choice = 'theirs'; else { busy = false; setStatus(''); return firstChoice(); } }
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
    if (window.SOCIAL) window.SOCIAL.pullNotifs();
    if (cfg.stravaNew) { C().toast(cfg.stravaNew + ' sortie(s) Strava ajoutée(s)'); cfg.stravaNew = 0; saveCfg(); }
    else if (opts.loud) C().toast('Synchronisé ✓');
  } catch (e) {
    setStatus(e.message === 'cle' ? '✕ Session expirée : reconnecte-toi' : '✕ Pas de connexion au serveur');
    if (opts.loud) C().toast(e.message === 'cle' ? 'Session expirée : reconnecte-toi' : 'Serveur injoignable');
  }
  busy = false;
}
function setStatus(t) { status = t; const el = document.getElementById('syncst'); if (el) el.textContent = t || lastTxt(); }
const lastTxt = () => cfg.last ? 'Dernière synchro : ' + new Date(cfg.last).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Jamais synchronisé';

function firstChoice() {
  C().sheet(`<h2>Première synchro</h2><p>Ton compte contient déjà des données (depuis un autre appareil). Lesquelles garder pour le programme, les réglages et le reste ?</p>
  <p class="tiny">Dans les deux cas, les séances des deux appareils sont réunies, rien n'est perdu.</p>
  <button class="p wide" data-sync="theirs">Prendre celles de l'autre appareil</button>
  <button class="wide" style="margin-top:8px" data-sync="mine">Garder celles de cet appareil</button>
  <button class="ghost wide" style="margin-top:8px" data-close>Annuler</button>`);
}

/* ---------- réglages : mon compte ---------- */
const escA = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function html() {
  if (!on()) return `<div class="sec">Compte</div><p class="tiny">Tu utilises l'app sans compte : tout reste sur cet appareil, sans synchro ni amis.</p><button class="p wide" data-sync="login">Me connecter ou créer un compte</button>`;
  const u = cfg.user || {};
  return `<div class="sec">Mon compte</div>
  <div class="acc"><span class="acc-av">${escA((u.name || u.u || '?').slice(0, 1).toUpperCase())}</span><div><b>${escA(u.name || u.u)}</b><small>@${escA(u.u)}${u.admin ? ' · administrateur' : ''}</small></div></div>
  <p class="tiny" id="syncst" style="margin-top:8px">${status || lastTxt()}</p>
  <div class="row"><button class="sm grow" data-sync="save">Synchroniser maintenant</button><button class="sm grow" data-sync="invite">Inviter un ami</button></div>
  <details class="accd"><summary>Changer mon mot de passe</summary><label>Mot de passe actuel<input type="password" id="pwold" autocomplete="current-password"></label><label>Nouveau mot de passe<input type="password" id="pwnew" autocomplete="new-password"></label><button class="sm" style="margin-top:8px" data-sync="pw">Changer</button></details>
  ${u.admin ? `<details class="accd"><summary>Administration (profils de la famille)</summary>
    <p class="tiny">Crée un profil pour quelqu'un (ex. ton père), puis donne-lui son pseudo et son mot de passe.</p>
    <label>Prénom<input id="adname"></label><label>Pseudo<input id="adu" autocapitalize="off" autocomplete="off"></label><label>Mot de passe provisoire<input id="adpw" autocomplete="off"></label>
    <div class="row" style="margin-top:8px"><button class="sm p" data-sync="adcreate">Créer le profil</button><button class="sm" data-sync="adreset">Réinitialiser son mot de passe</button></div>
    <div id="adlist" class="tiny" style="margin-top:8px"></div><button class="sm ghost" data-sync="adlist">Voir tous les profils</button></details>` : ''}
  <button class="ghost wide sm" style="margin-top:10px" data-sync="logout">Me déconnecter de cet appareil</button>
  ${u.admin || cfg.strava ? `<div class="sec">Strava</div><p class="tiny" id="stravast">Vérification…</p><div id="stravabtn"></div>` : ''}`;
}
async function stravaBox() {
  const st = document.getElementById('stravast'), bx = document.getElementById('stravabtn'); if (!st || !on()) return;
  try {
    const s = await (await api('/strava/status')).json();
    if (!s.configured) { st.textContent = "Strava n'est pas encore branché sur ton serveur (clés à ajouter dans GitHub)."; bx.innerHTML = ''; return; }
    if (cfg.strava !== s.connected) { cfg.strava = s.connected; saveCfg(); }
    st.textContent = s.connected ? `Connecté${s.name.trim() ? ' (' + s.name.trim() + ')' : ''}. Tes courses et sorties vélo arrivent toutes seules.` : 'Connecte ton compte : tes courses et sorties vélo arriveront toutes seules dans l\'app, même app fermée.';
    bx.innerHTML = s.connected ? '<div class="row"><button class="sm" data-sync="spull">Récupérer maintenant</button><button class="sm ghost" data-sync="sunlink">Déconnecter</button></div>' : '<button class="wide" style="background:#fc4c02;color:#fff;border:0" data-sync="slink">Connecter Strava</button>';
  } catch (e) { st.textContent = 'Serveur injoignable pour le moment.'; }
}
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-sync]'); if (!b) return; const a = b.dataset.sync, v = id => (document.getElementById(id) || {}).value || '';
  try {
    if (a === 'save') await run({ loud: true });
    else if (a === 'login') { cfg.local = false; saveCfg(); C().render(); }
    else if (a === 'logout') { if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Sûr ? Tes données seront retirées de cet appareil (elles restent sur ton compte)'; return; } await run(); try { await api('/auth/logout', { method: 'POST' }); } catch (_) { } await wipe(); }
    else if (a === 'invite') { const j = await post('/invite'); const txt = `Rejoins-moi sur Carnet sport : ${j.url}`; try { if (navigator.share) { await navigator.share({ text: txt }); return; } } catch (_) { return; } try { await navigator.clipboard.writeText(j.url); C().toast("Lien d'invitation copié (valable 30 jours)"); } catch (_) { C().sheet(`<h2>Lien d'invitation</h2><p class="small">${escA(j.url)}</p><button class="ghost wide" data-close>Fermer</button>`); } }
    else if (a === 'pw') { await post('/me', { old: v('pwold'), pass: v('pwnew') }); C().toast('Mot de passe changé'); document.getElementById('pwold').value = document.getElementById('pwnew').value = ''; }
    else if (a === 'adcreate') { const j = await post('/admin/users', { name: v('adname'), u: v('adu'), pass: v('adpw') }); C().toast('Profil @' + j.u + ' créé'); }
    else if (a === 'adreset') { await post('/admin/reset', { u: v('adu'), pass: v('adpw') }); C().toast('Mot de passe de @' + v('adu').toLowerCase() + ' changé'); }
    else if (a === 'adlist') { const L = await (await api('/admin/users')).json(); document.getElementById('adlist').innerHTML = L.map(x => `<div>• <b>${escA(x.name)}</b> @${escA(x.u)}${x.admin ? ' (admin)' : ''}</div>`).join(''); }
    else if (a === 'slink') { const j = await post('/strava/link'); if (j.url) location.href = j.url; }
    else if (a === 'spull') { cfg.strava = true; saveCfg(); await run({ loud: true }); stravaBox(); }
    else if (a === 'sunlink') { if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Sûr ?'; return; } await post('/strava/unlink'); cfg.strava = false; saveCfg(); C().toast('Strava déconnecté'); stravaBox(); }
    else if (a === 'mine' || a === 'theirs') { C().closeSheet(); await run({ choice: a, loud: true }); }
  } catch (err) { C().toast(err.message === 'Failed to fetch' ? 'Pas de connexion au serveur' : err.message); }
});
async function wipe() {
  cfg = { url: cfg.url }; saveCfg();
  try { localStorage.removeItem('carnet-sport.v1'); } catch (_) { }
  try { await C().media.ready(); await C().media.tx(st => st.raw.clear()); } catch (_) { }
  try { await caches.delete('carnet-acts'); } catch (_) { }
  location.reload();
}
/* connexion : appelée par l'écran de connexion */
async function signIn(j) {
  const S = C().S();
  if (S._owner && S._owner !== j.user.u) { cfg = { url: cfg.url, token: j.token, user: j.user }; saveCfg(); localStorage.removeItem('carnet-sport.v1'); try { await C().media.tx(st => st.raw.clear()); } catch (_) { } location.reload(); return; }
  cfg = { url: cfg.url, token: j.token, user: j.user, rev: (j.claimed || (cfg.key && j.user.admin)) ? cfg.rev : undefined, strava: (j.claimed || (cfg.key && j.user.admin)) ? cfg.strava : false }; saveCfg();
  S._owner = j.user.u; C().save();
}
/* ---------- déclencheurs ---------- */
addEventListener('online', () => run());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') run(); else if (dirty) run(); });
setTimeout(() => run(), 1500);
new MutationObserver(() => { const st = document.getElementById('stravast'); if (st && !st.dataset.done) { st.dataset.done = 1; stravaBox(); } }).observe(document.body, { childList: true, subtree: true });
if (/[?&]strava=/.test(location.search)) history.replaceState(null, '', location.pathname);

window.SYNC = { track, run, html, on, uid, api, base, post, signIn, wipe, cfg: () => cfg, saveCfg: () => saveCfg(), setLocal: x => { cfg.local = x; saveCfg(); }, get: async path => { const r = await api(path); if (!r.ok) throw new Error('http ' + r.status); return r.json(); }, tomb: u => { const S = C() && C().S(); if (S && u) { S._mdel = S._mdel || []; if (!S._mdel.includes(u)) S._mdel.push(u); dirty = true; C().save(); } } };
})();
