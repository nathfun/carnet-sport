'use strict';
/* Amis : fil d'activités, demandes d'amis, profil public et confidentialité, likes et commentaires. */
{
const C = () => window.CARNET, SY = () => window.SYNC;
const VIEWS = window.VIEWS = window.VIEWS || {}, AFTER = window.AFTER = window.AFTER || {};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fr = (n, d = 0) => Number(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: d });
const mm = s => { s = Math.round(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const hm = s => { const m = Math.round(s / 60); return m >= 60 ? Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0') : m + ' min'; };
const ago = t => { const d = (Date.now() - t) / 1000; if (d < 3600) return 'il y a ' + Math.max(1, Math.round(d / 60)) + ' min'; if (d < 86400) return 'il y a ' + Math.round(d / 3600) + ' h'; if (d < 7 * 86400) return new Date(t).toLocaleDateString('fr-FR', { weekday: 'long' }); return new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }); };
const ICO = { gym: '🏋️', run: '🏃', bike: '🚴' }, COL = { gym: 'var(--acc)', run: '#2563eb', bike: '#16a34a' };
const HUE = u => { let h = 0; for (const c of u || '') h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const av = (u, n, big) => `<span class="sav ${big ? 'big' : ''}" style="--h:${HUE(u)}">${esc((n || u || '?').slice(0, 1).toUpperCase())}</span>`;
let sub = 'feed', profU = null, data = {}, loading = false, err = '', qTimer = null;

const meU = () => (SY().cfg().user || {}).u;
async function get(path) { const r = await SY().api(path); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Erreur ' + r.status); return j; }

/* ---------- carte d'activité ---------- */
function card(a, o = {}) {
  const k = a.kind, me = a.owner === meU();
  let stats = '';
  if (k === 'gym') stats = `<div class="fs"><div><b>${hm((a.end - a.start) / 1000)}</b><small>durée</small></div><div><b>${a.nsets || 0}</b><small>séries</small></div>${a.vol != null ? `<div><b>${fr(a.vol)} kg</b><small>soulevés</small></div>` : `<div><b>${a.nex || 0}</b><small>exercices</small></div>`}</div>
    ${(a.exos || []).length ? `<div class="fex">${a.exos.slice(0, 4).map(e => `<span>${esc(e.n)}${e.best ? ` <b>${esc(e.best)}</b>` : ''}</span>`).join('')}${a.exos.length > 4 ? `<span class="mute">+ ${a.exos.length - 4} autres</span>` : ''}</div>` : ''}
    ${(a.prs || []).length ? `<div class="fpr">🏆 ${a.prs.length > 1 ? a.prs.length + ' records' : 'Record'} : ${a.prs.map(esc).join(', ')}</div>` : ''}${a.feel ? `<div class="tiny">Ressenti : ${esc(a.feel)}</div>` : ''}`;
  else stats = `<div class="fs"><div><b>${fr(a.km, 2)} km</b><small>distance</small></div><div><b>${k === 'run' ? mm(a.pace || a.sec / a.km) + '/km' : fr(a.kmh || a.km / (a.sec / 3600), 1) + ' km/h'}</b><small>${k === 'run' ? 'allure' : 'vitesse'}</small></div><div><b>${hm(a.sec)}</b><small>durée</small></div>${a.elev ? `<div><b>${a.elev} m</b><small>D+</small></div>` : ''}</div>`;
  return `<article class="fcard" style="--c:${COL[k]}">
    <header><button class="fwho" data-so="prof" data-u="${esc(a.owner)}">${av(a.owner, a.ownerName)}<span><b>${esc(me ? 'Toi' : a.ownerName)}</b><small>${ago(a.start)}</small></span></button><span class="fk">${ICO[k]}</span></header>
    <h3>${esc(a.name)}</h3>${stats}
    <footer><button class="${a.liked ? 'on' : ''}" data-so="like" data-o="${esc(a.owner)}" data-id="${esc(a.id)}">${a.liked ? '❤️' : '🤍'} <span>${a.likes || ''}</span></button><button data-so="cmts" data-o="${esc(a.owner)}" data-id="${esc(a.id)}">💬 <span>${a.comments || ''}</span></button>${me ? `<button class="fmine" data-lib="ana" data-id="${esc(a.id)}">Analyse ›</button>` : ''}</footer></article>`;
}

/* ---------- vues ---------- */
VIEWS.social = () => {
  if (!SY().on()) return `<div class="kicker">Amis</div><h1>Amis</h1><div class="tcard"><p>Pour retrouver tes amis, il faut un compte.</p><button class="p wide" data-sync="login">Me connecter ou créer un compte</button></div>`;
  if (profU) return `<button class="link" data-so="back">← Amis</button><div id="socbox">${profileHtml()}</div>`;
  const n = (data.me && data.me.in || []).length;
  return `<div class="kicker">Mon espace</div><h1>Amis</h1>
  <div class="seg" style="margin:12px 0">${[['feed', 'Fil'], ['friends', 'Amis' + (n ? ` <i class="sbadge">${n}</i>` : '')], ['me', 'Mon profil public']].map(([k, l]) => `<button class="${sub === k ? 'sel' : ''}" data-so="sub" data-v="${k}">${l}</button>`).join('')}</div>
  <div id="socbox">${{ feed: feedHtml, friends: friendsHtml, me: privHtml }[sub]()}</div>`;
};
AFTER.social = () => { if (SY().on()) load(); };
const wait = () => loading ? '<div class="tcard"><p class="tiny">Chargement…</p></div>' : err ? `<div class="tcard"><p class="small">${esc(err)}</p></div>` : '';

function feedHtml() {
  if (!data.feed) return wait() || '<div class="tcard"><p class="tiny">Chargement…</p></div>';
  const fr0 = !(data.me && data.me.friends.length);
  return `${fr0 ? `<div class="tcard sintro"><b>Ton fil est encore calme 👀</b><p class="small">Ajoute tes proches pour voir leurs séances, les encourager avec un ❤️ et commenter. Ils ne voient que ce que tu choisis de partager.</p><div class="row"><button class="p grow" data-so="sub" data-v="friends">Ajouter des amis</button><button class="grow" data-sync="invite">Inviter quelqu'un</button></div></div>` : ''}
    ${data.feed.map(a => card(a)).join('') || '<p class="tiny">Aucune activité pour l\'instant.</p>'}`;
}
function friendsHtml() {
  const m = data.me; if (!m) return wait() || '<div class="tcard"><p class="tiny">Chargement…</p></div>';
  const row = (x, btns) => `<div class="frow"><button class="fwho" data-so="prof" data-u="${esc(x.u)}">${av(x.u, x.name)}<span><b>${esc(x.name)}</b><small>@${esc(x.u)}</small></span></button><span class="row" style="gap:6px">${btns}</span></div>`;
  return `<section class="tcard"><h2 class="h2s">Ajouter un ami</h2><input id="soq" placeholder="Son pseudo (ex. maxime)" autocapitalize="off" autocomplete="off" value="${esc(data.q || '')}"><div id="sores">${resultsHtml()}</div>
      <p class="tiny" style="margin-top:8px">Il n'a pas encore l'app ? <button class="link" data-sync="invite">Envoie-lui une invitation</button></p></section>
    ${m.in.length ? `<section class="tcard"><h2 class="h2s">Demandes reçues</h2>${m.in.map(x => row(x, `<button class="sm p" data-so="accept" data-u="${esc(x.u)}">Accepter</button><button class="sm ghost" data-so="decline" data-u="${esc(x.u)}">Refuser</button>`)).join('')}</section>` : ''}
    <section class="tcard"><h2 class="h2s">Mes amis <small>${m.friends.length}</small></h2>${m.friends.map(x => row(x, '<span class="mer-go">›</span>')).join('') || '<p class="tiny">Pas encore d\'amis. Cherche leur pseudo au-dessus.</p>'}</section>
    ${m.out.length ? `<section class="tcard"><h2 class="h2s">Demandes envoyées</h2>${m.out.map(x => row(x, `<button class="sm ghost" data-so="cancel" data-u="${esc(x.u)}">Annuler</button>`)).join('')}</section>` : ''}`;
}
function resultsHtml() {
  const R = data.res; if (!R) return ''; if (!R.length) return '<p class="tiny">Personne avec ce pseudo.</p>';
  return R.map(x => `<div class="frow"><button class="fwho" data-so="prof" data-u="${esc(x.u)}">${av(x.u, x.name)}<span><b>${esc(x.name)}</b><small>@${esc(x.u)}</small></span></button>${x.rel === 'friend' ? '<span class="okchip">Amis</span>' : x.rel === 'out' ? '<span class="chip2">Demande envoyée</span>' : x.rel === 'in' ? `<button class="sm p" data-so="accept" data-u="${esc(x.u)}">Accepter</button>` : `<button class="sm p" data-so="request" data-u="${esc(x.u)}">+ Ajouter</button>`}</div>`).join('');
}
function privHtml() {
  const m = data.me; if (!m) return wait() || '<div class="tcard"><p class="tiny">Chargement…</p></div>';
  const P = m.privacy, sh = P.share, u = SY().cfg().user || {};
  const tog = (k, l, d) => `<label class="ptog"><span><b>${l}</b><small>${d}</small></span><input type="checkbox" data-sop="${k}" ${sh[k] ? 'checked' : ''}></label>`;
  return `<section class="tcard"><div class="pme">${av(u.u, u.name, true)}<div><b>${esc(u.name)}</b><small>@${esc(u.u)}</small></div></div>
      <label class="lbl">Ma bio (facultatif)<input data-sop="bio" value="${esc(P.bio || '')}" maxlength="160" placeholder="ex. Objectif 10 km en 50 min 🏃"></label></section>
    <section class="tcard"><h2 class="h2s">Qui peut voir mes activités ?</h2><div class="pvis">${[['public', '🌍', 'Tout le monde', 'Tous les utilisateurs de l\'app peuvent voir ton profil et tes activités.'], ['friends', '👥', 'Mes amis seulement', 'Seulement les personnes que tu as acceptées. Recommandé.'], ['private', '🔒', 'Personne', 'Ton fil reste privé, même pour tes amis.']].map(([k, i, t, d]) => `<button class="${P.vis === k ? 'sel' : ''}" data-so="vis" data-v="${k}"><span>${i}</span><span><b>${t}</b><small>${d}</small></span></button>`).join('')}</div></section>
    <section class="tcard"><h2 class="h2s">Ce que je partage</h2>
      ${tog('gym', '🏋️ Mes séances de muscu', 'Nom de la séance, durée, exercices')}${tog('loads', '⚖️ Mes charges', 'Le détail des kilos et répétitions')}${tog('prs', '🏆 Mes records', 'Quand tu bats un record')}${tog('run', '🏃 Mes courses', 'Distance, allure, durée')}${tog('bike', '🚴 Mes sorties vélo', 'Distance, vitesse, dénivelé')}
      <p class="tiny">Ton poids, tes mensurations, tes photos et ta nutrition ne sont jamais partagés. Tu peux aussi cacher une activité précise depuis son analyse.</p></section>
    <button class="wide" data-so="prof" data-u="${esc(u.u)}">Voir mon profil comme mes amis le voient</button>`;
}
function profileHtml() {
  const P = data.prof; if (!P || P.u !== profU) return wait() || '<div class="tcard"><p class="tiny">Chargement…</p></div>';
  const btn = P.rel === 'self' ? '<button class="sm" data-so="sub" data-v="me">Modifier mon profil public</button>' : P.rel === 'friend' ? `<button class="sm ghost" data-so="remove" data-u="${esc(P.u)}">Amis ✓ · Retirer</button>` : P.rel === 'out' ? `<button class="sm ghost" data-so="cancel" data-u="${esc(P.u)}">Demande envoyée · Annuler</button>` : P.rel === 'in' ? `<button class="sm p" data-so="accept" data-u="${esc(P.u)}">Accepter sa demande</button>` : `<button class="sm p" data-so="request" data-u="${esc(P.u)}">+ Ajouter en ami</button>`;
  return `<section class="tcard ppro">${av(P.u, P.name, true)}<div class="grow"><h2>${esc(P.name)}</h2><small>@${esc(P.u)} · ${P.vis === 'public' ? '🌍 public' : P.vis === 'private' ? '🔒 privé' : '👥 amis'}</small>${P.bio ? `<p class="small">${esc(P.bio)}</p>` : ''}</div></section>
    <div class="row" style="margin:-4px 0 12px">${btn}</div>
    ${P.visible ? `<div class="kt">${[['🏋️', P.stats.gym, 'séances ce mois'], ['🏃', fr(P.stats.run, 1) + ' km', 'course ce mois'], ['🚴', fr(P.stats.bike, 0) + ' km', 'vélo ce mois']].map(([i, b, l]) => `<div><small>${i} ${l}</small><b>${b}</b></div>`).join('')}</div>${P.acts.map(a => card(a)).join('') || '<p class="tiny">Aucune activité partagée.</p>'}`
      : `<div class="tcard"><p class="small">🔒 ${P.vis === 'private' ? `${esc(P.name)} garde ses activités privées.` : `Ajoute ${esc(P.name)} en ami pour voir ses activités.`}</p></div>`}`;
}

/* ---------- données ---------- */
async function load() {
  if (loading) return; loading = true; err = '';
  try {
    if (!navigator.onLine) throw new Error('Pas de réseau : le fil s\'affichera dès que tu seras connecté.');
    if (profU) data.prof = await get('/social/profile/' + encodeURIComponent(profU));
    else { data.me = await get('/social/me'); if (data.me.friends.length && !C().S().set.hasFriends) { C().S().set.hasFriends = true; C().save(); } if (sub === 'feed') { data.feed = await get('/social/feed'); try { localStorage.setItem('carnet-feed', JSON.stringify(data.feed.slice(0, 6))); } catch (_) { } } }
  } catch (e) { err = e.message; }
  loading = false;
  const box = document.getElementById('socbox'); if (box && document.body.dataset.view === 'social') { box.innerHTML = profU ? profileHtml() : { feed: feedHtml, friends: friendsHtml, me: privHtml }[sub](); bindSearch(); }
}
function bindSearch() { const q = document.getElementById('soq'); if (q && !q.dataset.b) { q.dataset.b = 1; q.addEventListener('input', () => { clearTimeout(qTimer); data.q = q.value; qTimer = setTimeout(async () => { try { data.res = q.value.trim().length >= 2 ? await get('/social/search?q=' + encodeURIComponent(q.value.trim())) : null; } catch (e) { data.res = []; } const r = document.getElementById('sores'); if (r) r.innerHTML = resultsHtml(); }, 300); }); } }
function refresh() { const box = document.getElementById('socbox'); if (box) { box.innerHTML = profU ? profileHtml() : { feed: feedHtml, friends: friendsHtml, me: privHtml }[sub](); bindSearch(); } }

async function comments(o, id) {
  C().sheet('<p class="tiny">Chargement…</p>');
  try {
    const d = await get(`/social/act/${encodeURIComponent(o)}/${encodeURIComponent(id)}`), me = meU();
    C().sheet(`<h2>${esc(d.act.name)}</h2><p class="tiny">${esc(d.act.ownerName)} · ${ago(d.act.start)}</p>
      ${d.likes.length ? `<p class="small">❤️ ${d.likes.map(esc).join(', ')}</p>` : ''}
      <div class="clist">${d.comments.map(c => `<div class="cmt">${av(c.u, c.name)}<div><b>${esc(c.name)}</b> <small>${ago(c.t)}</small><p>${esc(c.txt)}</p></div>${c.u === me || o === me ? `<button class="ib" data-so="uncmt" data-o="${esc(o)}" data-id="${esc(id)}" data-c="${esc(c.id)}" aria-label="Supprimer">✕</button>` : ''}</div>`).join('') || '<p class="tiny">Pas encore de commentaire. Sois le premier !</p>'}</div>
      <div class="row" style="margin-top:10px"><input id="cmtin" class="grow" placeholder="Écris un commentaire…" maxlength="500"><button class="p" data-so="send" data-o="${esc(o)}" data-id="${esc(id)}">Envoyer</button></div>
      <button class="ghost wide" style="margin-top:8px" data-close>Fermer</button>`);
  } catch (e) { C().sheet(`<p>${esc(e.message)}</p><button class="ghost wide" data-close>Fermer</button>`); }
}
function patchAct(o, id, r) { for (const L of [data.feed, data.prof && data.prof.acts]) for (const a of L || []) if (a.owner === o && a.id === id) { if (r.likes != null) { a.likes = r.likes; a.liked = r.liked; } if (r.comments) a.comments = r.comments.length; } }

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-so]'); if (!b || !window.CARNET) return; const a = b.dataset.so;
  try {
    switch (a) {
      case 'sub': sub = b.dataset.v; profU = null; C().go('social'); return;
      case 'back': profU = null; C().render(); return;
      case 'prof': C().closeSheet(); profU = b.dataset.u; data.prof = null; C().go('social'); return;
      case 'request': case 'accept': case 'decline': case 'cancel': case 'remove': {
        if (a === 'remove' && !b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Sûr ? Retirer'; return; }
        b.disabled = true; await SY().post('/social/' + a, { u: b.dataset.u });
        C().toast({ request: 'Demande envoyée', accept: 'Vous êtes amis 🎉', decline: 'Demande refusée', cancel: 'Demande annulée', remove: 'Ami retiré' }[a]);
        data.res = null; await load(); return;
      }
      case 'vis': { const r = await SY().post('/social/privacy', { vis: b.dataset.v }); data.me.privacy = r; refresh(); C().toast('Enregistré'); return; }
      case 'like': { const liked = b.classList.toggle('on'); b.firstChild.textContent = liked ? '❤️ ' : '🤍 '; const r = await SY().post('/social/like', { owner: b.dataset.o, id: b.dataset.id }); patchAct(b.dataset.o, b.dataset.id, r); b.querySelector('span').textContent = r.likes || ''; if (r.liked !== liked) { b.classList.toggle('on', r.liked); b.firstChild.textContent = r.liked ? '❤️ ' : '🤍 '; } return; }
      case 'cmts': comments(b.dataset.o, b.dataset.id); return;
      case 'send': { const t = document.getElementById('cmtin'); if (!t.value.trim()) return; b.disabled = true; const r = await SY().post('/social/comment', { owner: b.dataset.o, id: b.dataset.id, txt: t.value }); patchAct(b.dataset.o, b.dataset.id, r); comments(b.dataset.o, b.dataset.id); refresh(); return; }
      case 'uncmt': { const r = await SY().post('/social/uncomment', { owner: b.dataset.o, id: b.dataset.id, cid: b.dataset.c }); patchAct(b.dataset.o, b.dataset.id, r); comments(b.dataset.o, b.dataset.id); refresh(); return; }
      case 'hide': { const l = C().S().log.find(x => x.id === b.dataset.id); if (!l) return; l.hide = !l.hide; C().save(); C().toast(l.hide ? 'Activité masquée pour tes amis' : 'Activité visible par tes amis'); C().render(); SY().run(); return; }
    }
  } catch (x) { b.disabled = false; C().toast(x.message === 'Failed to fetch' ? 'Pas de connexion' : x.message); }
});
document.addEventListener('change', async e => {
  const t = e.target; if (!t.dataset || !t.dataset.sop || !window.CARNET) return;
  try { const k = t.dataset.sop, body = k === 'bio' ? { bio: t.value.trim() } : { share: { [k]: t.checked } }; data.me.privacy = await SY().post('/social/privacy', body); C().toast('Enregistré'); } catch (x) { C().toast(x.message); }
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'cmtin') document.querySelector('[data-so=send]')?.click(); });

/* ---------- accueil : dernières activités des amis ---------- */
window.SOCIAL = {
  homeCard() {
    if (!SY().on()) return '';
    let F = []; try { F = JSON.parse(localStorage.getItem('carnet-feed') || '[]'); } catch (_) { }
    const others = F.filter(a => a.owner !== meU()).slice(0, 2);
    return `<section class="card hsoc"><div class="between"><div class="eyebrow" style="margin:0">Tes amis</div><button class="link" data-so="sub" data-v="feed">Voir le fil ›</button></div>
      ${others.length ? others.map(a => `<button class="arow" data-so="cmts" data-o="${esc(a.owner)}" data-id="${esc(a.id)}"><span class="a-ic" style="--c:${COL[a.kind]}">${ICO[a.kind]}</span><span class="a-t"><b>${esc(a.ownerName)} · ${esc(a.name)}</b><small>${ago(a.start)}${a.km ? ' · ' + fr(a.km, 1) + ' km' : a.nsets ? ' · ' + a.nsets + ' séries' : ''}${a.likes ? ' · ❤️ ' + a.likes : ''}</small></span><span class="mer-go">›</span></button>`).join('') : '<p class="small" style="margin:6px 0 0">Ajoute tes proches pour suivre leurs séances et les encourager.</p><button class="sm" style="margin-top:8px" data-so="sub" data-v="friends">Ajouter des amis</button>'}</section>`;
  },
  async pullNotifs() {
    try {
      const L = await (await SY().api('/notifs')).json(); const fresh = (L || []).filter(n => n.fresh).reverse();
      for (const n of fresh) window.notify && window.notify({ like: '❤️', comment: '💬', req: '👋', accept: '🤝' }[n.type] || '🔔', { like: `${n.fromName} aime ton activité`, comment: `${n.fromName} a commenté`, req: `${n.fromName} veut être ton ami`, accept: `${n.fromName} a accepté ta demande` }[n.type] || 'Nouveauté', n.type === 'comment' ? `« ${n.txt} » sur ${n.actName}` : n.actName || (n.type === 'req' ? 'Va dans Amis pour accepter.' : ''), { silent: true });
      if (fresh.length) { await SY().api('/notifs/seen', { method: 'POST' }); try { localStorage.setItem('carnet-feed', '[]'); } catch (_) { } }
      if (navigator.onLine && document.body.dataset.view === 'home') { const F = await (await SY().api('/social/feed')).json(); if (Array.isArray(F)) { localStorage.setItem('carnet-feed', JSON.stringify(F.slice(0, 6))); const h = document.querySelector('.hsoc'); if (h) h.outerHTML = window.SOCIAL.homeCard(); } }
    } catch (_) { }
  },
};
}
