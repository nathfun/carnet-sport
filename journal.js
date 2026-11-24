'use strict';
/* Journal : résumé, exercices, calendrier, chiffres, badges. Défis du mois. Badges illustrés. */
{
const C = () => window.CARNET;
const VIEWS = window.VIEWS = window.VIEWS || {}, AFTER = window.AFTER = window.AFTER || {};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fr = (v, d = 0) => Number(v).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
const fk = v => fr(v, Math.round(v * 10) % 10 ? 1 : 0);
const dS = t => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const dL = t => new Date(t).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const mmin = l => Math.max(1, Math.round((l.end - l.start) / 60000));
const gym = () => C().S().log.filter(l => l.kind !== 'run' && l.kind !== 'bike');
const monthKey = t => { const d = new Date(t); return d.getFullYear() + '-' + (d.getMonth() + 1); };

/* ---------- stats communes ---------- */
function stats() {
  const S = C().S(), L = gym(), REC = C().REC();
  const ton = L.reduce((a, s) => a + (s.vol || 0), 0), prs = L.reduce((a, s) => a + (s.prs || []).length, 0);
  const maxKg = Math.max(0, ...[...REC.values()].map(r => r.kg)), maxVol = Math.max(0, ...L.map(s => s.vol || 0));
  const wk = new Map(); for (const s of L) { const d = new Date(s.start); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); wk.set(d.getTime(), (wk.get(d.getTime()) || 0) + 1); }
  return { n: L.length, ton, prs, maxKg, maxVol, best: S.best || 0, maxWeek: Math.max(0, ...wk.values()), exos: new Set(L.flatMap(s => (s.ex || []).map(e => e.id))).size,
    early: L.some(s => new Date(s.start).getHours() < 8), late: L.some(s => new Date(s.start).getHours() >= 21), long: L.some(s => s.end - s.start >= 5400e3),
    weigh: (S.body && S.body.weights || []).length, meas: (S.body && S.body.meas || []).length, defis: (S.challenges || []).length, cardio: S.log.filter(l => l.kind === 'run' || l.kind === 'bike').length,
    feel: L.filter(s => s.feel === 'Au top').length, wkend: L.filter(s => [0, 6].includes(new Date(s.start).getDay())).length };
}
/* ---------- badges (≈ 40, du bronze au platine) ---------- */
const B = (id, f, t, i, n, d, key, goal) => ({ id, f, t, i, n, d, key, goal });
window.BADGES2 = [
  B('first', 'Séances', 1, '🎯', 'Première séance', 'Termine ta toute première séance.', 'n', 1), B('s5', 'Séances', 1, '🏋️', 'Lancé', '5 séances terminées.', 'n', 5),
  B('s10', 'Séances', 1, '💪', 'Habitué', '10 séances terminées.', 'n', 10), B('s25', 'Séances', 2, '🦾', 'Pilier de salle', '25 séances terminées.', 'n', 25),
  B('s50', 'Séances', 3, '🏟️', 'Machine', '50 séances terminées.', 'n', 50), B('s100', 'Séances', 4, '👑', 'Centurion', '100 séances terminées.', 'n', 100),
  B('s200', 'Séances', 4, '🗿', 'Légende', '200 séances terminées.', 'n', 200),
  B('w2', 'Flamme', 1, '🕯️', 'Étincelle', '2 semaines de suite à la salle.', 'best', 2), B('w4', 'Flamme', 1, '🔥', 'Un mois sans lâcher', '4 semaines de suite.', 'best', 4),
  B('w8', 'Flamme', 2, '🌋', 'En feu', '8 semaines de suite.', 'best', 8), B('w12', 'Flamme', 3, '☄️', 'Trimestre de feu', '12 semaines de suite.', 'best', 12),
  B('w26', 'Flamme', 4, '🌞', 'Six mois de feu', '26 semaines de suite.', 'best', 26), B('w52', 'Flamme', 4, '🐉', 'Une année entière', '52 semaines de suite.', 'best', 52),
  B('t1', 'Tonnage', 1, '🚗', 'Une voiture', '1,5 tonne soulevée au total.', 'ton', 1500), B('t10', 'Tonnage', 1, '🐘', 'Un éléphant', '6 tonnes soulevées.', 'ton', 6000),
  B('t50', 'Tonnage', 2, '🚚', 'Un camion', '20 tonnes soulevées.', 'ton', 20000), B('t100', 'Tonnage', 3, '✈️', 'Un avion de ligne', '80 tonnes soulevées.', 'ton', 80000),
  B('t150', 'Tonnage', 4, '🐋', 'Une baleine bleue', '150 tonnes soulevées.', 'ton', 150000), B('v5', 'Tonnage', 2, '💥', 'Grosse séance', '5 000 kg en une seule séance.', 'maxVol', 5000),
  B('pr1', 'Records', 1, '🏅', 'Premier record', 'Bats un de tes records.', 'prs', 1), B('pr5', 'Records', 1, '🏆', 'Collectionneur', '5 records battus.', 'prs', 5),
  B('pr10', 'Records', 2, '🚀', 'Fusée', '10 records battus.', 'prs', 10), B('pr25', 'Records', 3, '⚡', 'Inarrêtable', '25 records battus.', 'prs', 25), B('pr50', 'Records', 4, '🌟', 'Étoile', '50 records battus.', 'prs', 50),
  B('k50', 'Force', 1, '🥉', 'Club des 50 kg', '50 kg sur un exercice.', 'maxKg', 50), B('k80', 'Force', 2, '🥈', 'Club des 80 kg', '80 kg sur un exercice.', 'maxKg', 80),
  B('k100', 'Force', 3, '🥇', 'Club des 100 kg', '100 kg sur un exercice.', 'maxKg', 100), B('k150', 'Force', 4, '🦍', 'Club des 150 kg', '150 kg sur un exercice.', 'maxKg', 150),
  B('wk3', 'Régularité', 1, '📅', 'Belle semaine', '3 séances dans la même semaine.', 'maxWeek', 3), B('wk5', 'Régularité', 3, '🗓️', 'Semaine de feu', '5 séances dans la même semaine.', 'maxWeek', 5),
  B('early', 'Régularité', 2, '🌅', 'Lève-tôt', 'Une séance commencée avant 8 h.', 'early', 1), B('late', 'Régularité', 2, '🌙', 'Oiseau de nuit', 'Une séance commencée après 21 h.', 'late', 1),
  B('long', 'Régularité', 2, '⏱️', 'Marathonien de la fonte', 'Une séance de 1 h 30.', 'long', 1), B('wkend', 'Régularité', 1, '🛋️', 'Pas de week-end', '5 séances le week-end.', 'wkend', 5),
  B('ex10', 'Variété', 1, '🧩', 'Curieux', '10 exercices différents.', 'exos', 10), B('ex25', 'Variété', 2, '🧠', 'Encyclopédie', '25 exercices différents.', 'exos', 25),
  B('weigh', 'Corps', 1, '⚖️', 'Première pesée', 'Note ton poids dans Mon corps.', 'weigh', 1), B('meas', 'Corps', 2, '📏', 'Suivi au millimètre', '5 mesures notées.', 'meas', 5),
  B('top', 'Corps', 2, '🤩', 'Au top', '5 séances notées « Au top ».', 'feel', 5), B('cardio', 'Cardio', 1, '🚴', 'Cardio noté', 'Une sortie course ou vélo notée.', 'cardio', 1),
  B('defi1', 'Défis', 2, '🎖️', 'Premier défi', 'Réussis un défi du mois.', 'defis', 1), B('defi3', 'Défis', 3, '🎗️', 'Trois défis', '3 défis du mois réussis.', 'defis', 3), B('defi6', 'Défis', 4, '💎', 'Six défis', '6 défis du mois réussis.', 'defis', 6)
].map(b => ({ ...b, ok: () => { const v = stats()[b.key]; return (v === true ? 1 : +v || 0) >= b.goal; }, prog: st => Math.min(1, ((st[b.key] === true ? 1 : +st[b.key] || 0)) / b.goal) }));
const TIER = ['', 'Bronze', 'Argent', 'Or', 'Platine'];
window.medal = (b, on, size = '') => `<div class="medal ${on ? 't' + b.t : 'lock'} ${size}"><div class="m-disc"><span>${b.i}</span></div><b>${esc(b.n)}</b></div>`;
window.showBadge = list => {
  if (!list || !list.length) return; const b = list[0];
  const o = document.createElement('div'); o.className = 'unlock'; o.innerHTML = `<div class="u-in"><div class="u-rays"></div>${window.medal(b, true, 'big')}<small>${TIER[b.t]} · ${esc(b.f)}</small><h2>Badge débloqué</h2><p>${esc(b.d)}</p><button class="es-main">Super</button></div>`;
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('show'));
  try { navigator.vibrate && navigator.vibrate([60, 40, 120]); } catch (e) { }
  o.addEventListener('click', e => { if (!e.target.closest('button') && e.target !== o) return; o.classList.remove('show'); setTimeout(() => { o.remove(); window.showBadge(list.slice(1)); }, 300); });
};

/* ---------- défi du mois ---------- */
const CH = [
  { n: '12 séances', d: '12 séances de muscu ce mois-ci.', g: 12, f: L => L.length, u: '' }, { n: '5 tonnes soulevées', d: '5 000 kg cumulés ce mois-ci.', g: 5000, f: L => L.reduce((a, s) => a + (s.vol || 0), 0), u: ' kg' },
  { n: '4 records', d: 'Bats 4 records ce mois-ci.', g: 4, f: L => L.reduce((a, s) => a + (s.prs || []).length, 0), u: '' }, { n: '150 séries', d: '150 séries validées ce mois-ci.', g: 150, f: L => L.reduce((a, s) => a + (s.ex || []).reduce((b, e) => b + e.sets.length, 0), 0), u: '' },
  { n: '10 heures de fonte', d: '600 minutes à la salle ce mois-ci.', g: 600, f: L => L.reduce((a, s) => a + mmin(s), 0), u: ' min' }, { n: 'Aucune semaine vide', d: '1 séance minimum chaque semaine du mois (4 semaines).', g: 4, f: L => new Set(L.map(s => { const d = new Date(s.start); return Math.floor((d.getDate() - 1) / 7); })).size, u: ' sem.' }
];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
function challenge(t = Date.now()) {
  const d = new Date(t), c = CH[(d.getFullYear() * 12 + d.getMonth()) % CH.length], key = monthKey(t);
  const L = gym().filter(s => monthKey(s.start) === key), v = c.f(L), end = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() - d.getDate();
  return { ...c, key, v, p: Math.min(1, v / c.g), month: MONTHS[d.getMonth()], left: end, done: (C().S().challenges || []).includes(key) };
}
window.challengeCheck = () => { const ch = challenge(), S = C().S(); S.challenges = S.challenges || []; if (ch.v >= ch.g && !S.challenges.includes(ch.key)) { S.challenges.push(ch.key); return ch; } return null; };
window.showChallenge = ch => {
  const o = document.createElement('div'); o.className = 'unlock'; o.innerHTML = `<div class="u-in"><div class="u-rays"></div><div class="medal t3 big"><div class="m-disc"><span>🎯</span></div></div><small>Défi de ${ch.month} réussi</small><h2>${esc(ch.n)}</h2><p>Réussi avec ${ch.left} jour${ch.left > 1 ? 's' : ''} d'avance. La médaille est à toi, pour toujours.</p><button class="es-main">Super</button></div>`;
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('show')); o.addEventListener('click', e => { if (e.target.closest('button')) { o.classList.remove('show'); setTimeout(() => o.remove(), 300); } });
};
const chCard = () => { const ch = challenge(); return `<div class="chcard ${ch.done ? 'won' : ''}"><div class="ch-i">🎯</div><div class="ch-t"><small>Défi de ${ch.month} · J-${ch.left}</small><b>${esc(ch.n)}</b><div class="ch-bar"><i style="width:${ch.p * 100}%"></i></div><small>${fr(Math.min(ch.v, ch.g))}${ch.u} / ${fr(ch.g)}${ch.u}${ch.done ? ' · réussi !' : ''}</small></div></div>`; };

/* ---------- sous-vues ---------- */
let tab = 'resume', exOpen = null, calT = Date.now();
function vResume() {
  const L = gym(), last = L.at(-1), st = stats(), now = Date.now(), mk = monthKey(now), ML = L.filter(s => monthKey(s.start) === mk);
  const mVol = ML.reduce((a, s) => a + (s.vol || 0), 0), mPr = ML.reduce((a, s) => a + (s.prs || []).length, 0), yPr = L.filter(s => new Date(s.start).getFullYear() === new Date().getFullYear()).reduce((a, s) => a + (s.prs || []).length, 0);
  const w = C().body(), ws = C().S().body.weights || [], nextP = (window.VIEWS.nextPlanned && window.VIEWS.nextPlanned()) || null;
  return `${last ? `<div class="lastcard"><div class="lc-date"><small>${new Date(last.start).toLocaleDateString('fr-FR', { weekday: 'short' })}</small><b>${new Date(last.start).getDate()}</b><small>${new Date(last.start).toLocaleDateString('fr-FR', { month: 'short' })}</small></div>
      <div class="lc-t"><small>Ta dernière séance</small><b>${esc(last.name)}</b><div class="chipsrow"><span>${(last.ex || []).reduce((a, e) => a + e.sets.length, 0)} séries</span><span>${fr(last.vol || 0)} kg</span><span>${mmin(last)} min</span>${last.feel ? `<span>${esc(last.feel)}</span>` : ''}</div></div>
      <div class="lc-b"><button class="sm p" data-jr="detail" data-v="${esc(last.id)}">Le détail</button>${last.sid ? `<button class="sm" data-act="start" data-sid="${esc(last.sid)}">Refaire</button>` : ''}</div></div>` : `<div class="tcard"><p>Ton journal se remplit tout seul en mode salle. Lance ta première séance depuis Mes séances.</p><button class="p wide" data-act="goto" data-v="program">Mes séances</button></div>`}
  <div class="jgrid">
    <div class="tcard"><div class="eyebrow">Ce mois-ci</div><div class="trio3"><div class="mini"><b>${ML.length}</b><small>séance${ML.length > 1 ? 's' : ''}</small></div><div class="mini"><b>${fr(mVol)}</b><small>kg soulevés</small></div><div class="mini"><b>${mPr}</b><small>record${mPr > 1 ? 's' : ''}</small></div></div>
      <div class="row" style="margin-top:10px"><button class="story grow" data-jr="story">Partager en story</button></div></div>
    <div class="tcard"><div class="eyebrow">Défi</div>${chCard()}</div>
    <div class="tcard"><div class="eyebrow">Mon corps</div><b class="big2">${fk(w.w)} kg</b><p class="tiny">${ws.length ? 'Pesée du ' + dS(ws.at(-1).t) : 'Note ton poids'}</p><button class="sm" data-act="goto" data-v="me">Noter mon poids</button></div>
    <div class="tcard"><div class="eyebrow">Records en ${new Date().getFullYear()}</div><b class="big2">${yPr} PR</b><p class="tiny">${st.prs} au total</p><button class="sm" data-jr="tab" data-v="chiffres">Mes records</button></div>
  </div>
  ${nextP ? `<div class="tcard nextp"><div class="eyebrow">Prévu ensuite</div><b>${esc(nextP.label)}</b><p class="tiny">${esc(nextP.name)}</p><button class="sm" data-act="goto" data-v="program">Mes séances</button></div>` : ''}
  <div class="eyebrow" style="margin-top:18px">Séances de ${MONTHS[new Date().getMonth()]}</div>
  <div class="tcard" style="padding:6px 14px">${ML.slice().reverse().map(s => `<button class="jrow" data-jr="detail" data-v="${esc(s.id)}"><span class="jd"><small>${new Date(s.start).toLocaleDateString('fr-FR', { weekday: 'short' })}</small><b>${new Date(s.start).getDate()}</b></span><span class="jt"><b>${esc(s.name)}</b><small>${(s.ex || []).length} exos · ${fr(s.vol || 0)} kg${(s.prs || []).length ? ' · ' + s.prs.length + ' PR' : ''}</small></span><span class="mer-go">›</span></button>`).join('') || '<p class="tiny">Aucune séance ce mois-ci.</p>'}</div>`;
}
function sessionSheet(id) {
  const l = C().S().log.find(x => x.id === id); if (!l) return;
  C().sheet(`<div class="tiny">${dL(l.start)} · ${mmin(l)} min</div><h2>${esc(l.name)}</h2>
    <div class="chipsrow" style="margin:8px 0"><span class="chip2">${fr(l.vol || 0)} kg soulevés</span>${l.feel ? `<span class="chip2">${esc(l.feel)}</span>` : ''}${(l.prs || []).map(p => `<span class="okchip">PR ${esc(p)}</span>`).join('')}</div>
    ${(l.ex || []).map(e => `<div class="sesex"><b>${esc(e.n)}</b><div>${e.sets.map(s => `<span class="${s.t ? 'st-' + s.t : ''}">${fk(s.kg)} × ${s.r}</span>`).join('')}</div></div>`).join('') || '<p class="tiny">Activité notée sans détail.</p>'}
    ${l.note ? `<p class="small">${esc(l.note)}</p>` : ''}
    <div class="row" style="margin-top:12px">${l.sid ? `<button class="grow" data-act="start" data-sid="${esc(l.sid)}">Refaire</button>` : ''}<button class="grow" data-jr="storyof" data-v="${esc(l.id)}">Partager</button></div>
    <button class="ghost wide" style="margin-top:8px" data-close>Fermer</button>`);
}
function spark(vals, w = 90, h = 28) { if (vals.length < 2) return ''; const mn = Math.min(...vals), mx = Math.max(...vals); return `<svg class="spark" viewBox="0 0 ${w} ${h}"><path d="${vals.map((v, i) => (i ? 'L' : 'M') + (i * w / (vals.length - 1)).toFixed(1) + ',' + (h - 3 - (mx === mn ? .5 : (v - mn) / (mx - mn)) * (h - 6)).toFixed(1)).join('')}" fill="none" stroke="var(--acc)" stroke-width="2"/></svg>`; }
function exHist(id) { return gym().filter(s => (s.ex || []).some(e => e.id === id)).map(s => { const e = s.ex.find(x => x.id === id), w = e.sets.filter(x => x.t !== 'e'); const best = w.reduce((b, x) => (x.kg > b.kg || (x.kg === b.kg && x.r > b.r)) ? x : b, { kg: 0, r: 0 }); return { s, e, best, vol: w.reduce((a, x) => a + x.kg * x.r, 0) }; }); }
function vExos() {
  if (exOpen) return vExo(exOpen);
  const REC = C().REC(), ids = [...new Set(gym().flatMap(s => (s.ex || []).map(e => e.id)))];
  const rows = ids.map(id => ({ id, h: exHist(id) })).sort((a, b) => b.h.at(-1).s.start - a.h.at(-1).s.start);
  return rows.length ? `<div class="tcard" style="padding:4px 12px">${rows.map(({ id, h }) => { const R = REC.get(id), m = C().metaOf(id); return `<button class="exrow" data-jr="exo" data-v="${esc(id)}"><div class="mer-b">${window.bodySvg(m.m || 'Pecs', { one: true })}</div><div class="mer-t"><b>${esc(h.at(-1).e.n)}</b><small>${dS(h.at(-1).s.start)} · ${h.length} séance${h.length > 1 ? 's' : ''}${R ? ' · record ' + fk(R.kg) + ' kg × ' + (R.r || 1) : ''}</small></div>${spark(h.map(x => x.best.kg))}</button>`; }).join('')}</div>` : '<div class="tcard"><p class="tiny">Tes exercices apparaîtront ici après ta première séance.</p></div>';
}
function vExo(id) {
  const h = exHist(id); if (!h.length) { exOpen = null; return vExos(); }
  const R = C().REC().get(id), name = h.at(-1).e.n, best = h.reduce((b, x) => x.best.kg > b.best.kg ? x : b, h[0]), first = h[0].best.kg, bw = C().body().w;
  const pts = h.map(x => x.best.kg), W = 600, H = 200, px = 34, py = 24, mn = Math.min(...pts), mx = Math.max(...pts);
  const X = i => px + (h.length < 2 ? .5 : i / (h.length - 1)) * (W - 2 * px), Y = v => H - py - (mx === mn ? .5 : (v - mn) / (mx - mn)) * (H - 2 * py);
  const line = pts.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join('');
  return `<button class="link" data-jr="back">← Exercices</button><h2 class="h2t" style="margin-top:6px">${esc(name)}</h2><p class="sub2">${h.length} séance${h.length > 1 ? 's' : ''} notée${h.length > 1 ? 's' : ''} depuis le ${dS(h[0].s.start)}</p>
  <div class="tcard exhero"><small>Meilleure série</small><div class="between"><b class="big3">${fk(best.best.kg)} kg × ${best.best.r}</b>${h.length > 1 ? `<span class="okchip">${best.best.kg - first >= 0 ? '+' : ''}${fk(best.best.kg - first)} kg</span>` : ''}</div>
    ${h.length > 1 ? `<svg class="exchart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs><linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--acc)" stop-opacity=".28"/><stop offset="1" stop-color="var(--acc)" stop-opacity="0"/></linearGradient></defs><path d="${line}L${X(h.length - 1)},${H - py}L${X(0)},${H - py}Z" fill="url(#eg)"/><path class="draw" d="${line}" fill="none" stroke="var(--acc)" stroke-width="3" vector-effect="non-scaling-stroke"/>${pts.map((v, i) => `<circle cx="${X(i)}" cy="${Y(v)}" r="4" fill="var(--acc)" vector-effect="non-scaling-stroke"/>`).join('')}</svg><div class="between tiny"><span>${dS(h[0].s.start)}</span><span>${dS(h.at(-1).s.start)}</span></div>` : '<p class="tiny">Encore une séance pour voir la courbe.</p>'}</div>
  ${R ? `<div class="reccard"><span>🏆</span><div><b>Record : ${fk(R.kg)} kg × ${R.r || 1}</b><small>le ${dS(R.t)} · 1RM estimé ${fk(R.e1)} kg · ${fr(R.kg / bw, 2)} × ton poids</small></div></div>` : ''}
  <div class="tcard" style="padding:6px 14px"><table class="hist2"><thead><tr><th>Séance</th><th>Séries</th><th>Volume</th></tr></thead><tbody>${h.slice().reverse().map(x => `<tr><td>${dS(x.s.start)}</td><td>${x.e.sets.map(s => `<span class="${s.t ? 'st-' + s.t : ''}">${fk(s.kg)}×${s.r}</span>`).join(' ')}</td><td>${fr(x.vol)} kg</td></tr>`).join('')}</tbody></table></div>`;
}
function vCal() {
  const d = new Date(calT); d.setDate(1); const y = d.getFullYear(), m = d.getMonth(), start = new Date(d); start.setDate(1 - ((d.getDay() + 6) % 7));
  const L = gym(), byDay = new Map(); for (const s of L) { const k = new Date(s.start).toDateString(); byDay.set(k, (byDay.get(k) || 0) + (s.vol || 1)); }
  const mx = Math.max(1, ...byDay.values()), ML = L.filter(s => new Date(s.start).getMonth() === m && new Date(s.start).getFullYear() === y);
  const cells = Array.from({ length: 42 }, (_, i) => { const t = new Date(start); t.setDate(start.getDate() + i); return t; }).filter((t, i) => i < 35 || t.getMonth() === m);
  return `<div class="wnav"><button class="sm" data-jr="cprev" aria-label="Mois précédent">‹</button><b>${MONTHS[m]} ${y}</b><button class="sm" data-jr="cnext" aria-label="Mois suivant">›</button></div>
  <div class="heat">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(x => `<small>${x}</small>`).join('')}${cells.map(t => { const v = byDay.get(t.toDateString()) || 0, today = t.toDateString() === new Date().toDateString(); return `<div class="hc ${t.getMonth() !== m ? 'out' : ''} ${today ? 'today' : ''}" style="--h:${v ? .25 + .75 * v / mx : 0}">${t.getDate()}</div>`; }).join('')}</div>
  <div class="trio3" style="margin-top:12px"><div class="mini"><b>${ML.length}</b><small>séances</small></div><div class="mini"><b>${fr(ML.reduce((a, s) => a + (s.vol || 0), 0))}</b><small>kg</small></div><div class="mini"><b>${ML.reduce((a, s) => a + mmin(s), 0)}</b><small>minutes</small></div></div>`;
}
function bars(vals, labels, unit) { const mx = Math.max(1, ...vals); return `<div class="vbars">${vals.map((v, i) => `<div class="vb"><span class="vv">${v ? fr(v) : ''}</span><i style="--h:${v / mx}"></i><small>${labels[i]}</small></div>`).join('')}</div>`; }
function vChiffres() {
  const REC = C().REC(), bw = C().body().w, L = gym(), now = new Date(), st = stats();
  const recs = [...REC.values()].sort((a, b) => b.e1 - a.e1);
  const weeks = Array.from({ length: 10 }, (_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) - (9 - i) * 7); return d.getTime(); });
  const perW = weeks.map((w, i) => L.filter(s => s.start >= w && s.start < (weeks[i + 1] || Infinity)).length);
  const months = Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 5 + i, 1));
  const perM = months.map(m => L.filter(s => new Date(s.start).getMonth() === m.getMonth() && new Date(s.start).getFullYear() === m.getFullYear()).reduce((a, s) => a + (s.vol || 0), 0));
  const yr = L.filter(s => new Date(s.start).getFullYear() === now.getFullYear() && (s.prs || []).length);
  return `<div class="trio3"><div class="mini"><b>${st.n}</b><small>séances</small></div><div class="mini"><b>${fr(st.ton / 1000, 1)} t</b><small>soulevées</small></div><div class="mini"><b>${st.prs}</b><small>records</small></div></div>
  <h2 class="h2t">Mes 1RM estimés</h2><p class="sub2">Ta charge max sur une répétition, et ce qu'elle représente par rapport à ton poids (${fk(bw)} kg).</p>
  <div class="tcard" style="padding:4px 12px">${recs.slice(0, 8).map(R => `<div class="rmrow"><span><b>${esc(R.n)}</b><small>record ${fk(R.kg)} kg × ${R.r || 1} · ${dS(R.t)}</small></span><span class="rmv"><b>${fk(R.e1)} kg</b><small>${fr(R.e1 / bw, 2)} × ton poids</small></span></div>`).join('') || '<p class="tiny">Pas encore de record.</p>'}</div>
  <h2 class="h2t">Séances par semaine</h2>${bars(perW, weeks.map(w => new Date(w).getDate() + '/' + (new Date(w).getMonth() + 1)), '')}
  <h2 class="h2t">Kilos soulevés par mois</h2>${bars(perM.map(Math.round), months.map(m => MONTHS[m.getMonth()].slice(0, 4)), ' kg')}
  <h2 class="h2t">Mes PR de l'année</h2><div class="frise">${yr.slice().reverse().map(s => `<div class="fr-i"><i></i><small>${dS(s.start)}</small><b>${s.prs.map(esc).join(', ')}</b></div>`).join('') || '<p class="tiny">Aucun record cette année pour l\'instant.</p>'}</div>`;
}
function vBadges() {
  const st = stats(), S = C().S(), fams = [...new Set(window.BADGES2.map(b => b.f))], won = window.BADGES2.filter(b => S.badges[b.id]).length;
  return `<div class="tcard"><div class="between"><b>${won} / ${window.BADGES2.length} badges</b><small class="tiny">${fams.length} familles</small></div><div class="ch-bar" style="margin-top:8px"><i style="width:${won / window.BADGES2.length * 100}%"></i></div></div>
  ${chCard()}
  ${fams.map(f => `<h2 class="h2t" style="font-size:20px">${f}</h2><div class="medals">${window.BADGES2.filter(b => b.f === f).map(b => { const on = !!S.badges[b.id]; return `<button class="mbtn" data-jr="badge" data-v="${b.id}">${window.medal(b, on)}${on ? '' : `<span class="mprog"><i style="width:${b.prog(st) * 100}%"></i></span>`}</button>`; }).join('')}</div>`).join('')}`;
}
VIEWS.journal = () => {
  const tabs = [['resume', 'Résumé'], ['exos', 'Exercices'], ['cal', 'Calendrier'], ['chiffres', 'Chiffres'], ['badges', 'Badges']];
  const body = { resume: vResume, exos: vExos, cal: vCal, chiffres: vChiffres, badges: vBadges }[tab]();
  return `<div class="kicker">Mon espace</div><h1>Journal</h1><div class="seg scrollseg" style="margin:12px 0">${tabs.map(([k, l]) => `<button class="${tab === k ? 'sel' : ''}" data-jr="tab" data-v="${k}">${l}</button>`).join('')}</div>${body}`;
};

/* ---------- image à partager (story 1080×1920) ---------- */
async function story(l) {
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1920; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 1080, 1920); g.addColorStop(0, '#1a0f0a'); g.addColorStop(.5, '#121316'); g.addColorStop(1, '#0b1534'); x.fillStyle = g; x.fillRect(0, 0, 1080, 1920);
  const F = (w, s) => `${w} ${s}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
  x.fillStyle = '#ff7a1a'; x.font = F(800, 40); x.fillText('CARNET SPORT', 90, 170);
  x.fillStyle = '#fff'; x.font = F(900, 110); const name = l ? l.name : 'Mon mois'; x.fillText(name.length > 16 ? name.slice(0, 15) + '…' : name, 90, 320);
  x.fillStyle = '#a0a5b0'; x.font = F(500, 44); x.fillText(l ? dL(l.start) : MONTHS[new Date().getMonth()] + ' ' + new Date().getFullYear(), 90, 395);
  const ML = gym().filter(s => monthKey(s.start) === monthKey(Date.now()));
  const nums = l ? [[mmin(l), 'minutes'], [(l.ex || []).reduce((a, e) => a + e.sets.length, 0), 'séries'], [Math.round(l.vol || 0), 'kg soulevés']] : [[ML.length, 'séances'], [Math.round(ML.reduce((a, s) => a + (s.vol || 0), 0)), 'kg soulevés'], [ML.reduce((a, s) => a + (s.prs || []).length, 0), 'records']];
  nums.forEach(([v, lab], i) => { const X0 = 90 + i * 310; x.fillStyle = 'rgba(255,255,255,.07)'; x.beginPath(); x.roundRect(X0, 470, 280, 220, 36); x.fill(); x.fillStyle = '#fff'; x.font = F(900, 84); x.fillText(v.toLocaleString('fr-FR'), X0 + 30, 590); x.fillStyle = '#a0a5b0'; x.font = F(500, 36); x.fillText(lab, X0 + 30, 650); });
  let y = 800;
  const items = l ? (l.ex || []).slice(0, 7).map(e => [e.n, e.sets.filter(s => s.t !== 'e').map(s => fk(s.kg) + '×' + s.r).join('  ')]) : ML.slice(-7).reverse().map(s => [s.name, dS(s.start) + ' · ' + fr(s.vol || 0) + ' kg']);
  for (const [a, b] of items) { x.fillStyle = '#fff'; x.font = F(800, 46); x.fillText(a.length > 30 ? a.slice(0, 29) + '…' : a, 90, y); x.fillStyle = '#ff9a62'; x.font = F(600, 38); x.fillText(b.length > 40 ? b.slice(0, 39) + '…' : b, 90, y + 52); y += 140; }
  if (l && (l.prs || []).length) { x.fillStyle = '#f5b400'; x.font = F(900, 52); x.fillText('🏆 ' + l.prs.length + ' nouveau' + (l.prs.length > 1 ? 'x' : '') + ' record' + (l.prs.length > 1 ? 's' : ''), 90, Math.min(y + 30, 1700)); }
  x.fillStyle = '#ff7a1a'; x.font = F(900, 60); x.fillText('🔥 ' + (C().S().best ? stats().best : 0) + ' semaines de suite', 90, 1800);
  const blob = await new Promise(r => c.toBlob(r, 'image/png')), file = new File([blob], 'carnet-story.png', { type: 'image/png' });
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file] }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'carnet-story.png'; document.body.appendChild(a); a.click(); a.remove(); C().toast('Image enregistrée');
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-jr]'); if (!b || !window.CARNET) return; const v = b.dataset.v;
  switch (b.dataset.jr) {
    case 'tab': tab = v; exOpen = null; C().go('progress'); return;
    case 'detail': sessionSheet(v); return;
    case 'exo': exOpen = v; window.scrollTo(0, 0); break;
    case 'back': exOpen = null; break;
    case 'cprev': { const d = new Date(calT); d.setMonth(d.getMonth() - 1); calT = d.getTime(); break; }
    case 'cnext': { const d = new Date(calT); d.setMonth(d.getMonth() + 1); calT = d.getTime(); break; }
    case 'story': story(null); return;
    case 'storyof': story(C().S().log.find(l => l.id === v)); return;
    case 'badge': { const bd = window.BADGES2.find(x => x.id === v), on = C().S().badges[v], st = stats(); C().sheet(`<div style="text-align:center">${window.medal(bd, on, 'big')}<div class="tiny" style="margin-top:8px">${TIER[bd.t]} · ${esc(bd.f)}</div><h2>${esc(bd.n)}</h2><p class="small">${esc(bd.d)}</p>${on ? `<p class="okchip" style="display:inline-block">Débloqué le ${dS(on)}</p>` : `<div class="ch-bar" style="margin:10px 0"><i style="width:${bd.prog(st) * 100}%"></i></div><p class="tiny">${Math.round(bd.prog(st) * 100)} % du chemin</p>`}<button class="ghost wide" style="margin-top:10px" data-close>Fermer</button></div>`); return; }
    default: return;
  }
  C().render();
});
AFTER.progress = () => { };
}
