'use strict';
/* Version grand écran : bibliothèque d'exercices illustrée, fiche exercice avec sommaire flottant,
   éditeur de programmes en tableau, analyses détaillées, questions à Claude.
   Les vues marchent aussi sur téléphone (en une colonne). */
{
const C = () => window.CARNET;
const VIEWS = window.VIEWS = window.VIEWS || {}, AFTER = window.AFTER = window.AFTER || {};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = v => parseFloat(String(v ?? '').replace(',', '.')) || 0;
const fr = (n, d = 0) => Number(n).toLocaleString('fr-FR', { maximumFractionDigits: d });
const fk = v => fr(num(v), 1);
const mmss = s => Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0');
const hms = s => s >= 3600 ? Math.floor(s / 3600) + ' h ' + String(Math.floor(s % 3600 / 60)).padStart(2, '0') : Math.round(s / 60) + ' min';
const dL = t => new Date(t).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const dS = t => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const EQ_ORDER = ['M', 'S', 'P', 'H', 'B', 'K', 'E', 'C'];
const EQ_ICON = { M: '⚙️', S: '🏗️', P: '🪢', H: '🏋️', B: '➖', K: '🔔', E: '〰️', C: '🤸' };
const isDesk = () => matchMedia('(min-width: 1100px)').matches;
const meTxt = () => window.PROFILE ? window.PROFILE.me() : '';

let libM = '', libE = '', libQ = '', libPick = null, exoId = null, anaId = null, progSel = null, anaFrom = null;
const urls = [];
const freeUrls = () => { while (urls.length) URL.revokeObjectURL(urls.pop()); };
const all = () => [...C().allEx().values()];
const meta = id => C().metaOf(id) || {};
const inSessions = id => C().S().program.filter(p => p.ex.some(e => e.id === id)).map(p => p.name);
const gymLog = () => C().S().log.filter(l => l.kind !== 'run' && l.kind !== 'bike');
const exHist = id => gymLog().filter(s => (s.ex || []).some(e => e.id === id)).map(s => {
  const e = s.ex.find(x => x.id === id), w = (e.sets || []).filter(x => x.t !== 'e' && num(x.kg) >= 0);
  const best = w.reduce((b, x) => (num(x.kg) > b.kg || (num(x.kg) === b.kg && (+x.r || 0) > b.r)) ? { kg: num(x.kg), r: +x.r || 0 } : b, { kg: 0, r: 0 });
  return { s, e, best, vol: w.reduce((a, x) => a + num(x.kg) * (+x.r || 0), 0), e1: Math.round(best.kg * (1 + best.r / 30) * 10) / 10 };
});
function askClaude(prompt) {
  try { navigator.clipboard.writeText(prompt); } catch (e) { }
  const a = document.createElement('a'); a.href = 'https://claude.ai/new?q=' + encodeURIComponent(prompt.slice(0, 6000)); a.target = '_blank'; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  C().toast('Question envoyée à Claude (copiée aussi)');
}

/* ---------- cartes d'exercice ---------- */
function card(e) {
  const m = meta(e.id), R = C().REC().get(e.id), ins = inSessions(e.id);
  const tgt = libPick != null ? C().S().program[libPick] : null, done = tgt ? tgt.ex.some(x => x.id === e.id) : ins.length > 0;
  return `<div class="xcard">
    <button class="xc-img" data-lib="open" data-id="${esc(e.id)}" data-th="${esc(e.id)}" aria-label="${esc(e.n)}">${window.bodySvg(m.m || 'Pecs', { cls: 'xc-body' })}</button>
    <button class="xc-add ${done ? 'on' : ''}" data-lib="add" data-id="${esc(e.id)}" aria-label="Ajouter ${esc(e.n)} à une séance" title="${done ? 'Déjà dans : ' + esc((tgt ? [tgt.name] : ins).join(', ')) : 'Ajouter à une séance'}">${done ? '✓' : '+'}</button>
    <button class="xc-t" data-lib="open" data-id="${esc(e.id)}"><b>${esc(e.n)}</b><small>${R ? `Record ${fk(R.kg)} kg × ${R.r || 1}` : esc((window.EQUIP || {})[m.eq] || 'Perso')}${C().S().guides[e.id] ? ' · guide' : ''}</small></button></div>`;
}
async function fillThumbs() {
  const boxes = [...document.querySelectorAll('[data-th]')]; if (!boxes.length) return;
  await C().media.ready();
  for (const b of boxes) {
    const L = (await C().media.list(b.dataset.th)).filter(m => !String(m.type).startsWith('video')); if (!L.length || !b.isConnected) continue;
    const u = URL.createObjectURL(L[0].blob); urls.push(u); b.innerHTML = `<img src="${u}" alt="" loading="lazy">`; b.classList.add('ph');
  }
}

/* ---------- bibliothèque ---------- */
function pickBar() {
  if (libPick == null) return '';
  const s = C().S().program[libPick]; if (!s) { libPick = null; return ''; }
  return `<div class="pickbar"><span>Tu ajoutes des exercices à <b>${esc(s.name)}</b> (${s.ex.length} exos). Touche <b>+</b> sur une carte.</span><button class="p sm" data-lib="pickdone">Terminé</button></div>`;
}
function groupsBy(list, key) {
  const g = new Map(); for (const e of list) { const k = key(e); if (!g.has(k)) g.set(k, []); g.get(k).push(e); }
  return g;
}
VIEWS.lib = () => {
  const L = all(), EQ = window.EQUIP || {}, MU = window.MUSCLES || [];
  const head = `${pickBar()}<div class="lhero"><div><div class="kicker">Bibliothèque · ${L.length} exercices</div><h1 class="bigt">Exercices de musculation</h1>
    <p class="mute">Choisis un muscle, puis ajoute les exercices à tes séances en un clic. Tes propres GIF remplacent les silhouettes.</p></div>
    <div class="lsearch"><b>Trouve ton exercice</b><input data-lib="q" value="${esc(libQ)}" placeholder="Pec deck, tirage, presse…" autocomplete="off" aria-label="Chercher un exercice"><div class="chipsrow">${['Développé', 'Tirage', 'Presse', 'Curl', 'Écarté'].map(w => `<button class="chip2" data-lib="qq" data-v="${w}">${w}</button>`).join('')}</div></div></div>`;
  if (libQ) {
    const q = libQ.toLowerCase(), R = L.filter(e => e.n.toLowerCase().includes(q) || (meta(e.id).m || '').toLowerCase().includes(q)).sort((a, b) => a.n.localeCompare(b.n, 'fr'));
    return head + `<h2 class="h2t">${R.length} résultat${R.length > 1 ? 's' : ''} pour « ${esc(libQ)} »</h2><div class="xgrid">${R.map(card).join('') || '<p class="tiny">Rien trouvé.</p>'}</div>`;
  }
  if (!libM && !libE) {
    const cnt = m => L.filter(e => meta(e.id).m === m).length, ce = k => L.filter(e => meta(e.id).eq === k).length;
    return head + `<h2 class="h2t">Par groupe musculaire</h2><div class="mgrid3">${MU.map(m => `<button class="mucard" data-lib="m" data-v="${esc(m)}">${window.bodySvg(m, { cls: 'mu-body' })}<b>${esc(m)}</b><small>${cnt(m)} exercices</small></button>`).join('')}</div>
      <h2 class="h2t">Par matériel</h2><div class="eqgrid">${EQ_ORDER.filter(k => ce(k)).map(k => `<button class="eqcard" data-lib="e" data-v="${k}"><span>${EQ_ICON[k]}</span><b>${esc(EQ[k])}</b><small>${ce(k)} exercices</small></button>`).join('')}</div>`;
  }
  const list = L.filter(e => (!libM || meta(e.id).m === libM) && (!libE || meta(e.id).eq === libE));
  const base = L.filter(e => !libM || meta(e.id).m === libM);
  const chips = libM ? `<div class="chipsrow lchips"><button class="chip2 ${!libE ? 'sel' : ''}" data-lib="e" data-v="">Tous <i>${base.length}</i></button>${EQ_ORDER.map(k => { const n = base.filter(e => meta(e.id).eq === k).length; return n ? `<button class="chip2 ${libE === k ? 'sel' : ''}" data-lib="e" data-v="${k}">${esc(EQ[k])} <i>${n}</i></button>` : ''; }).join('')}</div>` : '';
  const G = libM ? groupsBy(list, e => meta(e.id).eq || 'C') : groupsBy(list, e => meta(e.id).m || 'Autres');
  const keys = libM ? EQ_ORDER.filter(k => G.has(k)) : [...MU, 'Autres'].filter(k => G.has(k));
  return `${pickBar()}<nav class="crumb"><button data-lib="home">Exercices</button><span>›</span><b>${esc(libM || EQ[libE])}</b></nav>
    <div class="lhero slim"><div><h1 class="bigt">${libM ? 'Exercices ' + esc(libM.toLowerCase()) : esc(EQ[libE])}</h1><p class="mute">${list.length} exercices${libM ? '' : ' avec ce matériel'}.</p></div>${libM ? `<div class="lh-body">${window.bodySvg(libM, { cls: 'mu-body' })}</div>` : ''}</div>
    ${chips}
    ${keys.map(k => `<section class="xsec"><h2 class="h2t">${libM ? EQ_ICON[k] + ' ' + esc(k === 'M' ? 'Machines guidées' : 'Avec ' + (EQ[k] || '').toLowerCase()) : esc(k)} <small>${G.get(k).length}</small></h2><div class="xgrid">${G.get(k).sort((a, b) => a.n.localeCompare(b.n, 'fr')).map(card).join('')}</div></section>`).join('')}`;
};
AFTER.lib = () => { freeUrls(); fillThumbs(); const q = document.querySelector('[data-lib=q]'); if (q && libQ) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } };

function addSheet(id) {
  const e = C().allEx().get(id), S = C().S(); if (!e) return;
  if (libPick != null) { quickAdd(id, libPick); return; }
  C().sheet(`<h2>Ajouter « ${esc(e.n)} »</h2><p class="tiny">${e.sets} séries × ${esc(e.reps)} · repos ${e.rest} s (modifiable ensuite)</p>
    ${S.draft ? `<button class="p wide" style="margin-top:10px" data-act="pickex" data-id="${esc(id)}" data-target="draft" data-si="">À la séance en cours</button>` : ''}
    <div class="sec">À un de mes modèles</div>
    <div class="addlist">${S.program.map((p, i) => { const has = p.ex.some(x => x.id === id); return `<button class="${has ? 'on' : ''}" ${has ? 'disabled' : `data-lib="addto" data-id="${esc(id)}" data-si="${i}"`}><b>${esc(p.name)}</b><small>${has ? '✓ déjà dedans' : p.ex.length + ' exercices'}</small></button>`; }).join('')}</div>
    <button class="ghost wide" style="margin-top:10px" data-close>Fermer</button>`);
}
function quickAdd(id, si) {
  const S = C().S(), e = C().allEx().get(id), p = S.program[si]; if (!e || !p) return;
  const i = p.ex.findIndex(x => x.id === id);
  if (i >= 0) { p.ex.splice(i, 1); C().toast('Retiré de ' + p.name); }
  else { const { m, eq, ...rest } = e; p.ex.push({ ...rest }); C().toast('Ajouté à ' + p.name); }
  C().save(); C().render();
}

/* ---------- fiche exercice ---------- */
const GX = [['reglages', 'Réglages de la machine', 'Ex. siège cran 4, dossier cran 2, poignées à hauteur du milieu des pecs'], ['execution', 'Exécution', 'Ex. omoplates serrées, pousse en 1 s, redescends en 2-3 s'], ['erreurs', 'Erreurs à éviter', 'Ex. ne pas décoller le dos, ne pas verrouiller les coudes'], ['respiration', 'Respiration et sensations', 'Ex. j\'expire en poussant ; je dois sentir les pecs, pas les épaules'], ['notes', 'Notes libres', 'Tout le reste']];
function guideOf(id) {
  const S = C().S(); S.guidex = S.guidex || {};
  return S.guidex[id] || (S.guides[id] ? { notes: S.guides[id] } : {});
}
function composeGuide(g) {
  const parts = GX.filter(([k]) => (g[k] || '').trim()).map(([k, l]) => k === 'notes' ? g[k].trim() : l.split(' ')[0] + ' : ' + g[k].trim());
  return parts.join('\n');
}
function chartSvg(H, key, unit) {
  if (H.length < 2) return '<p class="tiny">Encore une séance sur cet exercice pour voir la courbe.</p>';
  const v = H.map(h => h[key]), mn = Math.min(...v), mx = Math.max(...v), W = 640, Ht = 200, px = 40, py = 22;
  const X = i => px + i / (H.length - 1) * (W - 2 * px), Y = x => Ht - py - (mx === mn ? .5 : (x - mn) / (mx - mn)) * (Ht - 2 * py);
  return `<svg class="dchart" viewBox="0 0 ${W} ${Ht}"><line x1="${px}" x2="${W - px}" y1="${Ht - py}" y2="${Ht - py}" stroke="currentColor" opacity=".12"/>
    <path class="draw" d="${v.map((x, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(x).toFixed(1)).join('')}" fill="none" stroke="var(--acc)" stroke-width="3" stroke-linejoin="round"/>
    ${v.map((x, i) => `<circle cx="${X(i)}" cy="${Y(x)}" r="4.5" fill="var(--acc)"><title>${dS(H[i].s.start)} : ${fk(x)} ${unit}</title></circle>`).join('')}
    <text x="4" y="${Y(mx) + 4}" font-size="12" fill="currentColor">${fk(mx)}</text><text x="4" y="${Y(mn) + 4}" font-size="12" fill="currentColor" opacity=".6">${fk(mn)}</text>
    <text x="${px}" y="${Ht - 4}" font-size="11" fill="currentColor" opacity=".6">${dS(H[0].s.start)}</text><text x="${W - px}" y="${Ht - 4}" font-size="11" text-anchor="end" fill="currentColor" opacity=".6">${dS(H.at(-1).s.start)}</text></svg>`;
}
const CLAUDE_Q = [['tech', 'Explique-moi la technique parfaite, étape par étape'], ['reg', 'Aide-moi à bien régler la machine pour ma taille'], ['stag', 'Je stagne : qu\'est-ce que je change ?'], ['prog', 'Prépare-moi une progression sur 4 semaines'], ['alt', 'Par quoi le remplacer si la machine est prise ?']];
function exPrompt(id, q) {
  const e = C().allEx().get(id), m = meta(id), R = C().REC().get(id), H = exHist(id).slice(-8), g = composeGuide(guideOf(id));
  return `Tu es mon coach de musculation. ${meTxt()}\n\nExercice : ${e.n} (${m.m || '?'}, ${(window.EQUIP || {})[m.eq] || '?'}). Dans mon programme : ${e.sets} séries × ${e.reps}, repos ${e.rest} s.\n${R ? `Mon record : ${R.kg} kg × ${R.r || 1} (1RM estimé ${R.e1} kg).\n` : ''}${H.length ? 'Mes dernières séances sur cet exercice :\n' + H.map(h => `- ${dS(h.s.start)} : ${(h.e.sets || []).map(x => (x.t === 'e' ? 'échauff. ' : '') + fk(x.kg) + ' kg × ' + (x.r || '?')).join(', ')}`).join('\n') + '\n' : 'Pas encore d\'historique.\n'}${g ? 'Mon guide actuel :\n' + g + '\n' : ''}\nMa question : ${q}\n\nRéponds en français, tutoie-moi, sois concret et court. Si c'est utile, termine par un résumé de 3 lignes que je peux coller dans mon guide.`;
}
VIEWS.exo = () => {
  const id = exoId, e = C().allEx().get(id); if (!e) return VIEWS.lib();
  const m = meta(id), R = C().REC().get(id), H = exHist(id), g = guideOf(id), ins = inSessions(id), last = H.at(-1);
  const vars = all().filter(x => x.id !== id && meta(x.id).m === m.m).sort((a, b) => (meta(b.id).eq === m.eq) - (meta(a.id).eq === m.eq)).slice(0, 8);
  const toc = [['guide', 'Mon guide'], ['muscles', 'Muscles travaillés'], ['chiffres', 'Mes chiffres'], ['historique', 'Historique'], ['variantes', 'Variantes'], ['claude', 'Demander à Claude']];
  return `${pickBar()}<nav class="crumb"><button data-lib="home">Exercices</button><span>›</span>${m.m ? `<button data-lib="m" data-v="${esc(m.m)}">${esc(m.m)}</button><span>›</span>` : ''}<b>${esc(e.n)}</b></nav>
  <div class="exo-head">
    <div class="eh-t"><div class="kicker">${esc([m.m, (window.EQUIP || {})[m.eq]].filter(Boolean).join(' · '))}</div><h1 class="bigt">${esc(e.n)}</h1>
      ${m.tip ? `<p class="lead">${esc(m.tip)}</p>` : ''}
      <div class="chipsrow" style="margin:12px 0"><span class="chip2">${e.sets} × ${esc(e.reps)}</span><span class="chip2">Repos ${e.rest} s</span>${R ? `<span class="chip2">Record ${fk(R.kg)} kg × ${R.r || 1}</span>` : ''}${ins.map(n => `<span class="okchip">✓ ${esc(n)}</span>`).join('')}</div>
      <div class="row"><button class="p" data-lib="add" data-id="${esc(id)}">+ Ajouter à ma séance</button><label class="btn">Ajouter GIF, photo ou vidéo<input type="file" accept="image/*,video/*" multiple hidden data-add="${esc(id)}"></label></div></div>
    <div class="eh-media"><div class="media big" data-media="${esc(id)}"></div><div class="eh-empty" data-exempty>${window.bodySvg(m.m || 'Pecs', { cls: 'eh-body' })}<small>Ajoute ton GIF : il s'affichera aussi en haut du mode salle.</small></div></div>
  </div>
  <div class="exo-cols"><article class="exo-main">
    <section id="s-guide" class="tcard"><h2 class="h2s">Mon guide</h2><p class="tiny">Ce que tu écris ici s'affiche en bas du mode salle. Enregistré automatiquement.</p>
      <div class="gxgrid">${GX.map(([k, l, ph]) => `<label class="lbl">${l}<textarea rows="${k === 'notes' ? 3 : 2}" data-gx="${k}" data-id="${esc(id)}" placeholder="${esc(ph)}">${esc(g[k] || '')}</textarea></label>`).join('')}</div></section>
    <section id="s-muscles" class="tcard"><h2 class="h2s">Muscles travaillés</h2><div class="exmus">${window.bodySvg(m.m || 'Pecs', { cls: 'em-body' })}<div><b>${esc(m.m || '—')}</b><p class="small mute">${esc(MUSCLE_TXT[m.m] || '')}</p></div></div></section>
    <section id="s-chiffres" class="tcard"><h2 class="h2s">Mes chiffres</h2>
      <div class="kpis"><div><small>Record</small><b>${R ? fk(R.kg) + ' kg' : '—'}</b><em>${R ? '× ' + (R.r || 1) + ' · ' + dS(R.t) : ''}</em></div><div><small>1RM estimé</small><b>${R ? fk(R.e1) + ' kg' : '—'}</b><em>formule d'Epley</em></div><div><small>Séances</small><b>${H.length}</b><em>${last ? 'dernière : ' + dS(last.s.start) : ''}</em></div><div><small>Volume total</small><b>${fr(H.reduce((a, h) => a + h.vol, 0))} kg</b><em>kg × reps</em></div></div>
      <div class="between" style="margin-top:12px"><b class="small">Meilleure série à chaque séance (kg)</b></div>${chartSvg(H, 'e1' in (H[0] || {}) ? 'e1' : 'vol', 'kg')}<p class="tiny">Courbe du 1RM estimé : elle monte si tu soulèves plus lourd ou fais plus de reps.</p></section>
    <section id="s-historique" class="tcard"><h2 class="h2s">Historique</h2>${H.length ? `<table class="htab"><thead><tr><th>Date</th><th>Séance</th><th>Séries</th><th>Meilleure</th><th>Volume</th></tr></thead><tbody>${H.slice().reverse().slice(0, 30).map(h => `<tr><td>${dS(h.s.start)}</td><td>${esc(h.s.name)}</td><td class="sets">${(h.e.sets || []).map(x => `<span class="${x.t ? 'st-' + x.t : ''}">${fk(x.kg)}×${x.r || '?'}</span>`).join('')}</td><td><b>${fk(h.best.kg)} × ${h.best.r}</b></td><td>${fr(h.vol)} kg</td></tr>`).join('')}</tbody></table>` : '<p class="tiny">Pas encore fait. Il apparaîtra ici après ta première séance.</p>'}</section>
    <section id="s-variantes"><h2 class="h2t">Variantes pour les ${esc((m.m || '').toLowerCase())}</h2><div class="xgrid">${vars.map(card).join('')}</div></section>
    <section id="s-claude" class="tcard claudebox"><h2 class="h2s">Demander à Claude</h2><p class="tiny">Claude reçoit tes chiffres, ton guide et ton profil. La réponse s'ouvre dans Claude ; colle le résumé dans ton guide si tu veux le garder.</p>
      <div class="qgrid">${CLAUDE_Q.map(([k, l]) => `<button data-lib="ask" data-id="${esc(id)}" data-v="${esc(l)}">${esc(l)} →</button>`).join('')}</div>
      <div class="row" style="margin-top:10px"><input id="exask" class="grow" placeholder="Ta question sur cet exercice…"><button class="p" data-lib="askfree" data-id="${esc(id)}">Demander</button></div></section>
  </article>
  <aside class="toc"><div class="toc-in"><b>Sommaire</b>${toc.map(([k, l]) => `<a href="#s-${k}" data-toc="${k}">${l}</a>`).join('')}<hr><button class="p wide sm" data-lib="add" data-id="${esc(id)}">+ Ajouter à ma séance</button>${R ? `<div class="toc-rec"><small>Ton record</small><b>${fk(R.kg)} kg × ${R.r || 1}</b></div>` : ''}</div></aside></div>`;
};
const MUSCLE_TXT = { Pecs: 'Grand pectoral (faisceaux haut, milieu et bas), avec les deltoïdes avant et les triceps en soutien.', Dos: 'Grand dorsal, trapèzes, rhomboïdes et grand rond ; biceps et arrière d\'épaules en soutien.', 'Épaules': 'Deltoïdes avant, moyens et arrière ; trapèzes en soutien.', Biceps: 'Biceps brachial, brachial et brachio-radial.', Triceps: 'Les trois chefs du triceps (long, latéral, médial).', Quadriceps: 'Les quatre chefs du quadriceps, avec les fessiers en soutien.', Ischios: 'Biceps fémoral, semi-tendineux et semi-membraneux ; fessiers en soutien.', Fessiers: 'Grand, moyen et petit fessier ; ischios en soutien.', Mollets: 'Gastrocnémiens (jambe tendue) et soléaire (genou fléchi).', Abdos: 'Grand droit, obliques et transverse : la sangle qui protège ton dos.', 'Avant-bras': 'Fléchisseurs et extenseurs du poignet : la force de la prise.', Cardio: 'Cœur et endurance, avec les jambes surtout.' };
AFTER.exo = () => {
  freeUrls(); fillThumbs();
  const box = document.querySelector('.eh-media [data-media]');
  if (box) { const upd = () => { const has = !!box.querySelector('img,video'), em = document.querySelector('[data-exempty]'); box.hidden = !has; if (em) em.hidden = has; }; upd(); new MutationObserver(upd).observe(box, { childList: true, subtree: true }); window.CARNET_fillMedia(exoId); }
  const links = [...document.querySelectorAll('[data-toc]')];
  if (links.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(ents => { for (const en of ents) if (en.isIntersecting) for (const l of links) l.classList.toggle('on', l.dataset.toc === en.target.id.slice(2)); }, { rootMargin: '-30% 0px -60% 0px' });
    for (const l of links) { const s = document.getElementById('s-' + l.dataset.toc); if (s) io.observe(s); }
  }
};

/* ---------- programmes (tableau) ---------- */
VIEWS.progs = () => {
  const P = C().S().program; if (progSel && !P.some(p => p.id === progSel)) progSel = null;
  const est = s => { let sec = 0, n = 0; for (const e of s.ex) { n += +e.sets || 0; sec += (+e.sets || 0) * (45 + (+e.rest || 60)); } return { n, min: Math.round(sec / 60) }; };
  return `<div class="lhero slim"><div><div class="kicker">Entraînement</div><h1 class="bigt">Mes programmes</h1><p class="mute">Modifie tout directement dans les tableaux : séries, répétitions, repos, ordre (glisse les lignes).</p></div><button class="p" data-pg="new">+ Nouvelle séance</button></div>
  <div class="exo-cols"><div class="exo-main">${P.map((s, si) => { const t = est(s), ms = [...new Set(s.ex.map(e => meta(e.id).m).filter(Boolean))]; return `<section class="tcard pgcard" id="pg-${esc(s.id)}">
    <div class="pg-head"><div class="grow"><input class="title-in" value="${esc(s.name)}" data-pgf="name" data-si="${si}" aria-label="Nom de la séance"><input class="sub-in" value="${esc(s.sub || '')}" data-pgf="sub" data-si="${si}" placeholder="Description (facultatif)" aria-label="Description">
      <div class="chipsrow" style="margin-top:6px"><span class="chip2">${s.ex.length} exercices</span><span class="chip2">${t.n} séries</span><span class="chip2">≈ ${t.min} min</span>${ms.map(m => `<span class="chip2 soft">${esc(m)}</span>`).join('')}</div></div>
      <div class="pg-acts"><button class="p sm" data-act="start" data-sid="${esc(s.id)}">Lancer</button><button class="sm" data-pg="plan" data-si="${si}">Planifier</button><button class="sm ghost" data-pg="dup" data-si="${si}">Dupliquer</button><button class="sm ghost" data-pg="del" data-si="${si}">Supprimer</button></div></div>
    <table class="pgtab"><thead><tr><th></th><th>#</th><th>Exercice</th><th>Séries</th><th>Rép.</th><th>Repos (s)</th><th></th></tr></thead><tbody>
    ${s.ex.map((x, i) => `<tr draggable="true" data-drag="${si}:${i}"><td class="grip" title="Glisser pour déplacer">⋮⋮</td><td class="n">${i + 1}</td>
      <td><button class="pg-ex" data-lib="open" data-id="${esc(x.id)}"><span class="pg-th" data-th="${esc(x.id)}">${window.bodySvg(meta(x.id).m || 'Pecs', { one: true })}</span><span><b>${esc(x.n)}</b><small>${esc(meta(x.id).m || '')}${C().S().guides[x.id] ? ' · guide' : ''}</small></span></button></td>
      <td><input class="cell" inputmode="numeric" value="${x.sets}" data-pgx="sets" data-si="${si}" data-i="${i}" aria-label="Séries"></td>
      <td><input class="cell" value="${esc(x.reps)}" data-pgx="reps" data-si="${si}" data-i="${i}" aria-label="Répétitions"></td>
      <td><input class="cell" inputmode="numeric" value="${x.rest}" data-pgx="rest" data-si="${si}" data-i="${i}" aria-label="Repos en secondes"></td>
      <td class="acts"><button class="ib" data-pg="up" data-si="${si}" data-i="${i}" ${i ? '' : 'disabled'} aria-label="Monter">↑</button><button class="ib" data-pg="down" data-si="${si}" data-i="${i}" ${i < s.ex.length - 1 ? '' : 'disabled'} aria-label="Descendre">↓</button><button class="ib" data-pg="rm" data-si="${si}" data-i="${i}" aria-label="Retirer">✕</button></td></tr>`).join('') || `<tr><td colspan="7" class="tiny">Aucun exercice pour l'instant.</td></tr>`}
    </tbody></table>
    <div class="row" style="margin-top:10px"><button class="p sm" data-lib="pick" data-si="${si}">+ Choisir dans la bibliothèque</button><button class="sm" data-act="paddex" data-si="${si}">Chercher ou créer un exercice</button></div></section>`; }).join('')}</div>
  <aside class="toc"><div class="toc-in"><b>Sommaire</b>${P.map(s => `<a href="#pg-${esc(s.id)}">${esc(s.name)} <small>${s.ex.length}</small></a>`).join('')}<hr><button class="wide sm" data-pg="new">+ Nouvelle séance</button></div></aside></div>`;
};
AFTER.progs = () => { freeUrls(); fillThumbs(); };

/* ---------- analyses ---------- */
const FEEL = { 'Épuisé': '😵', 'Difficile': '😓', 'Correct': '🙂', 'En forme': '💪', 'Au top': '🔥' };
function anaGym(l) {
  const S = C().S(), before = gymLog().filter(x => x.start < l.start);
  const prevSame = before.filter(x => x.sid && x.sid === l.sid).at(-1);
  const rows = (l.ex || []).map(e => {
    const w = (e.sets || []).filter(x => x.t !== 'e'), vol = w.reduce((a, x) => a + num(x.kg) * (+x.r || 0), 0);
    const best = w.reduce((b, x) => (num(x.kg) > b.kg || (num(x.kg) === b.kg && (+x.r || 0) > b.r)) ? { kg: num(x.kg), r: +x.r || 0 } : b, { kg: 0, r: 0 });
    const pv = before.filter(x => (x.ex || []).some(y => y.id === e.id)).at(-1), pe = pv && pv.ex.find(y => y.id === e.id);
    const pw = pe ? (pe.sets || []).filter(x => x.t !== 'e') : [], pbest = pw.reduce((b, x) => (num(x.kg) > b.kg || (num(x.kg) === b.kg && (+x.r || 0) > b.r)) ? { kg: num(x.kg), r: +x.r || 0 } : b, { kg: 0, r: 0 });
    const pvol = pw.reduce((a, x) => a + num(x.kg) * (+x.r || 0), 0);
    const e1 = best.kg * (1 + best.r / 30), pe1 = pbest.kg * (1 + pbest.r / 30), d = pe ? e1 - pe1 : null;
    return { e, w, vol, best, pbest, pvol, pv, d, m: meta(e.id).m || 'Autres', pr: (l.prs || []).includes(e.n) };
  });
  const vol = rows.reduce((a, r) => a + r.vol, 0), nsets = rows.reduce((a, r) => a + r.w.length, 0), dur = (l.end - l.start) / 1000;
  const pvol = prevSame ? (prevSame.vol || 0) : 0, dv = pvol ? (vol - pvol) / pvol * 100 : null;
  const byM = new Map(); for (const r of rows) byM.set(r.m, (byM.get(r.m) || 0) + r.vol);
  const mx = Math.max(1, ...byM.values());
  const notes = [];
  for (const r of rows.filter(r => r.pr)) notes.push(['🏆', `Nouveau record sur <b>${esc(r.e.n)}</b> : ${fk(r.best.kg)} kg × ${r.best.r}.`]);
  const ups = rows.filter(r => r.d > 0.5 && !r.pr), downs = rows.filter(r => r.d < -0.5);
  if (ups.length) notes.push(['📈', `En progrès sur ${ups.map(r => '<b>' + esc(r.e.n) + '</b>').join(', ')} par rapport à la dernière fois.`]);
  if (downs.length) notes.push(['📉', `Moins fort sur ${downs.map(r => '<b>' + esc(r.e.n) + '</b>').join(', ')}. Une mauvaise nuit ou un repas léger suffit ; si ça dure 3 séances, allège de 10 % et remonte.`]);
  if (dv != null) notes.push([dv >= 0 ? '💪' : '🔻', `Volume ${dv >= 0 ? 'en hausse' : 'en baisse'} de ${fr(Math.abs(dv))} % par rapport à ta dernière séance ${esc(l.name)} (${fr(pvol)} kg).`]);
  if (dur > 6000) notes.push(['⏱️', `Séance de ${hms(dur)} : au-delà de 1 h 30, la qualité baisse souvent. Surveille tes temps de repos.`]);
  const stag = window.PROG ? window.PROG.stagnantList().filter(x => rows.some(r => r.e.id === x.id)) : [];
  for (const x of stag) notes.push(['⚠️', `${esc((rows.find(r => r.e.id === x.id) || {}).e?.n || '')} : ${esc(x.s.msg)}`]);
  if (l.feel) notes.push([FEEL[l.feel] || '🙂', `Ressenti : ${esc(l.feel)}.${l.note ? ' « ' + esc(l.note) + ' »' : ''}`]);
  if (!notes.length) notes.push(['✅', 'Séance enregistrée. Refais-la pour voir ta progression exercice par exercice.']);
  const sameH = gymLog().filter(x => x.sid && x.sid === l.sid && x.start <= l.start).slice(-12).map(x => ({ s: x, vol: x.vol || 0 }));
  const prompt = `Tu es mon coach. ${meTxt()}\n\nAnalyse ma séance « ${l.name} » du ${dL(l.start)} (${hms(dur)}, ${fr(vol)} kg de volume, ${nsets} séries${l.feel ? ', ressenti : ' + l.feel : ''}${l.note ? ', note : ' + l.note : ''}).\n` + rows.map(r => `- ${r.e.n} : ${r.w.map(x => fk(x.kg) + '×' + (x.r || '?')).join(', ')}${r.pv ? ` (dernière fois le ${dS(r.pv.start)} : ${(r.pv.ex.find(y => y.id === r.e.id).sets || []).filter(x => x.t !== 'e').map(x => fk(x.kg) + '×' + (x.r || '?')).join(', ')})` : ''}`).join('\n') + '\n\nDis-moi ce qui est bien, ce que je dois changer à la prochaine séance (charges exo par exo) et un conseil récup/nutrition. Réponds en français, tutoie-moi, sois concret.';
  return `<div class="kpis big"><div><small>Durée</small><b>${hms(dur)}</b></div><div><small>Volume</small><b>${fr(vol)} kg</b><em>${dv != null ? (dv >= 0 ? '+' : '') + fr(dv) + ' % vs dernière' : ''}</em></div><div><small>Séries</small><b>${nsets}</b><em>${rows.length} exercices</em></div><div><small>Records</small><b>${(l.prs || []).length}</b><em>${l.feel ? (FEEL[l.feel] || '') + ' ' + esc(l.feel) : ''}</em></div></div>
  <div class="anagrid"><section class="tcard"><h2 class="h2s">Le verdict</h2><ul class="verdict">${notes.map(([i, t]) => `<li><span>${i}</span><p>${t}</p></li>`).join('')}</ul></section>
    <section class="tcard"><h2 class="h2s">Volume par muscle</h2>${[...byM].sort((a, b) => b[1] - a[1]).map(([m, v]) => `<div class="hbar"><span>${esc(m)}</span><i><b style="width:${v / mx * 100}%"></b></i><em>${fr(v)} kg</em></div>`).join('')}</section></div>
  <section class="tcard"><h2 class="h2s">Exercice par exercice</h2><table class="htab"><thead><tr><th>Exercice</th><th>Séries</th><th>Meilleure</th><th>Dernière fois</th><th>Évolution</th><th>Volume</th></tr></thead><tbody>
    ${rows.map(r => `<tr><td><button class="link" data-lib="open" data-id="${esc(r.e.id)}">${esc(r.e.n)}</button>${r.pr ? ' <span class="okchip">PR</span>' : ''}</td><td class="sets">${(r.e.sets || []).map(x => `<span class="${x.t ? 'st-' + x.t : ''}">${fk(x.kg)}×${x.r || '?'}</span>`).join('')}</td><td><b>${fk(r.best.kg)} × ${r.best.r}</b></td><td>${r.pv ? fk(r.pbest.kg) + ' × ' + r.pbest.r + ' <small class="mute">(' + dS(r.pv.start) + ')</small>' : '<small class="mute">première fois</small>'}</td><td>${r.d == null ? '—' : r.d > 0.5 ? '<b class="up">▲ +' + fk(r.d) + ' kg</b>' : r.d < -0.5 ? '<b class="down">▼ ' + fk(r.d) + ' kg</b>' : '<span class="mute">= stable</span>'}</td><td>${fr(r.vol)} kg</td></tr>`).join('')}</tbody></table>
    <p class="tiny">Évolution = différence de 1RM estimé (charge et reps combinées) avec la dernière fois que tu as fait l'exercice.</p></section>
  ${sameH.length > 1 ? `<section class="tcard"><h2 class="h2s">Volume de « ${esc(l.name)} » au fil des séances</h2>${chartSvg(sameH, 'vol', 'kg')}</section>` : ''}
  ${claudeBox(prompt, 'Analyse ma séance avec Claude')}`;
}
function anaCardio(l) {
  const S = C().S(), run = l.kind === 'run', same = S.log.filter(x => x.kind === l.kind && x.km), before = same.filter(x => x.start < l.start), goal = window.PROFILE.goal();
  const notes = [];
  if (run) {
    const p = l.pace || l.sec / l.km, d = goal ? p - goal : 0, prev5 = before.slice(-5).filter(x => x.pace), avg = prev5.length ? prev5.reduce((a, x) => a + x.pace, 0) / prev5.length : null;
    notes.push(goal ? [d <= 0 ? '🎯' : '🏃', d <= 0 ? `Allure de <b>${mmss(p)}/km</b> : objectif ${mmss(goal)} atteint !` : `Allure de <b>${mmss(p)}/km</b>, soit ${Math.round(d)} s/km de plus que ton objectif ${mmss(goal)}.`] : ['🏃', `Allure moyenne de <b>${mmss(p)}/km</b>.`]);
    if (avg) notes.push([p < avg ? '📈' : '📉', `${p < avg ? 'Plus rapide' : 'Plus lent'} que la moyenne de tes 5 sorties précédentes (${mmss(avg)}/km) de ${Math.round(Math.abs(avg - p))} s/km.`]);
    if (l.km >= 3) { const t10 = l.sec * Math.pow(10 / l.km, 1.06); const b10 = S.log.filter(x => x.kind === 'run' && x.km >= 9.9 && x.km <= 10.6 && x.start < l.start).reduce((m, x) => Math.min(m, x.sec / x.km * 10), Infinity); notes.push(['🔮', `À ce rythme, ton 10 km théorique serait d'environ <b>${mmss(t10)}</b>${isFinite(b10) ? ` (ton meilleur 10 km : ${mmss(b10)})` : ''}.`]); }
    if (l.hr) notes.push(['❤️', `Fréquence cardiaque moyenne : ${l.hr} bpm.${l.hr > 175 ? ' Assez haut : garde la majorité de tes sorties en aisance respiratoire.' : ''}`]);
  } else {
    const avg = before.slice(-5).filter(x => x.kmh), a = avg.length ? avg.reduce((s, x) => s + x.kmh, 0) / avg.length : null;
    notes.push(['🚴', `${fr(l.km, 1)} km à <b>${fr(l.kmh || l.km / (l.sec / 3600), 1)} km/h</b> de moyenne, ${l.elev || 0} m de dénivelé.`]);
    if (a) notes.push([l.kmh > a ? '📈' : '📉', `${l.kmh > a ? 'Plus rapide' : 'Plus lent'} que tes 5 dernières sorties (${fr(a, 1)} km/h).`]);
    if (l.elev && l.km) notes.push(['⛰️', `${Math.round(l.elev / l.km)} m de D+ par km${l.elev / l.km > 12 ? ' : une vraie sortie de grimpeur !' : '.'}`]);
  }
  const H = [...before.slice(-11), l], vals = H.map(x => run ? (x.pace || x.sec / x.km) : (x.kmh || x.km / (x.sec / 3600)));
  const W = 900, Ht = 240, L = 50, R = 14, T = 26, B = 40, cw = (W - L - R) / H.length, bw = Math.min(46, cw * .62);
  const lo = run ? Math.min(...vals, goal || Infinity) - 15 : 0, hi = run ? Math.max(...vals) + 10 : Math.max(...vals) * 1.15;
  const bh = v => run ? (hi - v) / (hi - lo) * (Ht - T - B) : v / hi * (Ht - T - B);
  const chart = H.length > 1 ? `<svg class="dchart" viewBox="0 0 ${W} ${Ht}">${H.map((x, i) => { const v = vals[i], h = Math.max(4, bh(v)), xx = L + i * cw + (cw - bw) / 2, y = Ht - B - h, me = x === l; return `<rect x="${xx}" y="${y}" width="${bw}" height="${h}" rx="6" fill="${me ? 'var(--acc)' : 'currentColor'}" opacity="${me ? 1 : .18}"><title>${esc(x.name)}</title></rect><text x="${xx + bw / 2}" y="${y - 6}" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor">${run ? mmss(v) : fr(v, 1)}</text><text x="${xx + bw / 2}" y="${Ht - B + 16}" text-anchor="middle" font-size="11" fill="currentColor" opacity=".6">${dS(x.start)}</text><text x="${xx + bw / 2}" y="${Ht - B + 30}" text-anchor="middle" font-size="10" fill="currentColor" opacity=".45">${fr(x.km, 1)} km</text>`; }).join('')}
    ${run && goal ? `<line x1="${L}" x2="${W - R}" y1="${Ht - B - bh(goal)}" y2="${Ht - B - bh(goal)}" stroke="#16a34a" stroke-width="2" stroke-dasharray="6 5"/><text x="${L - 6}" y="${Ht - B - bh(goal) + 4}" text-anchor="end" font-size="11" font-weight="700" fill="#16a34a">${mmss(goal)}</text>` : ''}</svg>
    <p class="tiny">${run ? 'Allure moyenne (min/km) de tes dernières courses : plus la barre est haute, plus tu étais rapide. ' + (goal ? 'La ligne verte, c\'est ton objectif.' : '') : 'Vitesse moyenne (km/h) de tes dernières sorties.'} En orange : cette sortie.</p>` : '';
  const prompt = `Tu es mon coach ${run ? 'course à pied' : 'vélo de route'}. ${meTxt()}\n\nAnalyse ma sortie « ${l.name} » du ${dL(l.start)} : ${fr(l.km, 2)} km en ${hms(l.sec)}${run ? `, allure ${mmss(l.pace || l.sec / l.km)}/km` : `, ${fr(l.kmh, 1)} km/h`}, ${l.elev || 0} m D+${l.hr ? ', FC moyenne ' + l.hr + ' bpm' : ''}.\nMes sorties précédentes :\n${before.slice(-8).map(x => `- ${dS(x.start)} : ${fr(x.km, 1)} km, ${run ? mmss(x.pace || x.sec / x.km) + '/km' : fr(x.kmh, 1) + ' km/h'}`).join('\n') || '- aucune'}\n\nDis-moi ce que tu en penses et propose ma prochaine sortie précise. Réponds en français, tutoie-moi.`;
  const strava = (l.src === 'strava' || l.src === 'file') && window.ACT;
  return `${strava ? window.ACT.shell(l) : `<div class="kpis big"><div><small>Distance</small><b>${fr(l.km, 2)} km</b></div><div><small>Durée</small><b>${hms(l.sec)}</b></div><div><small>${run ? 'Allure' : 'Vitesse'}</small><b>${run ? mmss(l.pace || l.sec / l.km) + '/km' : fr(l.kmh, 1) + ' km/h'}</b></div><div><small>Dénivelé</small><b>${l.elev || 0} m</b><em>${l.hr ? '❤️ ' + l.hr + ' bpm' : ''}</em></div></div>`}
  <section class="tcard"><h2 class="h2s">Le verdict</h2><ul class="verdict">${notes.map(([i, t]) => `<li><span>${i}</span><p>${t}</p></li>`).join('')}</ul></section>
  <section class="tcard"><h2 class="h2s">Comparé à tes ${H.length - 1} dernières ${run ? 'courses' : 'sorties'}</h2>${chart || '<p class="tiny">Pas encore assez de sorties pour comparer.</p>'}</section>
  ${claudeBox(prompt, 'Analyse ma sortie avec Claude')}`;
}
function claudeBox(prompt, label) {
  window.__anaPrompt = prompt;
  return `<section class="tcard claudebox"><h2 class="h2s">Aller plus loin avec Claude</h2><p class="tiny">Claude reçoit toutes les données de cette séance, ton historique et ton profil.</p>
    <div class="row"><button class="p" data-lib="anaask">${label} →</button></div><div class="row" style="margin-top:10px"><input id="anaq" class="grow" placeholder="Ou pose ta propre question sur cette séance…"><button data-lib="anaaskq">Demander</button></div></section>`;
}
VIEWS.ana = () => {
  const S = C().S(), L = S.log.slice().sort((a, b) => b.start - a.start);
  const l = anaId && S.log.find(x => x.id === anaId);
  const kindIcon = x => x.kind === 'run' ? '🏃' : x.kind === 'bike' ? '🚴' : '🏋️';
  const side = `<aside class="toc"><div class="toc-in"><b>Mes activités</b><div class="alist">${L.slice(0, 40).map(x => `<button class="${l && x.id === l.id ? 'on' : ''}" data-lib="ana" data-id="${esc(x.id)}"><span>${kindIcon(x)}</span><span><b>${esc(x.name)}</b><small>${dS(x.start)}${x.km ? ' · ' + fr(x.km, 1) + ' km' : x.vol ? ' · ' + fr(x.vol) + ' kg' : ''}</small></span></button>`).join('') || '<p class="tiny">Aucune activité.</p>'}</div></div></aside>`;
  if (!l) return `<div class="lhero slim"><div><div class="kicker">Analyses</div><h1 class="bigt">Choisis une activité</h1><p class="mute">Séances de muscu, courses et sorties vélo : chaque activité a son analyse détaillée.</p></div></div><div class="exo-cols"><div class="exo-main">${L.slice(0, 9).map(x => `<button class="acard" data-lib="ana" data-id="${esc(x.id)}"><span>${kindIcon(x)}</span><span><b>${esc(x.name)}</b><small>${dL(x.start)}</small></span><em>${x.km ? fr(x.km, 1) + ' km' : fr(x.vol || 0) + ' kg'}</em></button>`).join('')}</div>${side}</div>`;
  return `<nav class="crumb">${anaFrom === 'progress' ? '<button data-act="goto" data-v="progress">← Journal</button><span>·</span>' : ''}<button data-lib="ana" data-id="">Analyses</button><span>›</span><b>${esc(l.name)}</b></nav>
    <div class="lhero slim"><div><div class="kicker">${kindIcon(l)} ${esc(dL(l.start))}</div><h1 class="bigt">${esc(l.name)}</h1>${window.SYNC && window.SYNC.on() ? `<button class="sm ${l.hide ? '' : 'ghost'}" data-so="hide" data-id="${esc(l.id)}">${l.hide ? '🔒 Masquée pour mes amis · Afficher' : '👥 Visible par mes amis · Masquer'}</button>` : ''}</div>${l.sid ? `<button class="p" data-act="start" data-sid="${esc(l.sid)}">Refaire cette séance</button>` : l.src === 'strava' ? `<a class="btn" href="https://www.strava.com/activities/${esc(String(l.id).replace('strava_', ''))}" target="_blank" rel="noopener">Voir sur Strava</a>` : ''}</div>
    <div class="exo-cols"><div class="exo-main">${l.kind === 'run' || l.kind === 'bike' ? anaCardio(l) : anaGym(l)}</div>${side}</div>`;
};
AFTER.ana = () => { if (window.ACT) window.ACT.fill(); };
VIEWS.anaOpen = id => { anaId = id; };

/* ---------- événements ---------- */
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-lib],[data-pg]'); if (!b || !window.CARNET) return;
  const S = C().S();
  if (b.dataset.pg) {
    const si = +b.dataset.si, i = +b.dataset.i, s = S.program[si];
    switch (b.dataset.pg) {
      case 'new': { const id = 's_' + Date.now().toString(36); S.program.push({ id, name: 'Nouvelle séance', sub: '', ex: [] }); C().save(); C().render(); setTimeout(() => document.getElementById('pg-' + id)?.scrollIntoView({ behavior: 'smooth' }), 50); return; }
      case 'up': case 'down': { const j = i + (b.dataset.pg === 'up' ? -1 : 1); [s.ex[i], s.ex[j]] = [s.ex[j], s.ex[i]]; break; }
      case 'rm': if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = '?'; b.title = 'Cliquer encore pour retirer'; return; } s.ex.splice(i, 1); break;
      case 'dup': S.program.splice(si + 1, 0, { ...JSON.parse(JSON.stringify(s)), id: 's_' + Date.now().toString(36), name: s.name + ' (copie)', kind: '' }); C().toast('Séance dupliquée'); break;
      case 'del': if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Sûr ?'; return; } S.plans = (S.plans || []).filter(p => p.sid !== s.id); S.program.splice(si, 1); break;
      case 'plan': C().planNew(s.id); return;
    }
    C().save(); C().render(); return;
  }
  const id = b.dataset.id;
  switch (b.dataset.lib) {
    case 'home': libM = ''; libE = ''; libQ = ''; C().go('lib'); return;
    case 'm': libM = b.dataset.v; libE = ''; libQ = ''; C().go('lib'); return;
    case 'e': libE = b.dataset.v; libQ = ''; if (!libM && !libE) libE = ''; C().go('lib'); return;
    case 'qq': libQ = b.dataset.v; C().render(); return;
    case 'open': ev.preventDefault(); exoId = id; C().go('exo'); return;
    case 'add': addSheet(id); return;
    case 'addto': quickAdd(id, +b.dataset.si); C().closeSheet(); return;
    case 'pick': libPick = +b.dataset.si; libM = ''; libE = ''; libQ = ''; C().go('lib'); return;
    case 'pickdone': { const s = S.program[libPick]; libPick = null; C().go('progs'); if (s) setTimeout(() => document.getElementById('pg-' + s.id)?.scrollIntoView(), 50); return; }
    case 'ask': askClaude(exPrompt(id, b.dataset.v)); return;
    case 'askfree': { const q = (document.getElementById('exask').value || '').trim(); if (!q) { C().toast('Écris ta question'); return; } askClaude(exPrompt(id, q)); return; }
    case 'ana': anaId = id || null; if (!id) anaFrom = null; C().go('ana'); return;
    case 'anaask': askClaude(window.__anaPrompt || ''); return;
    case 'anaaskq': { const q = (document.getElementById('anaq').value || '').trim(); if (!q) { C().toast('Écris ta question'); return; } askClaude((window.__anaPrompt || '').replace(/\n\n[^\n]*$/, '') + '\n\nMa question : ' + q + '\nRéponds en français, tutoie-moi.'); return; }
  }
});
let qTimer = null;
document.addEventListener('input', ev => {
  const t = ev.target; if (!window.CARNET) return;
  if (t.dataset.lib === 'q') { clearTimeout(qTimer); qTimer = setTimeout(() => { libQ = t.value.trim(); C().render(); }, 220); return; }
  if (t.dataset.gx) { const S = C().S(), id = t.dataset.id; S.guidex = S.guidex || {}; const g = { ...guideOf(id), [t.dataset.gx]: t.value }; S.guidex[id] = g; const txt = composeGuide(g); if (txt) S.guides[id] = txt; else delete S.guides[id]; C().save(); return; }
  if (t.dataset.pgf) { const s = C().S().program[+t.dataset.si]; if (s) { s[t.dataset.pgf] = t.value; C().save(); } return; }
});
document.addEventListener('change', ev => {
  const t = ev.target; if (!t.dataset.pgx || !window.CARNET) return;
  const x = C().S().program[+t.dataset.si]?.ex[+t.dataset.i]; if (!x) return;
  const k = t.dataset.pgx, v = t.value.trim();
  if (k === 'sets') x.sets = Math.max(1, Math.min(12, parseInt(v) || x.sets));
  else if (k === 'rest') x.rest = Math.max(10, Math.min(900, parseInt(v) || x.rest));
  else if (v) x.reps = v;
  C().save(); C().render();
});
document.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target.id === 'exask') document.querySelector('[data-lib=askfree]')?.click(); if (ev.key === 'Enter' && ev.target.id === 'anaq') document.querySelector('[data-lib=anaaskq]')?.click(); });
// glisser-déposer des lignes du tableau
let drag = null;
document.addEventListener('dragstart', ev => { const r = ev.target.closest && ev.target.closest('[data-drag]'); if (!r) return; drag = r.dataset.drag; r.classList.add('dragging'); ev.dataTransfer.effectAllowed = 'move'; try { ev.dataTransfer.setData('text/plain', drag); } catch (e) { } });
document.addEventListener('dragover', ev => { const r = ev.target.closest && ev.target.closest('[data-drag]'); if (!r || !drag || r.dataset.drag.split(':')[0] !== drag.split(':')[0]) return; ev.preventDefault(); for (const x of document.querySelectorAll('.dropover')) x.classList.remove('dropover'); r.classList.add('dropover'); });
document.addEventListener('drop', ev => {
  const r = ev.target.closest && ev.target.closest('[data-drag]'); if (!r || !drag) return; ev.preventDefault();
  const [si, from] = drag.split(':').map(Number), to = +r.dataset.drag.split(':')[1], s = C().S().program[si];
  if (s && r.dataset.drag.split(':')[0] == si && from !== to) { const [x] = s.ex.splice(from, 1); s.ex.splice(to, 0, x); C().save(); }
  drag = null; C().render();
});
document.addEventListener('dragend', () => { drag = null; for (const x of document.querySelectorAll('.dragging,.dropover')) x.classList.remove('dragging', 'dropover'); });

document.addEventListener('click', ev => { const nb = ev.target.closest('#nav button'); if (!nb) return; const v = nb.dataset.view; if (v === 'ana') anaId = null; if (v === 'lib') { libM = ''; libE = ''; libQ = ''; } if (v === 'progs') libPick = null; }, true);
window.DESK = { isDesk, openEx: id => { exoId = id; C().go('exo'); }, openAna: (id, from) => { anaId = id; anaFrom = from || null; C().go('ana'); } };
}
