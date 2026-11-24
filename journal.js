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
let tab = 'resume', exOpen = null, calT = Date.now(), selDay = new Date().toDateString(), sport = null;
const KIND = l => l.kind === 'run' ? 'run' : l.kind === 'bike' ? 'bike' : 'gym';
const ICO = { gym: '🏋️', run: '🏃', bike: '🚴' }, COL = { gym: 'var(--acc)', run: '#2563eb', bike: '#16a34a' }, LBL = { gym: 'Muscu', run: 'Course', bike: 'Vélo' };
const mm = s => { s = Math.round(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const hm = s => { const m = Math.round(s / 60); return m >= 60 ? Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0') : m + ' min'; };
const durS = l => l.sec || Math.max(60, (l.end - l.start) / 1000);
const paceOf = l => l.pace || (l.km ? l.sec / l.km : 0), kmhOf = l => l.kmh || (l.sec ? l.km / (l.sec / 3600) : 0);
const monday = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
const allLog = () => C().S().log.slice().sort((a, b) => a.start - b.start);
function actLine(l) {
  const k = KIND(l);
  if (k === 'run') return `${fr(l.km, 1)} km · ${mm(paceOf(l))}/km · ${hm(durS(l))}`;
  if (k === 'bike') return `${fr(l.km, 1)} km · ${fr(kmhOf(l), 1)} km/h${l.elev ? ' · ' + l.elev + ' m D+' : ''}`;
  return `${(l.ex || []).reduce((a, e) => a + e.sets.length, 0)} séries · ${fr(l.vol || 0)} kg · ${mmin(l)} min${(l.prs || []).length ? ' · ' + l.prs.length + ' PR' : ''}`;
}
const actRow = l => `<button class="arow" data-jr="detail" data-v="${esc(l.id)}"><span class="a-ic" style="--c:${COL[KIND(l)]}">${ICO[KIND(l)]}</span><span class="a-t"><b>${esc(l.name)}</b><small>${new Date(l.start).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} · ${actLine(l)}</small></span><span class="mer-go">›</span></button>`;
/* graphique en colonnes (HTML, lisible sur téléphone) */
function cols(vals, labels, o = {}) {
  const ok = vals.filter(v => v != null && v > 0), n = vals.length;
  if (!ok.length) return `<p class="tiny">${o.empty || 'Pas encore de données.'}</p>`;
  const lo = o.invert ? (o.lo ?? Math.min(...ok, o.goal ?? Infinity) - 15) : 0, hi = o.invert ? (o.hi ?? Math.max(...ok) + 10) : (o.hi ?? Math.max(...ok, o.goal || 0) * 1.12);
  const pc = v => Math.max(3, Math.min(100, o.invert ? (hi - v) / (hi - lo) * 100 : v / hi * 100));
  const hl = o.hl ?? n - 1, fmt = o.fmt || (v => fr(v));
  return `<div class="cols" style="--n:${n}"><div class="cols-a">${o.goal != null ? `<div class="cols-g" style="bottom:${pc(o.goal)}%"><span>${esc(o.goalLbl || fmt(o.goal))}</span></div>` : ''}
    ${vals.map((v, i) => `<div class="col ${i === hl ? 'hl' : ''}" title="${esc(labels[i])} : ${v == null || !v ? '—' : esc(fmt(v))}"><span>${v == null || !v ? '' : fmt(v)}</span><i style="height:${v == null || !v ? 0 : pc(v)}%;--c:${o.color || 'var(--acc)'}"></i></div>`).join('')}</div>
    <div class="cols-l">${labels.map((l, i) => `<small class="${i === hl ? 'hl' : ''}">${esc(l)}</small>`).join('')}</div></div>`;
}
const weeksBack = n => Array.from({ length: n }, (_, i) => monday(Date.now()) - (n - 1 - i) * 7 * 864e5);
const monthsBack = n => { const now = new Date(); return Array.from({ length: n }, (_, i) => new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1)); };
const inWeek = (l, w) => l.start >= w && l.start < w + 7 * 864e5;
const inMonth = (l, m) => { const d = new Date(l.start); return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear(); };
const wLbl = w => { const d = new Date(w); return d.getDate() + '/' + (d.getMonth() + 1); }, mLbl = m => MONTHS[m.getMonth()].slice(0, 3) + '.';

const HAS = k => !window.PROFILE || window.PROFILE.has(k);
function vResume() {
  const L = allLog(), w0 = monday(Date.now()), W = L.filter(l => inWeek(l, w0)), st = stats(), last = L.at(-1);
  const gW = W.filter(l => KIND(l) === 'gym').length, rW = W.filter(l => KIND(l) === 'run').reduce((a, l) => a + l.km, 0), bW = W.filter(l => KIND(l) === 'bike').reduce((a, l) => a + l.km, 0), tW = W.reduce((a, l) => a + durS(l), 0);
  const days = Array.from({ length: 7 }, (_, i) => w0 + i * 864e5), today = new Date().toDateString();
  const strip = days.map((d, i) => { const ds = new Date(d).toDateString(), A = L.filter(l => new Date(l.start).toDateString() === ds); return `<div class="wd ${ds === today ? 'today' : ''} ${A.length ? 'on' : ''}"><small>${'LMMJVSD'[i]}</small><span>${A.length ? [...new Set(A.map(KIND))].map(k => ICO[k]).join('') : new Date(d).getDate()}</span></div>`; }).join('');
  const runs = L.filter(l => KIND(l) === 'run' && l.km >= 3).slice(-5), avgP = runs.length ? runs.reduce((a, l) => a + paceOf(l), 0) / runs.length : 0;
  const w = C().body(), ws = C().S().body.weights || [], nextP = (window.VIEWS.nextPlanned && window.VIEWS.nextPlanned()) || null, yPr = gym().filter(s => new Date(s.start).getFullYear() === new Date().getFullYear()).reduce((a, s) => a + (s.prs || []).length, 0);
  const stag = window.PROG ? window.PROG.stagnantList() : [];
  return `<div class="jgrid2">
  <section class="tcard weekcard"><div class="between"><div class="eyebrow" style="margin:0">Cette semaine</div><small class="mute">${hm(tW)} de sport</small></div>
    <div class="wkt" style="grid-template-columns:repeat(${window.PROFILE ? window.PROFILE.sports().length : 3},minmax(0,1fr))">${[['gym', gW, gW > 1 ? 'séances' : 'séance'], ['run', fr(rW, 1), 'km'], ['bike', fr(bW, 0), 'km']].filter(x => HAS(x[0])).map(([k, v, u]) => `<div style="--c:${COL[k]}"><span>${ICO[k]}</span><b>${v}</b><small>${LBL[k]} · ${u}</small></div>`).join('')}</div>
    <div class="wstrip">${strip}</div>
    <p class="tiny" style="margin:8px 0 0">🔥 ${C().S().best ? stats().best : 0} semaine${(C().S().best || 0) > 1 ? 's' : ''} de suite au maximum · objectif ${C().S().set.goal} ${HAS('gym') ? 'séance' + (C().S().set.goal > 1 ? 's' : '') + ' de muscu' : 'activité' + (C().S().set.goal > 1 ? 's' : '')} par semaine</p></section>
  ${last ? `<section class="tcard lastact" style="--c:${COL[KIND(last)]}"><div class="eyebrow">Dernière activité</div><div class="la-h"><span class="a-ic big" style="--c:${COL[KIND(last)]}">${ICO[KIND(last)]}</span><div><b>${esc(last.name)}</b><small>${dL(last.start)}</small></div></div>
    <div class="la-k">${KIND(last) === 'gym' ? `<div><b>${mmin(last)}</b><small>min</small></div><div><b>${(last.ex || []).reduce((a, e) => a + e.sets.length, 0)}</b><small>séries</small></div><div><b>${fr(last.vol || 0)}</b><small>kg</small></div>` : KIND(last) === 'run' ? `<div><b>${fr(last.km, 2)}</b><small>km</small></div><div><b>${mm(paceOf(last))}</b><small>/km</small></div><div><b>${hm(durS(last))}</b><small>durée</small></div>` : `<div><b>${fr(last.km, 1)}</b><small>km</small></div><div><b>${fr(kmhOf(last), 1)}</b><small>km/h</small></div><div><b>${last.elev || 0}</b><small>m D+</small></div>`}</div>
    <div class="row"><button class="p sm grow" data-jr="detail" data-v="${esc(last.id)}">Voir l'analyse</button>${last.sid ? `<button class="sm grow" data-act="start" data-sid="${esc(last.sid)}">Refaire</button>` : ''}</div></section>` : `<section class="tcard"><p>Ton journal se remplit tout seul : séances du mode salle et sorties Strava.</p><button class="p wide" data-act="goto" data-v="program">Mes séances</button></section>`}
  ${runs.length && HAS('run') ? (() => { const G = window.PROFILE.goal(), lo = G ? G + 90 : 0; return `<section class="tcard"><div class="eyebrow">${G ? 'Objectif ' + mm(G) + '/km' : 'Ton allure en course'}</div><div class="between"><b class="big2">${mm(avgP)}<small style="font-size:14px">/km</small></b>${G ? `<span class="${avgP <= G ? 'okchip' : 'chip2'}">${avgP <= G ? 'Atteint !' : '+' + Math.round(avgP - G) + ' s/km'}</span>` : ''}</div>${G ? `<div class="ch-bar" style="margin:8px 0"><i style="width:${Math.min(100, Math.max(5, (lo - avgP) / 90 * 100))}%;background:#2563eb"></i></div>` : ''}<p class="tiny">Allure moyenne de tes ${runs.length} dernières courses${G ? ` (${mm(lo)} → ${mm(G)})` : '. Fixe-toi un objectif dans Moi → Réglages'}.</p></section>`; })() : ''}
  <section class="tcard"><div class="eyebrow">Défi du mois</div>${chCard()}</section>
  <section class="tcard"><div class="eyebrow">Mon corps</div><b class="big2">${fk(w.w)} kg</b><p class="tiny">${ws.length ? 'Pesée du ' + dS(ws.at(-1).t) : 'Note ton poids'}</p><button class="sm" data-act="goto" data-v="me">Noter mon poids</button></section>
  <section class="tcard"><div class="eyebrow">Records muscu ${new Date().getFullYear()}</div><b class="big2">${yPr} PR</b><p class="tiny">${st.prs} au total</p><button class="sm" data-jr="tab" data-v="chiffres">Mes chiffres</button></section>
  </div>
  ${stag.length ? `<div class="tcard stagcard"><div class="eyebrow">À surveiller</div>${stag.slice(0, 3).map(x => `<p class="small"><b>${esc(C().metaOf(x.id).n || (C().S().log.flatMap(s => s.ex || []).find(e => e.id === x.id) || {}).n || x.id)}</b> : ${esc(x.s.msg)}</p>`).join('')}</div>` : ''}
  ${nextP ? `<div class="tcard nextp"><div class="eyebrow">Prévu ensuite</div><b>${esc(nextP.label)}</b><p class="tiny">${esc(nextP.name)}</p><button class="sm" data-act="goto" data-v="program">Mes séances</button></div>` : ''}
  <div class="between" style="margin-top:20px"><h2 class="h2t" style="margin:0">Activités récentes</h2><div class="row" style="gap:6px">${HAS('run') || HAS('bike') ? '<button class="sm" data-act="addact">+ Noter une sortie</button>' : ''}<button class="link" data-jr="tab" data-v="cal">Calendrier ›</button></div></div>
  <div class="tcard" style="padding:4px 14px">${L.slice(-12).reverse().map(actRow).join('') || '<p class="tiny">Aucune activité pour l\'instant.</p>'}</div>
  <button class="story wide" style="margin-top:10px" data-jr="story">Partager mon mois en story</button>`;
}
function sessionSheet(id) {
  const l = C().S().log.find(x => x.id === id); if (!l) return;
  C().sheet(`<div class="tiny">${dL(l.start)} · ${mmin(l)} min</div><h2>${esc(l.name)}</h2>
    <div class="chipsrow" style="margin:8px 0"><span class="chip2">${fr(l.vol || 0)} kg soulevés</span>${l.feel ? `<span class="chip2">${esc(l.feel)}</span>` : ''}${(l.prs || []).map(p => `<span class="okchip">PR ${esc(p)}</span>`).join('')}</div>
    ${(l.ex || []).map(e => `<div class="sesex"><b>${esc(e.n)}</b><div>${e.sets.map(s => `<span class="${s.t ? 'st-' + s.t : ''}">${fk(s.kg)} × ${s.r}</span>`).join('')}</div></div>`).join('') || '<p class="tiny">Activité notée sans détail.</p>'}
    ${l.note ? `<p class="small">${esc(l.note)}</p>` : ''}
    <div class="row" style="margin-top:12px">${l.sid ? `<button class="grow" data-act="start" data-sid="${esc(l.sid)}">Refaire</button>` : ''}<button class="grow" data-jr="storyof" data-v="${esc(l.id)}">Partager</button></div>
    <button class="p wide" style="margin-top:8px" data-close data-lib="ana" data-id="${esc(l.id)}">Analyse complète</button>
    <button class="ghost wide" style="margin-top:8px" data-close>Fermer</button>`);
}
function spark(vals, w = 90, h = 28) { if (vals.length < 2) return ''; const mn = Math.min(...vals), mx = Math.max(...vals); return `<svg class="spark" viewBox="0 0 ${w} ${h}"><path d="${vals.map((v, i) => (i ? 'L' : 'M') + (i * w / (vals.length - 1)).toFixed(1) + ',' + (h - 3 - (mx === mn ? .5 : (v - mn) / (mx - mn)) * (h - 6)).toFixed(1)).join('')}" fill="none" stroke="var(--acc)" stroke-width="2"/></svg>`; }
function exHist(id) { return gym().filter(s => (s.ex || []).some(e => e.id === id)).map(s => { const e = s.ex.find(x => x.id === id), w = e.sets.filter(x => x.t !== 'e'); const best = w.reduce((b, x) => (x.kg > b.kg || (x.kg === b.kg && x.r > b.r)) ? x : b, { kg: 0, r: 0 }); return { s, e, best, vol: w.reduce((a, x) => a + x.kg * x.r, 0) }; }); }
function vExos() {
  if (exOpen) return vExo(exOpen);
  const REC = C().REC(), ids = [...new Set(gym().flatMap(s => (s.ex || []).map(e => e.id)))];
  const rows = ids.map(id => ({ id, h: exHist(id) })).sort((a, b) => b.h.at(-1).s.start - a.h.at(-1).s.start);
  return rows.length ? `<div class="tcard" style="padding:4px 12px">${rows.map(({ id, h }) => { const R = REC.get(id), m = C().metaOf(id); return `<button class="exrow" data-jr="exo" data-v="${esc(id)}"><div class="mer-b">${window.bodySvg(m.m || 'Pecs', { one: true })}</div><div class="mer-t"><b>${esc(h.at(-1).e.n)}</b><small>${dS(h.at(-1).s.start)} · ${h.length} séance${h.length > 1 ? 's' : ''}${R ? ' · record ' + fk(R.kg) + ' kg × ' + (R.r || 1) : ''}</small></div>${spark(h.map(x => x.best.kg))}</button>`; }).join('')}</div>` : `<div class="tcard"><p class="small">Ici, tu retrouveras chaque exercice de muscu que tu as fait, avec ta courbe de progression et ton record. Ça se remplit tout seul dès ta première séance en mode salle.</p><button class="p wide" data-act="goto" data-v="lib">Parcourir la bibliothèque d'exercices</button></div>`;
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
  const L = allLog(), byDay = new Map(); for (const l of L) { const k = new Date(l.start).toDateString(); if (!byDay.has(k)) byDay.set(k, []); byDay.get(k).push(l); }
  const ML = L.filter(l => new Date(l.start).getMonth() === m && new Date(l.start).getFullYear() === y);
  const cells = Array.from({ length: 42 }, (_, i) => { const t = new Date(start); t.setDate(start.getDate() + i); return t; }).filter((t, i) => i < 35 || t.getMonth() === m);
  const sel = byDay.get(selDay) || [], today = new Date().toDateString();
  const plans = window.VIEWS.plansOn ? window.VIEWS.plansOn(new Date(selDay).getTime()) : [];
  return `<div class="wnav"><button class="sm" data-jr="cprev" aria-label="Mois précédent">‹</button><b>${MONTHS[m]} ${y}</b><button class="sm" data-jr="cnext" aria-label="Mois suivant">›</button></div>
  <div class="calg">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(x => `<small>${x}</small>`).join('')}${cells.map(t => { const A = byDay.get(t.toDateString()) || [], ks = [...new Set(A.map(KIND))]; return `<button class="cday ${t.getMonth() !== m ? 'out' : ''} ${t.toDateString() === today ? 'today' : ''} ${t.toDateString() === selDay ? 'sel' : ''} ${A.length ? 'has' : ''}" data-jr="day" data-v="${t.toDateString()}"><b>${t.getDate()}</b><span class="cdots">${ks.map(k => `<i style="background:${COL[k]}" title="${LBL[k]}"></i>`).join('')}</span><span class="cico">${ks.map(k => ICO[k]).join('')}</span></button>`; }).join('')}</div>
  <div class="legend">${['gym', 'run', 'bike'].filter(HAS).map(k => `<span><i style="background:${COL[k]}"></i>${LBL[k]}</span>`).join('')}</div>
  <section class="tcard"><div class="eyebrow">${new Date(selDay).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
    ${sel.length ? sel.map(actRow).join('') : `<p class="tiny">${new Date(selDay) > new Date() ? 'Rien de fait ce jour-là pour l\'instant.' : 'Repos ce jour-là.'}</p>`}
    ${plans.length ? `<p class="tiny" style="margin-top:8px">Prévu : ${plans.map(esc).join(', ')}</p>` : ''}</section>
  <div class="eyebrow" style="margin-top:14px">Bilan de ${MONTHS[m]}</div>
  <div class="mtiles">${[['gym', ML.filter(l => KIND(l) === 'gym').length, 'séances'], ['run', fr(ML.filter(l => KIND(l) === 'run').reduce((a, l) => a + l.km, 0), 1), 'km de course'], ['bike', fr(ML.filter(l => KIND(l) === 'bike').reduce((a, l) => a + l.km, 0), 0), 'km de vélo'], [null, hm(ML.reduce((a, l) => a + durS(l), 0)), 'de sport']].map(([k, v, u]) => `<div class="mini"><b>${k ? ICO[k] + ' ' : '⏱️ '}${v}</b><small>${u}</small></div>`).join('')}</div>`;
}
/* ---------- chiffres ---------- */
function recRows(R) { return `<div class="recs">${R.filter(Boolean).map(([i, l, v, s, id]) => `<${id ? `button data-jr="detail" data-v="${esc(id)}"` : 'div'} class="recrow"><span>${i}</span><span><small>${l}</small><b>${v}</b></span><em>${s || ''}</em></${id ? 'button' : 'div'}>`).join('')}</div>`; }
function vRun() {
  const R = allLog().filter(l => KIND(l) === 'run' && l.km), W = weeksBack(12), M = monthsBack(8), now = new Date();
  if (!R.length) return '<div class="tcard"><p class="small">Tes courses apparaîtront ici : connecte Strava (si disponible) ou note-les à la main.</p><button class="p wide" data-act="addact" data-k="run">+ Noter une course</button></div>';
  const kmW = W.map(w => R.filter(l => inWeek(l, w)).reduce((a, l) => a + l.km, 0));
  const pM = M.map(m => { const x = R.filter(l => inMonth(l, m) && l.km >= 3); return x.length ? x.reduce((a, l) => a + l.sec, 0) / x.reduce((a, l) => a + l.km, 0) : null; });
  const thisM = R.filter(l => inMonth(l, now)), yr = R.filter(l => new Date(l.start).getFullYear() === now.getFullYear());
  const last5 = R.filter(l => l.km >= 3).slice(-5), avg = last5.length ? last5.reduce((a, l) => a + paceOf(l), 0) / last5.length : 0;
  const best = (f, min) => R.filter(l => l.km >= min).reduce((b, l) => !b || f(l) < f(b) ? l : b, null);
  const fast5 = best(paceOf, 5), ten = best(l => l.sec, 9.9), longest = R.reduce((b, l) => !b || l.km > b.km ? l : b, null), climb = R.reduce((b, l) => !b || (l.elev || 0) > (b.elev || 0) ? l : b, null);
  return `<div class="kt">${[['Ce mois-ci', fr(thisM.reduce((a, l) => a + l.km, 0), 1) + ' km', thisM.length + ' sortie' + (thisM.length > 1 ? 's' : '')], ['En ' + now.getFullYear(), fr(yr.reduce((a, l) => a + l.km, 0), 0) + ' km', yr.length + ' sorties'], ['Allure récente', mm(avg) + '/km', '5 dernières'], (window.PROFILE.goal() ? ['Vs ' + mm(window.PROFILE.goal()) + '/km', avg <= window.PROFILE.goal() ? 'Atteint' : '+' + Math.round(avg - window.PROFILE.goal()) + ' s', 'à gagner par km'] : ['Course moyenne', fr(R.reduce((a, l) => a + l.km, 0) / R.length, 1) + ' km', R.length + ' courses en tout'])].map(([a, b, c]) => `<div><small>${a}</small><b>${b}</b><em>${c}</em></div>`).join('')}</div>
  <div class="cgrid"><section class="tcard"><h2 class="h2s">Kilomètres par semaine</h2>${cols(kmW, W.map(wLbl), { fmt: v => fr(v, v < 10 ? 1 : 0), color: COL.run })}<p class="tiny">Les 12 dernières semaines. En foncé : cette semaine.</p></section>
  <section class="tcard"><h2 class="h2s">Allure moyenne par mois</h2>${cols(pM, M.map(mLbl), { invert: true, fmt: mm, color: COL.run, goal: window.PROFILE.goal() || undefined, goalLbl: window.PROFILE.goalTxt(), empty: 'Pas encore assez de courses.' })}<p class="tiny">Plus la barre est haute, plus tu étais rapide.${window.PROFILE.goal() ? ' La ligne verte, c\'est ton objectif.' : ''}</p></section></div>
  <h2 class="h2t">Mes records de course</h2>${recRows([ten && ['🏁', 'Meilleur 10 km et plus', mm(ten.sec / ten.km * 10).replace(/^(\d+):/, (x, a) => a + ':'), dS(ten.start), ten.id], fast5 && ['⚡', 'Meilleure allure (5 km et plus)', mm(paceOf(fast5)) + '/km', fr(fast5.km, 1) + ' km · ' + dS(fast5.start), fast5.id], longest && ['📏', 'Plus longue sortie', fr(longest.km, 1) + ' km', dS(longest.start), longest.id], climb && climb.elev && ['⛰️', 'Plus de dénivelé', climb.elev + ' m D+', dS(climb.start), climb.id]])}
  <h2 class="h2t">Dernières courses</h2><div class="tcard" style="padding:4px 14px">${R.slice(-6).reverse().map(actRow).join('')}</div>`;
}
function vBike() {
  const R = allLog().filter(l => KIND(l) === 'bike' && l.km), W = weeksBack(12), M = monthsBack(8), now = new Date();
  if (!R.length) return '<div class="tcard"><p class="small">Tes sorties vélo apparaîtront ici : connecte Strava (si disponible) ou note-les à la main.</p><button class="p wide" data-act="addact" data-k="bike">+ Noter une sortie vélo</button></div>';
  const kmM = M.map(m => R.filter(l => inMonth(l, m)).reduce((a, l) => a + l.km, 0));
  const vM = M.map(m => { const x = R.filter(l => inMonth(l, m)); return x.length ? x.reduce((a, l) => a + l.km, 0) / x.reduce((a, l) => a + l.sec, 0) * 3600 : null; });
  const kmW = W.map(w => R.filter(l => inWeek(l, w)).reduce((a, l) => a + l.km, 0));
  const thisM = R.filter(l => inMonth(l, now)), yr = R.filter(l => new Date(l.start).getFullYear() === now.getFullYear());
  const top = f => R.reduce((b, l) => !b || f(l) > f(b) ? l : b, null), longest = top(l => l.km), climb = top(l => l.elev || 0), fast = R.filter(l => l.km >= 30).reduce((b, l) => !b || kmhOf(l) > kmhOf(b) ? l : b, null);
  return `<div class="kt">${[['Ce mois-ci', fr(thisM.reduce((a, l) => a + l.km, 0), 0) + ' km', thisM.length + ' sortie' + (thisM.length > 1 ? 's' : '')], ['En ' + now.getFullYear(), fr(yr.reduce((a, l) => a + l.km, 0), 0) + ' km', fr(yr.reduce((a, l) => a + (l.elev || 0), 0), 0) + ' m D+'], ['Vitesse moy.', fr(R.slice(-5).reduce((a, l) => a + l.km, 0) / R.slice(-5).reduce((a, l) => a + l.sec, 0) * 3600, 1) + ' km/h', '5 dernières'], ['Sortie moyenne', fr(R.reduce((a, l) => a + l.km, 0) / R.length, 0) + ' km', R.length + ' sorties en tout']].map(([a, b, c]) => `<div><small>${a}</small><b>${b}</b><em>${c}</em></div>`).join('')}</div>
  <div class="cgrid"><section class="tcard"><h2 class="h2s">Kilomètres par mois</h2>${cols(kmM, M.map(mLbl), { fmt: v => fr(v, 0), color: COL.bike })}<p class="tiny">Les 8 derniers mois. En foncé : ce mois-ci.</p></section>
  <section class="tcard"><h2 class="h2s">Vitesse moyenne par mois</h2>${cols(vM, M.map(mLbl), { fmt: v => fr(v, 1), color: COL.bike, lo: 0, empty: 'Pas encore assez de sorties.' })}<p class="tiny">En km/h. Attention : le dénivelé fait baisser la moyenne.</p></section></div>
  <section class="tcard"><h2 class="h2s">Kilomètres par semaine</h2>${cols(kmW, W.map(wLbl), { fmt: v => fr(v, 0), color: COL.bike })}</section>
  <h2 class="h2t">Mes records vélo</h2>${recRows([longest && ['📏', 'Plus longue sortie', fr(longest.km, 1) + ' km', dS(longest.start), longest.id], climb && climb.elev && ['⛰️', 'Plus de dénivelé', climb.elev + ' m D+', fr(climb.km, 0) + ' km · ' + dS(climb.start), climb.id], fast && ['⚡', 'Plus rapide (30 km et plus)', fr(kmhOf(fast), 1) + ' km/h', fr(fast.km, 0) + ' km · ' + dS(fast.start), fast.id]])}
  <h2 class="h2t">Dernières sorties</h2><div class="tcard" style="padding:4px 14px">${R.slice(-6).reverse().map(actRow).join('')}</div>`;
}
function vGym() {
  const REC = C().REC(), bw = C().body().w, L = gym(), now = new Date(), st = stats(), W = weeksBack(12), M = monthsBack(6);
  if (!L.length) return `<div class="tcard"><p class="small">Tes chiffres de muscu (séances par semaine, kilos soulevés, 1RM, records) apparaîtront ici après ta première séance en mode salle.</p><button class="p wide" data-act="goto" data-v="program">Lancer une séance</button></div>`;
  const recs = [...REC.values()].sort((a, b) => b.e1 - a.e1), yr = L.filter(s => new Date(s.start).getFullYear() === now.getFullYear() && (s.prs || []).length);
  return `<div class="kt">${[['Séances', st.n, 'au total'], ['Soulevé', fr(st.ton / 1000, 1) + ' t', 'au total'], ['Records', st.prs, 'battus'], ['Durée moy.', Math.round(L.reduce((a, s) => a + mmin(s), 0) / L.length) + ' min', 'par séance']].map(([a, b, c]) => `<div><small>${a}</small><b>${b}</b><em>${c}</em></div>`).join('')}</div>
  <div class="cgrid"><section class="tcard"><h2 class="h2s">Séances par semaine</h2>${cols(W.map(w => L.filter(s => inWeek(s, w)).length), W.map(wLbl), { goal: C().S().set.goal, goalLbl: 'objectif', hi: Math.max(C().S().set.goal + 1, ...W.map(w => L.filter(s => inWeek(s, w)).length)) })}</section>
  <section class="tcard"><h2 class="h2s">Kilos soulevés par mois</h2>${cols(M.map(m => L.filter(s => inMonth(s, m)).reduce((a, s) => a + (s.vol || 0), 0)), M.map(mLbl), { fmt: v => v >= 1000 ? fr(v / 1000, 1) + ' t' : fr(v) })}</section></div>
  <h2 class="h2t">Mes 1RM estimés</h2><p class="sub2">Ta charge max sur une répétition, et ce qu'elle représente par rapport à ton poids (${fk(bw)} kg).</p>
  <div class="tcard" style="padding:4px 12px">${recs.slice(0, 10).map(R => `<button class="rmrow" data-jr="exo" data-v="${esc(R.id || '')}"><span><b>${esc(R.n)}</b><small>record ${fk(R.kg)} kg × ${R.r || 1} · ${dS(R.t)}</small></span><span class="rmv"><b>${fk(R.e1)} kg</b><small>${fr(R.e1 / bw, 2)} × ton poids</small></span></button>`).join('') || '<p class="tiny">Pas encore de record.</p>'}</div>
  <h2 class="h2t">Mes PR de l'année</h2><div class="frise">${yr.slice().reverse().map(s => `<div class="fr-i"><i></i><small>${dS(s.start)}</small><b>${s.prs.map(esc).join(', ')}</b></div>`).join('') || '<p class="tiny">Aucun record cette année pour l\'instant.</p>'}</div>`;
}
function vChiffres() {
  const L = allLog(), ks = ['run', 'bike', 'gym'].filter(HAS); if (!sport || !ks.includes(sport)) { const l = L.filter(x => ks.includes(KIND(x))).at(-1); sport = l ? KIND(l) : ks[0] || 'gym'; }
  const n = k => L.filter(l => KIND(l) === k).length;
  return `<div class="sportseg" style="grid-template-columns:repeat(${ks.length},minmax(0,1fr))">${ks.map(k => `<button class="${sport === k ? 'sel' : ''}" style="--c:${COL[k]}" data-jr="sport" data-v="${k}"><span>${ICO[k]}</span>${LBL[k]}<small>${n(k)}</small></button>`).join('')}</div>
  ${{ run: vRun, bike: vBike, gym: vGym }[sport]()}`;
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
    case 'detail': if (window.DESK) { window.DESK.openAna(v, 'progress'); return; } sessionSheet(v); return;
    case 'day': selDay = v; break;
    case 'sport': sport = v; break;
    case 'exo': if (!v) return; if (tab !== 'exos') tab = 'exos'; exOpen = v; window.scrollTo(0, 0); break;
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
