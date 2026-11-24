'use strict';
{
/* ---------- outils ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const yt = q => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
const num = v => parseFloat(String(v ?? '').replace(',', '.')) || 0;
const fmt = s => { s = Math.max(0, Math.floor(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
const restLabel = s => s >= 60 ? Math.floor(s / 60) + ' min' + (s % 60 ? ' ' + s % 60 : '') : s + ' s';
const dateFr = ts => new Date(ts).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
const X = (id, n, sets, reps, rest, q) => ({ id, n, sets, reps, rest, q: q || n + ' technique' });
const FLAME = '<svg class="flame" viewBox="0 0 48 64" aria-hidden="true"><defs><linearGradient id="fg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e0262e"/><stop offset=".6" stop-color="#ff7a1a"/><stop offset="1" stop-color="#ffc24a"/></linearGradient></defs><path fill="url(#fg)" d="M24 2c3 11 16 18 16 34a16 16 0 0 1-32 0c0-8 4-14 9-18 0 6 2 10 6 12-1-10 0-19 1-28z"/><path fill="#ffe39a" opacity=".85" d="M24 34c2 5 7 7 7 13a7 7 0 0 1-14 0c0-4 3-7 5-9 0 3 1 4 2 5 0-4 0-6 0-9z"/></svg>';

/* ---------- programme de base ---------- */
const ABS = {
  A: [X('leg', 'Relevés de jambes suspendu', 3, '10-15', 45), X('crpou', 'Crunch poulie haute à genoux', 3, '12-15', 45), X('planche', 'Planche (secondes)', 3, '45-60', 45, 'gainage planche technique')],
  B: [X('roue', 'Roulette abdos', 3, '8-12', 45, 'roulette abdos ab wheel technique'), X('crmach', 'Crunch machine', 3, '15', 45), X('gainlat', 'Gainage latéral (s / côté)', 3, '30', 45, 'gainage lateral technique')],
  C: [X('pallof', 'Pallof press poulie', 3, '12', 45, 'pallof press poulie'), X('hollow', 'Hollow body (secondes)', 3, '30', 45, 'hollow body hold'), X('genoux', 'Relevés de genoux chaise romaine', 3, '15', 45)]
};
const defaultProgram = () => JSON.parse(JSON.stringify([
  { id: 'pecsA', name: 'Pecs A', sub: 'Force aux machines · épaules · triceps · jambes', ex: [X('mchest', 'Chest press assis (machine)', 4, '6-8', 150, 'chest press machine assis technique'), X('minclp', 'Chest press inclinée (machine)', 3, '8-10', 120, 'incline chest press machine technique'), X('pecdeck', 'Pec deck (pec fly)', 3, '12-15', 60, 'pec deck butterfly machine technique'), X('mshoul', 'Développé épaules (machine)', 3, '8-10', 120, 'shoulder press machine technique'), X('mlat', 'Élévations latérales (machine)', 3, '12-15', 60, 'lateral raise machine technique'), X('oiseau', 'Oiseau machine (arrière d\'épaules)', 3, '15', 60, 'reverse pec deck technique'), X('mdips', 'Dips assistés (machine)', 3, '8-12', 90, 'dips assistes machine technique'), X('bulg', 'Fentes bulgares haltères (/ jambe)', 3, '8', 90), X('mollet', 'Mollets debout machine', 3, '12-15', 60)] },
  { id: 'dosA', name: 'Dos A', sub: 'Force · biceps · abdos A', ex: [X('tract', 'Tractions', 4, '6-8', 150, 'tractions pronation technique'), X('mrow', 'Rowing machine poitrine appuyée', 4, '8-10', 120, 'chest supported row machine technique'), X('tirhs', 'Tirage vertical Hammer Strength', 3, '10', 90, 'hammer strength iso lateral pulldown'), X('rowp', 'Rowing assis poulie prise serrée', 3, '10-12', 90), X('pullo', 'Pull-over poulie haute', 3, '12-15', 60), X('facep', 'Face pull corde', 3, '15', 60), X('curlez', 'Curl barre EZ', 3, '8-10', 75), X('marteau', 'Curl marteau', 2, '12', 60), ...ABS.A] },
  { id: 'pecsB', name: 'Pecs B', sub: 'Volume aux machines · épaules · triceps · abdos B', ex: [X('chesti', 'Chest press inclinée Hammer Strength', 4, '8-10', 120, 'hammer strength incline chest press'), X('chestp', 'Chest press convergente Hammer Strength', 3, '10-12', 90, 'hammer strength chest press'), X('pecdeck', 'Pec deck (pec fly)', 3, '15', 60, 'pec deck butterfly machine technique'), X('mshoul', 'Développé épaules (machine)', 3, '10-12', 90, 'shoulder press machine technique'), X('mlat', 'Élévations latérales (machine)', 4, '15', 60, 'lateral raise machine technique'), X('oiseau', 'Oiseau machine (arrière d\'épaules)', 3, '15', 60, 'reverse pec deck technique'), X('tricorde', 'Extension triceps corde', 3, '12-15', 60), X('mtri', 'Extension triceps (machine)', 2, '12', 60, 'triceps extension machine technique'), ...ABS.B] },
  { id: 'dosB', name: 'Dos B', sub: 'Volume · biceps · lombaires · abdos C', ex: [X('rowiso', 'Rowing Iso-Lateral Hammer Strength', 4, '8-10', 120, 'hammer strength iso lateral row'), X('tirneu', 'Tirage vertical prise neutre serrée', 4, '10', 90), X('rowuni', 'Rowing unilatéral haltère (/ bras)', 3, '10', 75), X('bratend', 'Tirage bras tendus poulie', 3, '15', 60), X('shrug', 'Shrugs haltères', 3, '12', 60), X('curlinc', 'Curl incliné haltères', 3, '10-12', 60), X('curlpb', 'Curl poulie basse', 2, '15', 60), X('lomb', 'Extensions lombaires banc 45°', 3, '15', 60), X('pompes', 'Pompes lestées (bonus pecs)', 2, 'max', 60), ...ABS.C] }
]));
const prSession = () => ({ id: 'prday', name: 'Séance PR', kind: 'pr', sub: 'Battre tes records : échauffement calculé puis tentatives', ex: [X('mchest', 'Chest press assis (machine)', 5, '1-3', 180, 'chest press machine assis technique'), X('minclp', 'Chest press inclinée (machine)', 5, '1-3', 180, 'incline chest press machine technique'), X('mshoul', 'Développé épaules (machine)', 5, '1-3', 180, 'shoulder press machine technique'), X('mrow', 'Rowing machine poitrine appuyée', 5, '1-3', 180, 'chest supported row machine technique'), X('tirhs', 'Tirage vertical Hammer Strength', 5, '1-3', 180, 'hammer strength iso lateral pulldown')] });
// Exercices retirés du programme, gardés pour pouvoir les rajouter (« + Ajouter un exercice »).
const SPARE = [X('bench', 'Développé couché barre', 4, '6-8', 150), X('inclh', 'Développé incliné haltères 30°', 3, '8-10', 120), X('inclb', 'Développé incliné barre ou Smith', 4, '8-10', 120), X('couchh', 'Développé couché haltères', 3, '10-12', 90), X('milit', 'Développé militaire haltères assis', 3, '8-10', 120), X('ecpou', 'Écarté poulie vis-à-vis', 3, '12-15', 60), X('ecbh', 'Écarté poulie bas vers haut', 3, '15', 60), X('latpou', 'Élévations latérales poulie', 3, '12-15', 60), X('lath', 'Élévations latérales haltères', 4, '15', 60), X('dips', 'Dips', 3, '8-12', 90, 'dips pectoraux technique'), X('front', 'Barre au front EZ', 2, '10-12', 75), X('rowb', 'Rowing barre buste penché', 4, '8', 120)];
const RUNS = [{ t: '6 × 1 000 m', d: '4:25–4:30 /km, récup 2 min en trottinant' }, { t: '3 × 2 km tempo', d: '4:40–4:45 /km, récup 2 min' }, { t: '10 × 400 m', d: '4:05–4:10 /km, récup 1 min 15' }];
const isoWeek = ts => { const d = new Date(ts), t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7)); return Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7); };
const monday = ts => { const d = new Date(ts); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };

/* ---------- état ---------- */
const KEY = 'carnet-sport.v1';
let S = null;
try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { }
if (!S || !Array.isArray(S.program)) S = { progV: 2, program: [...defaultProgram(), prSession()], lib: [], log: [], draft: null, badges: {}, set: { spotify: '', goal: 1, exRest: 180 } };
S.set = { spotify: '', goal: 1, exRest: 180, ...S.set }; S.lib = S.lib || []; S.badges = S.badges || {}; S.guides = S.guides || {};
S.set.theme = S.set.theme || 'chrono';
if (!S.body) S.body = { h: (S.cal && S.cal.h) || 176, birth: new Date().getFullYear() - ((S.cal && S.cal.age) || 20), weights: [{ t: Date.now(), kg: (S.cal && S.cal.w) || 67 }], meas: [] };
const body = () => { const ws = S.body.weights || []; return { h: S.body.h || 176, age: new Date().getFullYear() - (S.body.birth || 2006), w: ws.length ? ws[ws.length - 1].kg : 67 }; };
for (const e of SPARE) if (!S.lib.some(x => x.id === e.id)) S.lib.push(e);
if (!S.program.some(p => p.id === 'prday')) S.program.push(prSession());
if (!S.plans) { const f = Date.now() - 864e5 * 400, P = (id, kind, sid, name, d, moment) => ({ id, kind, sid, name, days: [d], repeat: 'week', moment, from: f });
  S.plans = [P('p_pa', 'muscu', 'pecsA', '', 1, 'apm'), P('p_da', 'muscu', 'dosA', '', 2, 'apm'), P('p_run', 'run', '', 'Course · fractionné', 3, 'soir'), P('p_pb', 'muscu', 'pecsB', '', 4, 'apm'), P('p_db', 'muscu', 'dosB', '', 5, 'apm'), P('p_bike', 'bike', '', 'Vélo de route', 6, 'matin')]; }
if ((S.progV || 1) < 2) { const d = defaultProgram(); for (const id of ['pecsA', 'pecsB', 'dosA']) { const i = S.program.findIndex(p => p.id === id), n = d.find(p => p.id === id); if (i >= 0) S.program[i] = n; } S.progV = 2; }
let saveFail = false;
const save = () => { window.SYNC && window.SYNC.track(S); try { localStorage.setItem(KEY, JSON.stringify(S)); saveFail = false; } catch (e) { if (!saveFail) toast('Mémoire du téléphone pleine : exporte tes données'); saveFail = true; } };
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { }
let view = S.draft ? 'workout' : 'home';

/* ---------- médias perso (IndexedDB) ---------- */
let idb = null;
const idbReady = new Promise(res => { try { const r = indexedDB.open('carnet-media', 1); r.onupgradeneeded = () => r.result.createObjectStore('media', { keyPath: 'k', autoIncrement: true }).createIndex('ex', 'ex'); r.onsuccess = () => { idb = r.result; res(); }; r.onerror = () => res(); } catch (e) { res(); } });
const mediaFor = ex => new Promise(res => { if (!idb) return res([]); try { const q = idb.transaction('media').objectStore('media').index('ex').getAll(ex); q.onsuccess = () => res(q.result || []); q.onerror = () => res([]); } catch (e) { res([]); } });
const mediaWrap = st => ({ raw: st, get: k => st.get(k), getAll: (...x) => st.getAll(...x), index: n => st.index(n), put: r => st.put(r),
  add: r => { if (!r.uid && window.SYNC) r.uid = window.SYNC.uid(); return st.add(r); },
  delete: k => { const g = st.get(k); g.onsuccess = () => { if (g.result && g.result.uid && window.SYNC) window.SYNC.tomb(g.result.uid); st.delete(k); }; } });
const mediaTx = (fn) => new Promise(res => { if (!idb) return res(); const t = idb.transaction('media', 'readwrite'); fn(mediaWrap(t.objectStore('media'))); t.oncomplete = res; t.onerror = () => { toast("Impossible d'enregistrer ce fichier"); res(); }; });
const objUrls = [];
async function fillMedia(exId) {
  await idbReady; const boxes = document.querySelectorAll(`[data-media="${CSS.escape(exId)}"]`); if (!boxes.length) return;
  const list = await mediaFor(exId);
  for (const box of boxes) box.innerHTML = list.length ? list.map(m => { const u = URL.createObjectURL(m.blob); objUrls.push(u); return `<figure>${String(m.type).startsWith('video') ? `<video src="${u}" muted loop playsinline controls preload="metadata"></video>` : `<img src="${u}" alt="Ma démo">`}<button data-act="delmedia" data-k="${m.k}" data-ex="${esc(exId)}">Retirer</button></figure>`; }).join('') : '<p class="tiny">Aucune photo ni vidéo pour cet exercice. Ajoute la tienne, elle sera dispo même sans réseau.</p>';
}

/* ---------- calculs ---------- */
const LIB = window.LIBRARY || [], LIBM = new Map(LIB.map(e => [e.id, e]));
const allEx = () => { const m = new Map(); for (const s of S.program) for (const e of s.ex) if (!m.has(e.id)) m.set(e.id, e); for (const e of S.lib) if (!m.has(e.id)) m.set(e.id, e); for (const e of LIB) if (!m.has(e.id)) m.set(e.id, e); return m; };
const metaOf = id => LIBM.get(id) || S.lib.find(e => e.id === id) || {};
const orm = (kg, r) => { r = parseInt(r) || 1; return r <= 1 ? kg : Math.round(kg * (1 + Math.min(r, 12) / 30) * 10) / 10; };
const r25 = v => Math.round(v / 2.5) * 2.5;
function records(before = Infinity) {
  const m = new Map();
  for (const s of S.log) { if (s.start >= before) continue; for (const e of s.ex || []) for (const x of e.sets) {
    if (x.t === 'e') continue; const kg = num(x.kg); if (kg <= 0) continue;
    let R = m.get(e.id); if (!R) { R = { id: e.id, n: e.n, kg: 0, r: 0, t: 0, e1: 0, hist: [] }; m.set(e.id, R); }
    R.n = e.n; R.e1 = Math.max(R.e1, orm(kg, x.r));
    if (kg > R.kg) { R.hist.push({ kg, r: x.r, t: s.start }); R.kg = kg; R.r = x.r || 0; R.t = s.start; } else if (kg === R.kg && (x.r || 0) > R.r) { R.r = x.r; R.t = s.start; }
  } }
  return m;
}
let REC = records(); const refreshRec = () => { REC = records(); };
const lastSets = id => { for (let i = S.log.length - 1; i >= 0; i--) { const e = (S.log[i].ex || []).find(x => x.id === id && x.sets.length); if (e) return e.sets; } return null; };
const bestKg = (id, before = Infinity) => { let b = 0; for (const s of S.log) if (s.start < before) for (const e of s.ex || []) if (e.id === id) for (const x of e.sets) b = Math.max(b, num(x.kg)); return b; };
const setsTxt = sets => sets.filter(x => x.t !== 'e').map(x => `${num(x.kg)} kg × ${x.r || '?'}${x.t === 'd' ? ' (dégressive)' : x.t === 'f' ? ' (échec)' : ''}`).join(' · ');
const lastDone = sid => { for (let i = S.log.length - 1; i >= 0; i--) if (S.log[i].sid === sid) return S.log[i].start; return 0; };
const suggested = () => [...S.program].sort((a, b) => lastDone(a.id) - lastDone(b.id))[0];
const weekCounts = () => { const m = new Map(); for (const s of S.log) { if (s.kind === 'run' || s.kind === 'bike') continue; const k = monday(s.start); m.set(k, (m.get(k) || 0) + 1); } return m; };
function streak() {
  const m = weekCounts(), goal = S.set.goal, W = 7 * 864e5; let wk = monday(Date.now()), n = 0;
  const thisWeek = m.get(wk) || 0, ok = thisWeek >= goal;
  if (!ok) wk -= W;
  while ((m.get(wk) || 0) >= goal) { n++; wk -= W; }
  return { n, ok, thisWeek };
}
const tonnage = () => S.log.reduce((a, s) => a + (s.vol || 0), 0);
const prCount = () => S.log.reduce((a, s) => a + (s.prs || []).length, 0);
const setTag = t => ({ e: 'E', d: 'D', f: 'F' }[t] || '');
const BADGES = window.BADGES2;
function checkBadges() { const fresh = []; S.best = Math.max(S.best || 0, streak().n); for (const b of BADGES) if (!S.badges[b.id] && b.ok()) { S.badges[b.id] = Date.now(); fresh.push(b); } return fresh; }
const badgeHtml = (b, on) => window.medal(b, on);

/* ---------- rendu ---------- */
const app = $('#app');
function go(v) { view = v; render(); window.scrollTo(0, 0); }
function render() {
  for (const b of document.querySelectorAll('#nav button')) b.classList.toggle('sel', b.dataset.view === view);
  const V = window.VIEWS || {};
  app.innerHTML = ({ home: vHome, workout: vWorkout, program: V.seances, progress: V.journal, tools: V.tools, me: V.me }[view] || V[view] || vHome)();
  document.body.dataset.view = view;
  const A = (window.AFTER || {})[view]; if (A) try { A(); } catch (e) { console.error(e); }
  if (view === 'workout' && S.draft) { const c = S.draft.ex[S.draft.cur]; if (c) { fillMedia(c.id); fillGymMedia(c.id); } }
  if (view === 'progress') drawChart();
  tick();
}
const spotifyBtn = (cls = '') => S.set.spotify ? `<a class="btn ${cls}" href="${esc(S.set.spotify)}" target="_blank" rel="noopener">Musique Spotify</a>` : '';

function vHome() {
  const st = streak(), D = S.draft, now = Date.now(), d0 = new Date(); d0.setHours(0, 0, 0, 0); const t0 = d0.getTime();
  const V = window.VIEWS || {}, plansT = (V.plansAll ? V.plansAll(t0) : []), doneT = S.log.filter(l => l.start >= t0);
  const todo = (V.plannedToday ? V.plannedToday() : []);
  const nm = p => p.kind === 'muscu' ? (S.program.find(x => x.id === p.sid) || {}).name || 'Séance' : p.name || (p.kind === 'run' ? 'Course' : 'Vélo');
  const est = s => { let sec = 0; for (const e of s.ex) sec += (+e.sets || 0) * (45 + (+e.rest || 60)); return Math.round(sec / 60); };
  const kindOf = l => l.kind === 'run' ? 'run' : l.kind === 'bike' ? 'bike' : 'gym', ICO = { gym: '🏋️', run: '🏃', bike: '🚴', muscu: '🏋️' };
  const mm = s => Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0');
  // course : où en est-on ?
  const runs = S.log.filter(l => l.kind === 'run' && l.km >= 3).sort((a, b) => a.start - b.start), last5 = runs.slice(-5);
  const P = last5.length ? last5.reduce((a, l) => a + (l.pace || l.sec / l.km), 0) / last5.length : 0, lastRun = runs.at(-1);
  const week7 = runs.filter(l => l.start > now - 7 * 864e5), quality = week7.some(l => (l.pace || l.sec / l.km) < Math.min(P - 12, 300) || /fraction|interv|tempo|seuil|vma/i.test(l.name));
  const hSince = lastRun ? (now - lastRun.start) / 36e5 : 999;
  const runAdv = !runs.length ? { t: 'Première sortie', d: '30 min tranquille, en aisance respiratoire (tu peux parler).', why: 'Pour poser une base.' }
    : hSince < 30 ? { t: 'Récupération', d: 'Pas de course aujourd\'hui, ou 25 min très lent (6:30/km et plus).', why: `Tu as couru il y a ${Math.round(hSince)} h : laisse tes jambes récupérer.` }
    : !week7.length ? { t: 'Reprise en endurance', d: '35–40 min à 5:50–6:20/km, FC en zone 2 (131–162 bpm).', why: 'Aucune course depuis 7 jours.' }
    : !quality ? { t: RUNS[isoWeek(now) % 3].t, d: RUNS[isoWeek(now) % 3].d + '. Échauffement 15 min, retour au calme 10 min.', why: 'Que de l\'endurance cette semaine : c\'est le fractionné qui te rapproche de 4:30.' }
    : { t: 'Sortie longue tranquille', d: '10–12 km à 5:45–6:15/km, en zone 2.', why: 'Tu as déjà fait ta séance rapide : place au volume.' };
  // semaine
  const w0 = monday(now), W = S.log.filter(l => l.start >= w0), weekPlans = Array.from({ length: 7 }, (_, i) => V.plansAll ? V.plansAll(w0 + i * 864e5) : []).flat();
  const goals = { gym: S.set.goal, run: Math.max(1, weekPlans.filter(p => p.kind === 'run').length), bike: Math.max(1, weekPlans.filter(p => p.kind === 'bike').length) };
  const got = { gym: W.filter(l => kindOf(l) === 'gym').length, run: W.filter(l => l.kind === 'run').length, bike: W.filter(l => l.kind === 'bike').length };
  const km = { run: W.filter(l => l.kind === 'run').reduce((a, l) => a + l.km, 0), bike: W.filter(l => l.kind === 'bike').reduce((a, l) => a + l.km, 0) };
  // aujourd'hui
  const first = D ? null : todo[0], tpl = first && first.kind === 'muscu' && S.program.find(x => x.id === first.sid), sug = suggested();
  let today;
  if (D) today = `<div class="today live"><div class="eyebrow">Séance en cours</div><h2>${esc(D.name)}</h2><p class="small mute">${D.ex.filter(e => e.sets.every(s => s.ok)).length}/${D.ex.length} exercices faits</p><button class="p wide" data-act="goto" data-v="workout">Reprendre la séance</button></div>`;
  else if (tpl) { const ms = [...new Set(tpl.ex.map(e => metaOf(e.id).m).filter(Boolean))]; today = `<div class="today"><div class="eyebrow">Aujourd'hui · ${esc(({ matin: 'matin', midi: 'midi', apm: 'après-midi', soir: 'soir' })[first.moment] || '')}</div><div class="td-h"><div>${window.bodySvg(ms.length ? ms : ['Pecs'], { cls: 'td-body' })}</div><div><h2>${esc(tpl.name)}</h2><p class="small mute">${tpl.ex.length} exercices · ≈ ${est(tpl)} min</p><div class="chipsrow">${ms.slice(0, 4).map(m => `<span class="chip2">${esc(m)}</span>`).join('')}</div></div></div><div class="row"><button class="p grow" data-act="start" data-sid="${tpl.id}">Commencer</button>${spotifyBtn('grow')}</div><button class="link" data-act="goto" data-v="program" style="margin-top:8px">Faire une autre séance</button></div>`; }
  else if (first && first.kind === 'run') today = `<div class="today run"><div class="eyebrow">Aujourd'hui · course</div><h2>🏃 ${esc(runAdv.t)}</h2><p>${esc(runAdv.d)}</p><p class="tiny">${esc(runAdv.why)}</p><p class="tiny">Lance l'enregistrement sur Strava : la sortie arrivera toute seule ici.</p></div>`;
  else if (first && first.kind === 'bike') today = `<div class="today bike"><div class="eyebrow">Aujourd'hui · vélo</div><h2>🚴 ${isoWeek(now) % 4 === 0 ? 'Sortie « Pogačar » 60 km' : 'Endurance 50–70 km'}</h2><p>${isoWeek(now) % 4 === 0 ? '4 à 5 efforts de 5 min en côte, récup 3–4 min.' : 'Zone 2, régulier, mange toutes les 45 min.'}</p></div>`;
  else if (doneT.length) today = `<div class="today done"><div class="eyebrow">Aujourd'hui</div><h2>Bien joué ✓</h2>${doneT.map(l => `<button class="arow" data-lib="ana" data-id="${esc(l.id)}"><span class="a-ic" style="--c:var(--acc)">${ICO[kindOf(l)]}</span><span class="a-t"><b>${esc(l.name)}</b><small>${l.km ? (l.km.toFixed ? l.km.toFixed(1).replace('.', ',') : l.km) + ' km' : (l.vol || 0) + ' kg'}</small></span><span class="mer-go">›</span></button>`).join('')}<p class="tiny">Pense à bien manger et à dormir : c'est là que tu progresses.</p></div>`;
  else today = `<div class="today rest"><div class="eyebrow">Aujourd'hui</div><h2>Jour de repos 😌</h2><p class="small mute">Rien de prévu. Envie de bouger quand même ?</p><div class="row"><button class="grow" data-act="start" data-sid="${sug.id}">${esc(sug.name)}</button><button class="grow" data-act="goto" data-v="program">Planifier</button></div></div>`;
  const wk8 = Array.from({ length: 8 }, (_, i) => { const k = monday(now) - (7 - i) * 7 * 864e5; return `<i class="${(weekCounts().get(k) || 0) >= S.set.goal ? 'on' : ''} ${k === monday(now) ? 'now' : ''}"></i>`; }).join('');
  const recent = S.log.filter(l => l.start > now - 7 * 864e5 && (l.prs || []).length).at(-1), badge = BADGES.filter(b => S.badges[b.id] && S.badges[b.id] > now - 7 * 864e5).at(-1);
  return `<div class="kicker">${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div><div class="between"><h1 class="hello">Bonjour <span class="wave">👋</span></h1><div class="row" style="gap:6px;flex-wrap:nowrap">${window.bellHtml ? window.bellHtml() : ''}<button class="sm" data-act="settings">Réglages</button></div></div>
  ${window.DELOAD && window.DELOAD.active() ? '<div class="dlcard on"><span>🧘</span><div><b>Semaine de décharge en cours</b><small>Charges à 60 %, une série en moins. Ton corps récupère et tu reviens plus fort.</small></div><button class="sm" data-ex="deloadoff">Terminer</button></div>' : window.DELOAD && window.DELOAD.due() ? '<div class="dlcard"><span>🧘</span><div><b>Semaine de décharge conseillée</b><small>Ça fait plusieurs semaines que tu pousses : une semaine plus légère évite blessure et stagnation.</small></div><button class="sm" data-ex="deloadon">Activer</button></div>' : ''}
  ${today}
  <section class="card hweek"><div class="hw-top">${FLAME.replace('class="flame"', `class="flame ${st.n || st.ok ? '' : 'off'}"`)}<div><b>${st.n} semaine${st.n > 1 ? 's' : ''} de suite</b><small>${st.ok ? 'Semaine validée, la flamme continue.' : `Encore ${S.set.goal - st.thisWeek} séance${S.set.goal - st.thisWeek > 1 ? 's' : ''} de muscu cette semaine pour la garder.`}</small><div class="weeks">${wk8}</div></div></div>
    <div class="hw-g">${[['gym', '🏋️', 'Muscu', got.gym + '/' + goals.gym, got.gym / goals.gym], ['run', '🏃', 'Course', fr1(km.run) + ' km', got.run / goals.run], ['bike', '🚴', 'Vélo', Math.round(km.bike) + ' km', got.bike / goals.bike]].map(([k, i, l, v, p]) => `<div class="hw-${k}"><span>${i} ${l}</span><b>${v}</b><i><em style="width:${Math.min(100, p * 100)}%"></em></i></div>`).join('')}</div></section>
  ${runs.length ? `<section class="card hrun"><div class="between"><div class="eyebrow" style="margin:0">Prochaine course conseillée</div><span class="${P <= 270 ? 'okchip' : 'chip2'}">${P <= 270 ? '4:30 atteint' : mm(P) + '/km · +' + Math.round(P - 270) + ' s'}</span></div><h3>${esc(runAdv.t)}</h3><p class="small">${esc(runAdv.d)}</p><p class="tiny">${esc(runAdv.why)}${lastRun ? ` Dernière course : ${fr1(lastRun.km)} km à ${mm(lastRun.pace || lastRun.sec / lastRun.km)}/km, ${dateFr(lastRun.start).toLowerCase().replace(/\.$/, '')}.` : ''}</p></section>` : ''}
  ${window.NUTRI ? (() => { const r = window.NUTRI.today(); return `<button class="card navcard nutcard" data-act="tool" data-k="nutri"><div style="flex:1"><div class="tiny">${doneT.some(l => kindOf(l) === 'gym') ? 'Après ta séance : vise les protéines' : 'Ma nutrition du jour'}</div><h3>${Math.round(r.p)} / ${r.tp} g de protéines</h3><div class="ch-bar"><i style="width:${Math.min(100, r.p / r.tp * 100)}%"></i></div><div class="tiny" style="margin-top:6px">${Math.round(r.kcal)} / ${r.tk} kcal</div></div><span class="sm btn">Noter</span></button>`; })() : ''}
  ${recent || badge ? `<section class="card hwin">${badge ? `<div class="hwin-m">${badgeHtml(badge, true)}</div>` : '<span class="hwin-i">🏆</span>'}<div><div class="eyebrow">Cette semaine</div><b>${recent ? 'Nouveau record : ' + esc(recent.prs[0]) : 'Badge débloqué : ' + esc(badge.n)}</b><small>${badge && recent ? 'Et le badge « ' + esc(badge.n) + ' » !' : ''}</small></div></section>` : ''}
  ${!S.set.spotify ? `<p class="tiny" style="text-align:center;margin-top:14px">Astuce : ajoute ta playlist Spotify dans Réglages pour la lancer d'ici.</p>` : ''}`;
}
const fr1 = v => (Math.round(v * 10) / 10).toLocaleString('fr-FR');

const demoBlock = (id, q, label) => `<details data-mfor="${esc(id)}" ${S.guides[id] || metaOf(id).tip ? 'open' : ''}><summary>${label}</summary>
  ${S.guides[id] ? `<p class="small" style="white-space:pre-wrap">${esc(S.guides[id])}</p>` : metaOf(id).tip ? `<p class="small mute">Conseil : ${esc(metaOf(id).tip)}</p>` : ''}
  <div class="media" data-media="${esc(id)}"></div>
  <div class="row"><label class="btn sm">Ajouter photo, GIF ou vidéo<input type="file" accept="image/*,video/*" multiple hidden data-add="${esc(id)}"></label><a class="btn sm" href="${yt(q)}" target="_blank" rel="noopener">Vidéos YouTube</a></div></details>`;
const TECH = ['Dégressive', 'Partielles', 'Tempo', 'Unilatéral', 'Forcées', 'Négatives', 'Explosives', 'Pause', 'Rest-pause', 'Isométrie'];
let techOpen = false, helpOpen = false, mediaHidden = false;
function gymMedia(e) { return `<div class="gmedia ${mediaHidden ? 'hid' : ''}"><div class="gm-in gm-empty" data-gm="${esc(e.id)}"><label class="gm-add"><span>＋</span>Ajouter un GIF ou une photo<input type="file" accept="image/*,video/*" hidden data-add="${esc(e.id)}"></label></div><button class="gm-hide" data-act="hidemedia">${mediaHidden ? 'Afficher' : 'Masquer'}</button></div>`; }
function gymMuscle(e) { const m = metaOf(e.id).m; return m ? `<div class="gmuscle">${window.bodySvg(m, { cls: 'gbody' })}<div><small>Zone travaillée</small><b>${esc(m)}</b></div></div>` : ''; }
async function fillGymMedia(id) { await idbReady; const box = document.querySelector(`[data-gm="${CSS.escape(id)}"]`); if (!box) return; const list = await mediaFor(id); if (!list.length) return; const m = list[0], u = URL.createObjectURL(m.blob); objUrls.push(u); box.innerHTML = String(m.type).startsWith('video') ? `<video src="${u}" muted loop playsinline autoplay></video>` : `<img src="${u}" alt="${esc(allEx().get(id)?.n || '')}">`; box.classList.add('photo'); box.classList.remove('gm-empty'); }
function vWorkout() {
  const D = S.draft;
  if (!D) return `<div class="kicker">Mode salle</div><h1>Séance</h1><div class="card"><p>Aucune séance en cours.</p><button class="p wide" data-act="goto" data-v="program">Choisir une séance</button></div>`;
  const e = D.ex[D.cur], n = D.ex.length;
  const segs = D.ex.map((x, i) => `<i class="${i === D.cur ? 'cur' : ''}"><b style="width:${x.sets.length ? x.sets.filter(z => z.ok).length / x.sets.length * 100 : 0}%"></b></i>`).join('');
  const top = `<div class="gtop"><div class="gt-l"><span class="gname">${esc(D.name)}</span><span class="gcount">${n ? D.cur + 1 : 0}/${n}</span></div><span class="gclock num" data-clock="total">0:00</span><button class="gicon" data-act="addex" aria-label="Ajouter un exercice">+</button><button class="gicon" data-act="gymquit" aria-label="Quitter le mode salle">×</button></div><div class="gprog">${segs}</div>`;
  if (!e) return `<div class="gym">${top}<div class="gempty"><h2>Séance libre</h2><p class="mute">Ajoute ton premier exercice.</p><button class="p wide" data-act="addex">+ Ajouter un exercice</button></div>${gymBottom(D)}</div>`;
  const l = lastSets(e.id), L = S.log.slice().reverse().find(x => (x.ex || []).some(y => y.id === e.id)), R = REC.get(e.id), meta = metaOf(e.id);
  const firstTodo = e.sets.findIndex(x => !x.ok);
  const tr = parseInt(e.reps) || 10, sug = R ? r25(R.e1 / (1 + tr / 30)) : 0;
  const tech = e.tech || [];
  return `<div class="gym" id="gym">${top}
  <div class="gcard-in" data-swipe>
    ${gymMedia(e)}
    ${e.ss ? '<div class="sstag">Superset</div>' : ''}<h2 class="gex">${esc(e.n)}</h2>
    <p class="gsub">${e.sets.length} séries × ${esc(e.reps)} répétitions · repos ${e.rest} s</p>
    ${e.sets.some(x => x.deload) ? '<div class="gmsg deload">🧘 Semaine de décharge : charges à 60 %, une série en moins. Technique parfaite, aucune série à l\'échec.</div>' : ''}
    ${e.prog ? `<div class="gmsg up">↑ ${esc(e.prog)}</div>` : ''}${e.stag ? `<div class="gmsg stag">⚠ ${esc(e.stag)}</div>` : ''}
    ${D.kind === 'pr' ? `<p class="prhint">${R ? `Record : <b>${R.kg} kg × ${R.r || 1}</b>. Séries E = échauffement, puis tente <b>${r25(R.kg + 2.5)} kg</b>.` : "Pas encore de record ici : monte par paliers jusqu'à une charge lourde pour 3 à 5 reps."}</p>` : ''}
    ${l ? `<div class="gline"><span>↗</span> La dernière fois${L ? ' (' + new Date(L.start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ')' : ''} : <b>${esc(l.filter(x => x.t !== 'e').map(x => num(x.kg) + ' × ' + x.r).join(' / '))}</b></div>` : ''}
    <button class="ghelp ${helpOpen ? 'open' : ''}" data-act="help">↔ Aide pour trouver mes charges</button>
    ${helpOpen ? `<div class="ghelp-b">${R ? `Ton record : <b>${R.kg} kg × ${R.r || 1}</b> (1RM estimé ${R.e1} kg). Pour ${tr} répétitions, vise environ <b>${sug} kg</b>. Si les ${tr} reps passent facilement sur toutes les séries, ajoute 2,5 kg la prochaine fois.` : `Pas encore d'historique sur cet exercice. Fais une première série légère de ${tr} reps : si elle est facile, ajoute 5 kg ; si tu finis à 1 ou 2 reps de l'échec, c'est la bonne charge.`}</div>` : ''}
    <div class="gsets">${e.sets.map((x, j) => `<div class="gset ${x.ok ? 'ok' : ''} ${j === firstTodo ? 'now' : ''} ${x.pr ? 'isPr' : ''}"><span class="gn">${j + 1}</span>
      <div class="gin"><input inputmode="decimal" aria-label="Charge série ${j + 1}" value="${esc(x.kg)}" placeholder="—" data-f="kg" data-j="${j}"><small>kg</small></div>
      <div class="gin"><input inputmode="numeric" aria-label="Répétitions série ${j + 1}" value="${esc(x.r)}" placeholder="${esc(x.t === 'e' && x.hint ? x.hint : String(e.reps).split(/[-–]/).pop())}" data-f="r" data-j="${j}"><small>rép.</small></div>
      <button class="gt t-${x.t || 'n'}" data-act="stype" data-j="${j}" aria-label="Type de série">${setTag(x.t) || 'ϟ'}</button>
      <button class="gck" data-act="ck" data-j="${j}" aria-label="Valider la série ${j + 1}">${x.pr ? 'PR' : '✓'}</button>
      <button class="gdel" data-act="delset" data-j="${j}" aria-label="Supprimer la série">✕</button></div>`).join('')}
      <button class="gadd" data-act="addset">+ Ajouter une série</button></div>
    <div class="gtech"><div class="between"><b>ϟ Technique</b><small>facultatif</small></div>
      <div class="pills">${(techOpen ? TECH : TECH.slice(0, 4)).map(t => `<button class="${tech.includes(t) ? 'sel' : ''}" data-act="tech" data-v="${t}">${t}</button>`).join('')}${techOpen ? '' : `<button data-act="techmore">+ ${TECH.length - 4} autres</button>`}</div>
      <p class="tiny">ϟ sur une série : E échauffement, D dégressive, F échec.</p></div>
    <div class="row" style="margin-top:10px">${D.ex[D.cur + 1] ? `<button class="sm" data-act="superset">${e.ss && D.ex[D.cur + 1].ss === e.ss ? 'Défaire le superset' : 'Superset avec le suivant'}</button>` : ''}<button class="sm" data-act="skip">Passer cet exercice</button></div>
    ${D.cur === n - 1 ? `<div class="genergy"><b>Envie d'un peu d'énergie ?</b><small>Ajoute un peu de cardio à la fin</small><div class="row">${[['rameur', 'Rameur'], ['velosalle', 'Vélo'], ['tapisinc', 'Tapis incliné'], ['skierg', 'SkiErg']].map(([id, l]) => `<button class="sm" data-act="pickex" data-id="${id}" data-target="draft" data-si="">${l}</button>`).join('')}</div></div>` : ''}
    ${gymMuscle(e)}
    <div style="margin-top:10px">${demoBlock(e.id, e.q, 'Guide, photos et vidéos')}</div>
  </div>${gymBottom(D)}</div>`;
}
function gymBottom(D) {
  const nx = D.ex[D.cur + 1], last = D.cur >= D.ex.length - 1;
  return `<div class="gbottom"><div class="grest" id="grest" hidden><svg viewBox="0 0 44 44" class="gring"><circle cx="22" cy="22" r="18"/><circle cx="22" cy="22" r="18" class="gring-p" id="gringP"/></svg><div class="gr-t"><small id="grLbl">Repos</small><b class="num" id="grT">0:00</b></div><button class="sm" data-act="plus15">+15 s</button><button class="sm" data-act="stoprest">Passer</button></div>
    <div class="gnext">${D.cur > 0 ? '<button class="gicon" data-act="gprev" aria-label="Exercice précédent">←</button>' : ''}${last ? `<div class="gn-t"><small>Dernier exercice</small><b>Terminer la séance</b></div><button class="gicon ok" data-act="finish" aria-label="Terminer la séance">✓</button>` : `<div class="gn-t"><small>Ensuite</small><b>${esc(nx.n)}</b></div><button class="gicon" data-act="gnext" aria-label="Exercice suivant">→</button>`}</div></div>`;
}
function vProgram() {
  return `<p class="mute small">Modifie tes séances : exercices, séries, répétitions, repos. Lance n'importe quelle séance n'importe quel jour depuis l'accueil.</p>
  ${S.program.map((s, si) => `<div class="card"><div class="row"><label class="grow">Nom de la séance<input value="${esc(s.name)}" data-pf="name" data-si="${si}"></label></div>
    <label style="margin-top:8px">Description<input value="${esc(s.sub || '')}" data-pf="sub" data-si="${si}"></label>
    <div style="margin-top:10px">${s.ex.map((e, ei) => `<div class="prog-ex">
      <label>Exercice<input value="${esc(e.n)}" data-pf="n" data-si="${si}" data-ei="${ei}"></label>
      <label>Séries<input inputmode="numeric" value="${e.sets}" data-pf="sets" data-si="${si}" data-ei="${ei}"></label>
      <label>Reps<input value="${esc(e.reps)}" data-pf="reps" data-si="${si}" data-ei="${ei}"></label>
      <label>Repos (s)<input inputmode="numeric" value="${e.rest}" data-pf="rest" data-si="${si}" data-ei="${ei}"></label>
      <div class="pdemo"><details data-mfor="${esc(e.id)}"><summary>Guide, photos et vidéos${S.guides[e.id] ? ' · guide écrit' : ''}</summary>
        <label>Guide / consignes (réglages machine, placement…)<textarea rows="3" data-guide="${esc(e.id)}" placeholder="Ex. siège cran 4, dos collé, pousser sans verrouiller les coudes">${esc(S.guides[e.id] || '')}</textarea></label>
        <div class="media" data-media="${esc(e.id)}"></div>
        <div class="row"><label class="btn sm">Ajouter photo, GIF ou vidéo<input type="file" accept="image/*,video/*" multiple hidden data-add="${esc(e.id)}"></label><a class="btn sm" href="${yt(e.q || e.n)}" target="_blank" rel="noopener">Vidéos YouTube</a></div></details></div>
      <div class="ctl"><button class="sm" data-act="pmove" data-si="${si}" data-ei="${ei}" data-d="-1" ${ei ? '' : 'disabled'} aria-label="Monter">Monter</button><button class="sm" data-act="pmove" data-si="${si}" data-ei="${ei}" data-d="1" ${ei < s.ex.length - 1 ? '' : 'disabled'} aria-label="Descendre">Descendre</button><button class="sm ghost" data-act="pdel" data-si="${si}" data-ei="${ei}">Retirer</button></div></div>`).join('')}</div>
    <div class="row" style="margin-top:10px"><button class="sm grow" data-act="paddex" data-si="${si}">+ Exercice</button><button class="sm ghost" data-act="pdelsess" data-si="${si}">Supprimer la séance</button></div></div>`).join('')}
  <button class="wide" data-act="paddsess">+ Nouvelle séance</button>
  <button class="ghost wide" style="margin-top:8px" data-act="preset">Revenir au programme de base</button>`;
}

let chartId = '', progTab = 'rec', metric = 'kg';
function vProgress() {
  const st = streak(), EXm = allEx();
  const tabs = [['rec', 'Records'], ['stats', 'Stats'], ['hist', 'Historique'], ['badges', 'Paliers']].map(([t, l]) => `<button class="${progTab === t ? 'sel' : ''}" data-act="ptab" data-t="${t}">${l}</button>`).join('');
  let body = '';
  if (progTab === 'rec') {
    const recs = [...REC.values()].sort((a, b) => b.t - a.t);
    body = recs.length ? `<p class="tiny">Ton record est la charge la plus lourde que tu as validée sur un exercice, dans n'importe quelle séance. Les séries d'échauffement ne comptent pas.</p>` + recs.map(R => `<details class="card rec"><summary><div class="between"><div><b>${esc(R.n)}</b><div class="tiny">${dateFr(R.t)} · 1RM estimé ${R.e1} kg</div></div><div class="num big">${R.kg}<small> kg × ${R.r || 1}</small></div></div></summary>
      <div class="tiny" style="margin-top:6px">Progression du record</div>${R.hist.slice().reverse().map(h => `<div class="between small"><span>${dateFr(h.t)}</span><b>${h.kg} kg × ${h.r || 1}</b></div>`).join('')}</details>`).join('')
      : '<div class="card"><p>Pas encore de record. Termine une séance : la charge la plus lourde de chaque exercice devient ton premier record, et les suivants seront détectés automatiquement.</p></div>';
  } else if (progTab === 'stats') {
    const ids = [...new Set(S.log.flatMap(s => (s.ex || []).map(e => e.id)))];
    const sel = ids.includes(chartId) ? chartId : (chartId = ids[0] || '');
    const wk = Date.now() - 7 * 864e5, per = new Map();
    for (const s of S.log) if (s.start >= wk) for (const e of s.ex || []) { const m = metaOf(e.id).m || 'Autre'; per.set(m, (per.get(m) || 0) + e.sets.filter(x => x.t !== 'e').length); }
    const mx = Math.max(20, ...per.values());
    body = `<div class="stats"><div class="stat"><div class="tiny">Séances</div><div class="num">${S.log.length}</div></div><div class="stat"><div class="tiny">Flamme (sem.)</div><div class="num">${st.n}</div></div><div class="stat"><div class="tiny">Soulevé</div><div class="num">${(tonnage() / 1000).toFixed(1)} t</div></div></div>
    <div class="card"><label>Exercice<select data-act="chartsel">${ids.length ? ids.map(id => `<option value="${esc(id)}" ${id === sel ? 'selected' : ''}>${esc(EXm.get(id)?.n || id)}</option>`).join('') : '<option>Pas encore de données</option>'}</select></label>
      <div class="seg" style="margin-top:8px">${[['kg', 'Charge max'], ['e1', '1RM estimé'], ['vol', 'Volume']].map(([m, l]) => `<button class="${metric === m ? 'sel' : ''}" data-act="metric" data-m="${m}">${l}</button>`).join('')}</div>
      <div class="fig"><svg id="chart" role="img" aria-label="Courbe de progression"></svg></div><p class="tiny" id="chartNote"></p></div>
    <div class="card"><h3>Séries par muscle (7 derniers jours)</h3><p class="tiny">Repère : 10 à 20 séries par semaine et par muscle pour prendre du muscle. Échauffements non comptés.</p>
      ${per.size ? [...per.entries()].sort((a, b) => b[1] - a[1]).map(([m, n]) => `<div class="mbar"><span>${esc(m)}</span><div><i style="width:${n / mx * 100}%"></i><em style="left:${10 / mx * 100}%"></em><em style="left:${20 / mx * 100}%"></em></div><b class="num">${n}</b></div>`).join('') : '<p class="tiny">Aucune séance ces 7 derniers jours.</p>'}</div>`;
  } else if (progTab === 'hist') {
    body = `<div class="card">${S.log.length ? `<table class="hist"><tbody>${[...S.log].reverse().map(s => `<tr><td><b>${esc(s.name)}</b><div class="tiny">${dateFr(s.start)} · ${fmt((s.end - s.start) / 1000)}${s.note ? ' · ' + esc(s.note) : ''}</div>
      <details><summary>Détail</summary>${(s.ex || []).map(e => `<div class="small"><b>${esc(e.n)}</b> : ${esc(e.sets.map(x => (x.t ? setTag(x.t) + ' ' : '') + num(x.kg) + ' kg × ' + (x.r || '?')).join(' · '))}</div>`).join('') || '<div class="tiny">Aucune série validée</div>'}<button class="sm ghost" style="margin-top:6px" data-act="dellog" data-id="${esc(s.id)}">Supprimer cette séance</button></details></td>
      <td class="r"><b class="num">${Math.round(s.vol || 0)} kg</b>${(s.prs || []).length ? `<div class="tiny" style="color:var(--acc-ink)">${s.prs.length} record${s.prs.length > 1 ? 's' : ''}</div>` : ''}</td></tr>`).join('')}</tbody></table>` : '<p class="tiny">Tes séances terminées apparaîtront ici.</p>'}</div>`;
  } else {
    body = `<p class="tiny">${Object.keys(S.badges).length} paliers débloqués sur ${BADGES.length}</p><div class="badges">${BADGES.map(b => badgeHtml(b, S.badges[b.id])).join('')}</div>`;
  }
  return `<h1>Progrès</h1><div class="seg" style="margin:12px 0">${tabs}</div>${body}`;
}
function drawChart() {
  const svg = $('#chart'); if (!svg) return; const W = svg.clientWidth, H = svg.clientHeight; if (!W) return;
  const pts = S.log.filter(s => (s.ex || []).some(e => e.id === chartId)).map(s => { const sets = s.ex.find(e => e.id === chartId).sets.filter(x => x.t !== 'e');
    const v = metric === 'e1' ? Math.max(0, ...sets.map(x => orm(num(x.kg), x.r))) : metric === 'vol' ? sets.reduce((a, x) => a + num(x.kg) * (x.r || 0), 0) : Math.max(0, ...sets.map(x => num(x.kg))); return { t: s.start, v: Math.round(v * 10) / 10 }; });
  const note = $('#chartNote');
  if (pts.length < 2) { svg.innerHTML = `<text x="${W / 2}" y="${H / 2}" text-anchor="middle" fill="currentColor" opacity=".55" font-size="15">${pts.length ? 'Encore une séance pour voir la courbe' : 'Pas encore de données'}</text>`; note.textContent = ''; return; }
  const mn = Math.min(...pts.map(p => p.v)), mx = Math.max(...pts.map(p => p.v)), px = 34, py = 26;
  const x = i => px + i * (W - 2 * px) / (pts.length - 1), y = v => H - py - (mx === mn ? .5 : (v - mn) / (mx - mn)) * (H - 2 * py);
  svg.innerHTML = `<line x1="${px}" x2="${W - px}" y1="${H - py}" y2="${H - py}" stroke="currentColor" opacity=".15"/><path d="${pts.map((p, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(p.v).toFixed(1)).join('')}" fill="none" stroke="#e0262e" stroke-width="3" stroke-linejoin="round"/>${pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.v)}" r="4.5" fill="#e0262e"/>`).join('')}<text x="${px}" y="15" font-size="13" fill="currentColor">${mx} kg</text><text x="${px}" y="${H - 6}" font-size="13" fill="currentColor" opacity=".6">${mn} kg</text>`;
  const lbl = { kg: 'Charge la plus lourde', e1: '1RM estimé (formule d’Epley)', vol: 'Volume (kg × reps)' }[metric], d = pts.at(-1).v - pts[0].v;
  note.textContent = `${lbl} à chaque séance : ${pts[0].v} kg au début, ${pts.at(-1).v} kg la dernière fois (${d >= 0 ? '+' : ''}${d.toFixed(1)} kg).`;
}
new ResizeObserver(() => view === 'progress' && drawChart()).observe(document.body);

/* bibliothèque */
let xq = '', xM = '', xE = '';
function exosList() {
  const q = xq.toLowerCase();
  const list = [...allEx().values()].filter(e => { const m = metaOf(e.id); return e.n.toLowerCase().includes(q) && (!xM || m.m === xM) && (!xE || (xE === 'G' ? m.eq === 'M' || m.eq === 'S' : m.eq === xE)); }).sort((a, b) => a.n.localeCompare(b.n, 'fr'));
  return list.length ? list.map(e => { const m = metaOf(e.id), R = REC.get(e.id); return `<button class="xrow" data-act="exinfo" data-id="${esc(e.id)}"><div><b>${esc(e.n)}</b><div class="tiny">${esc([m.m, (window.EQUIP || {})[m.eq]].filter(Boolean).join(' · ') || 'Perso')}${S.guides[e.id] ? ' · guide' : ''}</div></div>${R ? `<span class="pill">${R.kg} kg</span>` : ''}</button>`; }).join('') : '<p class="tiny">Aucun exercice ne correspond. Tu peux en créer un depuis une séance ou le programme.</p>';
}
function vExos() {
  const EQ = window.EQUIP || {}, MU = window.MUSCLES || [];
  return `<p class="mute small">${allEx().size} exercices. Touche-en un pour voir ton record, écrire un guide ou ajouter tes photos et vidéos.</p>
  <div class="bodymap"><div class="bm-svg">${window.bodySvg(xM ? [xM] : [], { cls: 'bm' })}</div><div class="bm-t"><b>${xM ? esc(xM) : 'Choisis un muscle'}</b><small>${xM ? [...allEx().values()].filter(e => metaOf(e.id).m === xM).length + ' exercices' : 'Touche la silhouette, de face ou de dos'}</small>${xM ? '<button class="link" data-act="xm" data-v="' + esc(xM) + '">Tout afficher</button>' : ''}</div></div>
  <input id="xq" data-f="xq" value="${esc(xq)}" placeholder="Chercher un exercice" autocomplete="off" style="margin-top:10px">
  <div class="chips scrollx" style="margin-top:8px">${MU.map(m => `<button class="sm ${xM === m ? 'sel' : ''}" data-act="xm" data-v="${esc(m)}">${esc(m)}</button>`).join('')}</div>
  <div class="chips scrollx" style="margin-top:6px"><button class="sm ${xE === 'G' ? 'sel' : ''}" data-act="xe" data-v="G">Machines guidées</button>${['P', 'H', 'B', 'K', 'E', 'C'].map(k => `<button class="sm ${xE === k ? 'sel' : ''}" data-act="xe" data-v="${k}">${EQ[k]}</button>`).join('')}</div>
  <div class="card" id="xlist" style="padding:4px 12px">${exosList()}</div>`;
}
function exInfo(id) {
  const e = allEx().get(id); if (!e) return; const m = metaOf(id), R = REC.get(id), l = lastSets(id), D = S.draft;
  sheet(`<h2>${esc(e.n)}</h2><p class="tiny">${esc([m.m, (window.EQUIP || {})[m.eq]].filter(Boolean).join(' · '))} · ${e.sets} × ${esc(e.reps)} · repos ${restLabel(+e.rest)}</p>${m.tip ? `<p class="small" style="margin-top:8px">${esc(m.tip)}</p>` : ''}
    <div class="stats" style="margin-top:10px"><div class="stat"><div class="tiny">Record</div><div class="num">${R ? R.kg + ' kg' : '—'}</div></div><div class="stat"><div class="tiny">1RM estimé</div><div class="num">${R ? R.e1 + ' kg' : '—'}</div></div><div class="stat"><div class="tiny">Dernière fois</div><div class="small"><b>${l ? esc(setsTxt(l)) : '—'}</b></div></div></div>
    <label style="margin-top:12px">Guide / consignes<textarea rows="3" data-guide="${esc(id)}" placeholder="Ex. siège cran 4, dos collé, pousser sans verrouiller les coudes">${esc(S.guides[id] || '')}</textarea></label>
    <div class="media" data-media="${esc(id)}"></div>
    <div class="row"><label class="btn sm">Ajouter photo, GIF ou vidéo<input type="file" accept="image/*,video/*" multiple hidden data-add="${esc(id)}"></label><a class="btn sm" href="${yt(e.q || e.n)}" target="_blank" rel="noopener">Vidéos YouTube</a></div>
    <div class="sec">Ajouter cet exercice</div>
    ${D ? `<button class="p wide" data-act="pickex" data-id="${esc(id)}" data-target="draft" data-si="">À la séance en cours</button>` : ''}
    <div class="row" style="margin-top:8px"><select id="xsess" class="grow" aria-label="Séance du programme">${S.program.map((p, i) => `<option value="${i}">${esc(p.name)}</option>`).join('')}</select><button data-act="toprog" data-id="${esc(id)}">Au programme</button></div>
    <button class="ghost wide" style="margin-top:10px" data-close>Fermer</button>`);
  fillMedia(id);
}

/* coach */
const QUICK = ['Quelles charges je dois augmenter à ma prochaine séance ?', "Je stagne au développé couché, qu'est-ce que je change ?", 'Fais-moi le bilan de mes 2 dernières semaines.', 'Que manger avant et après la salle pour être sec ?'];
function coachPrompt(q) {
  const EXm = allEx();
  const recent = S.log.slice(-12).map(s => `- ${dateFr(s.start)} ${s.name} (${fmt((s.end - s.start) / 1000)}) : ` + (s.ex || []).map(e => `${e.n} ${setsTxt(e.sets)}`).join(' ; ') + (s.note ? ` | ressenti : ${s.note}` : '')).join('\n') || '- aucune séance enregistrée';
  const prog = S.program.map(s => `${s.name} : ` + s.ex.map(e => `${e.n} ${e.sets}×${e.reps}`).join(', ')).join('\n');
  return `Je suis Nathan (67 kg, 1,76 m), étudiant ingénieur. Objectifs : prendre du muscle et être sec pour l'été, courir 10 km à 4:30/km, vélo de route. Je t'écris depuis mon appli Carnet sport.\n\nMon programme muscu :\n${prog}\n\nMes dernières séances :\n${recent}\n\nFlamme : ${streak().n} semaine(s) d'affilée.\n\nMa question : ${q}`;
}
const CAL0 = { age: 20, h: 176, w: 67, muscu: 4, dur: 75, run: 15, bike: 60, goal: 'recompo' };
function calc(c) {
  const bmr = 10 * c.w + 6.25 * c.h - 5 * c.age + 5, base = bmr * 1.4;
  const kMuscu = c.dur / 60 * 5 * c.w, week = c.muscu * kMuscu + c.run * c.w * 1.0 + c.bike * c.w * 0.3;
  const adj = { recompo: 0, prise: 250, seche: -400 }[c.goal] || 0;
  const avg = Math.round((base + week / 7 + adj) / 10) * 10, p = Math.round(2 * c.w), f = Math.round(0.9 * c.w), g = Math.max(0, Math.round((avg - p * 4 - f * 9) / 4));
  return { bmr: Math.round(bmr), avg, rest: Math.round((base + adj) / 10) * 10, gym: Math.round((base + kMuscu + adj) / 10) * 10, p, f, g, week: Math.round(week) };
}
function vCalories() {
  if (!S.cal) { const wk = S.log.filter(s => s.start > Date.now() - 28 * 864e5).length; S.cal = { ...CAL0, muscu: wk ? Math.max(1, Math.round(wk / 4)) : 4 }; }
  const c = S.cal, r = calc(c), f = (k, l, u, step = 1) => `<label>${l}<div class="unit"><input inputmode="decimal" data-cal="${k}" value="${c[k]}" step="${step}"><span>${u}</span></div></label>`;
  const goalTxt = { recompo: 'Tu manges ce que tu dépenses : le muscle se construit pendant que le gras baisse doucement. Idéal à 67 kg pour 1,76 m.', prise: "Léger surplus : prise de muscle plus rapide, avec un peu de gras. Utile si tu ne progresses plus aux charges.", seche: "Déficit modéré pour sécher vite avant l'été. Garde les protéines hautes pour ne pas perdre de muscle." }[c.goal];
  return `<div class="card summary"><div class="tiny">Par jour en moyenne</div><div class="num" style="font-size:48px">${r.avg} <small style="font-size:20px">kcal</small></div>
    <div class="stats" style="margin-top:10px"><div class="stat"><div class="tiny">Protéines</div><div class="num">${r.p}<small style="font-size:16px"> g</small></div></div><div class="stat"><div class="tiny">Glucides</div><div class="num">${r.g}<small style="font-size:16px"> g</small></div></div><div class="stat"><div class="tiny">Lipides</div><div class="num">${r.f}<small style="font-size:16px"> g</small></div></div></div>
    <p class="small" style="margin-top:10px">Jour de muscu : <b>${r.gym} kcal</b> · jour de repos : <b>${r.rest} kcal</b></p></div>
  <div class="seg">${[['recompo', 'Recompo'], ['prise', 'Prise de muscle'], ['seche', 'Sèche']].map(([k, l]) => `<button class="${c.goal === k ? 'sel' : ''}" data-act="calgoal" data-k="${k}">${l}</button>`).join('')}</div>
  <p class="small mute" style="margin-top:8px">${goalTxt}</p>
  <div class="card"><h3>Toi</h3><div class="trio" style="margin-top:6px">${f('w', 'Poids', 'kg', .1)}${f('h', 'Taille', 'cm')}${f('age', 'Âge', 'ans')}</div>
    <h3 style="margin-top:14px">Ta semaine de sport</h3><div class="trio" style="margin-top:6px">${f('muscu', 'Muscu', '/sem')}${f('dur', 'Durée', 'min')}${f('run', 'Course', 'km')}</div><div class="trio">${f('bike', 'Vélo', 'km')}</div>
    <p class="tiny" style="margin-top:10px">Métabolisme de base ${r.bmr} kcal (formule de Mifflin-St Jeor), vie d'étudiant ×1,4, plus ${r.week} kcal de sport par semaine. C'est une estimation à ±10 % : pèse-toi 3 matins par semaine et regarde la moyenne. Si elle bouge de plus de 0,5 kg en 3 semaines alors que tu vises la recompo, ajuste de 150 kcal.</p></div>`;
}
function vCoachClaude() {
  const on = navigator.onLine;
  return `<p class="mute small">Ta question part chez Claude avec tes dernières séances et ton programme. Tu n'as rien à réexpliquer.</p>
  ${on ? '' : '<p class="offline">Pas de réseau en ce moment. Écris ta question, elle reste prête pour quand tu en retrouves.</p>'}
  <div class="card"><div class="chips">${QUICK.map((q, i) => `<button data-act="quick" data-i="${i}">${esc(q)}</button>`).join('')}</div>
    <label style="margin-top:12px">Ta question<textarea rows="3" id="cq" data-f="coachq">${esc(S.coachQ || '')}</textarea></label>
    <button class="p wide" style="margin-top:10px" data-act="ask" ${on ? '' : 'disabled'}>Demander à Claude</button>
    <button class="wide" style="margin-top:8px" data-act="copyctx">Copier mon résumé</button>
    <p class="tiny" style="margin-top:8px">Le bouton ouvre Claude avec ta question déjà écrite. Pour une analyse de tes sorties course et vélo, Claude peut aussi lire ton Strava.</p></div>`;
}
function vCoach() {
  const on = navigator.onLine;
  const tabs = `<h1>Coach</h1><div class="seg" style="margin:12px 0">${[['claude', 'Demander à Claude'], ['cal', 'Calories']].map(([k, l]) => `<button class="${coachSub === k ? 'sel' : ''}" data-act="csub" data-k="${k}">${l}</button>`).join('')}</div>`;
  if (coachSub === 'cal') return tabs + vCalories();
  return tabs + `<p class="mute small">Ta question part chez Claude avec tes dernières séances et ton programme. Tu n'as rien à réexpliquer.</p>
  ${on ? '' : '<p class="offline">Pas de réseau en ce moment. Écris ta question, elle reste prête pour quand tu en retrouves.</p>'}
  <div class="card"><div class="chips">${QUICK.map((q, i) => `<button data-act="quick" data-i="${i}">${esc(q)}</button>`).join('')}</div>
    <label style="margin-top:12px">Ta question<textarea rows="3" id="cq" data-f="coachq">${esc(S.coachQ || '')}</textarea></label>
    <button class="p wide" style="margin-top:10px" data-act="ask" ${on ? '' : 'disabled'}>Demander à Claude</button>
    <button class="wide" style="margin-top:8px" data-act="copyctx">Copier mon résumé</button>
    <p class="tiny" style="margin-top:8px">Le bouton ouvre Claude avec ta question déjà écrite. Pour une analyse de tes sorties course et vélo, Claude peut aussi lire ton Strava.</p></div>`;
}

/* ---------- séance : logique ---------- */
function start(sid, opts = {}) {
  if (S.draft) { go('workout'); return; }
  const s = S.program.find(p => p.id === sid), pr = s && s.kind === 'pr';
  const mk = e => {
    const l = lastSets(e.id), R = REC.get(e.id);
    let sets = Array.from({ length: +e.sets || 3 }, (_, i) => ({ kg: l ? (l[i] || l.at(-1)).kg : '', r: '', ok: false, t: l && l[i] && l[i].t === 'e' ? 'e' : '' }));
    if (pr && R) sets = [[.5, '8'], [.7, '5'], [.85, '2'], [.925, '1']].map(([p, h]) => ({ kg: r25(R.kg * p), r: '', ok: false, t: 'e', hint: h })).concat([{ kg: r25(R.kg + 2.5), r: '', ok: false, t: '' }, { kg: r25(R.kg + 5), r: '', ok: false, t: '' }]);
    const sg = !pr && window.PROG ? window.PROG.suggest(e) : null;
    if (sg) sets = sets.map(x => x.t === 'e' ? x : { ...x, kg: sg.kg, up: true });
    if (!pr && window.DELOAD && window.DELOAD.active()) sets = window.DELOAD.apply(sets);
    const sn = !sg && window.PROG ? window.PROG.stagnant(e.id) : null;
    return { id: e.id, n: e.n, reps: e.reps, rest: +e.rest || 90, q: e.q || e.n + ' technique', state: 'todo', sets, prog: sg ? sg.msg : '', stag: sn ? sn.msg : '' };
  };
  const back = opts.date && opts.date < new Date().setHours(0, 0, 0, 0) - 1 ? opts.date + 18 * 36e5 : opts.date ? null : null;
  S.draft = { id: uid(), sid: s ? s.id : '', kind: pr ? 'pr' : '', name: s ? s.name : 'Séance libre', start: back || Date.now(), back: !!(opts.date), cur: 0, rest: null, note: '', ex: s ? s.ex.map(mk) : [] };
  mediaHidden = false; techOpen = false; helpOpen = false; unlockAudio();
  save(); wake(); go('workout'); launch(S.draft.name, !!opts.date);
  if (!s) addExSheet();
}
function launch(name, back) {
  const o = document.createElement('div'); o.className = 'launch'; o.innerHTML = `<div class="l-in"><small>${back ? 'Je note ma séance' : "C'est parti"}</small><b>${esc(name)}</b><div class="l-bar"><i></i></div></div>`;
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('go')); setTimeout(() => { o.classList.add('out'); setTimeout(() => o.remove(), 400); }, 1100);
}
function gymMove(d) { const D = S.draft; if (!D) return; const i = D.cur + d; if (i < 0 || i >= D.ex.length) return; D.cur = i; helpOpen = false; save(); render(); const g = document.querySelector('.gcard-in'); if (g) { g.classList.add(d > 0 ? 'in-r' : 'in-l'); } window.scrollTo(0, 0); }
let sx = null, sy = null;
document.addEventListener('touchstart', e => { if (view !== 'workout' || e.target.closest('input,button,.gsets,.media,details')) { sx = null; return; } sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
document.addEventListener('touchend', e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null; if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) gymMove(dx < 0 ? 1 : -1); }, { passive: true });
const nextTodo = D => { for (let k = 1; k <= D.ex.length; k++) { const i = (D.cur + k) % D.ex.length; if (D.ex[i].state === 'todo') return i; } return -1; };
function finish() {
  const D = S.draft; if (!D) return;
  const ex = D.ex.map(e => ({ id: e.id, n: e.n, sets: e.sets.filter(s => s.ok).map(s => ({ kg: num(s.kg), r: parseInt(s.r) || 0, ...(s.t ? { t: s.t } : {}) })) })).filter(e => e.sets.length);
  const prs = ex.filter(e => { const R = REC.get(e.id); const m = Math.max(0, ...e.sets.filter(s => s.t !== 'e').map(s => s.kg)); return R && m > R.kg; }).map(e => e.n);
  const est = D.ex.reduce((a, e) => a + e.sets.filter(x => x.ok).length * (45 + e.rest), 0) * 1000;
  const entry = { id: D.id, sid: D.sid, name: D.name, start: D.start, end: D.back ? D.start + Math.max(15 * 60e3, est) : Date.now(), tech: D.ex.filter(e => (e.tech || []).length).map(e => ({ id: e.id, t: e.tech })), note: (D.note || '').trim(), ex, prs, vol: ex.reduce((a, e) => a + e.sets.filter(s => s.t !== 'e').reduce((b, s) => b + s.kg * s.r, 0), 0) };
  const before = streak().n;
  S.log.push(entry); S.draft = null; refreshRec();
  const chal = window.challengeCheck ? window.challengeCheck() : null; const fresh = checkBadges(); save(); releaseWake();
  const st = streak();
  go('home');
  const meal = window.NUTRI ? window.NUTRI.afterWorkout() : null;
  const sets = ex.reduce((a, e) => a + e.sets.length, 0), mins = Math.max(1, Math.round((entry.end - entry.start) / 60000));
  const o = document.createElement('div'); o.className = 'endscreen'; o.innerHTML = `<div class="es-in">
    <div class="es-emoji">💪</div><h2>Séance terminée</h2><p class="mute">${esc(entry.name)}</p>
    <div class="es-stats"><div><b class="num" data-to="${mins}">0</b><small>minute${mins > 1 ? 's' : ''}</small></div><div><b class="num" data-to="${sets}">0</b><small>série${sets > 1 ? 's' : ''}</small></div><div><b class="num" data-to="${Math.round(entry.vol)}">0</b><small>kg soulevés</small></div></div>
    ${prs.length ? `<div class="es-rec"><div class="trophy">🏆</div><div><small>Nouveau record${prs.length > 1 ? 's' : ''}</small><b>${prs.map(esc).join(' · ')}</b></div></div>` : ''}
    <div class="es-flame">${FLAME}<div><b class="num">${st.n} semaine${st.n > 1 ? 's' : ''}</b><small>${st.n > before ? 'La flamme grandit ! Semaine validée.' : st.ok ? 'Semaine validée, tu en fais plus.' : 'Continue cette semaine pour la flamme.'}</small></div></div>
    ${fresh.length ? `<div class="es-badges">${fresh.map(b => `<div class="es-badge">${badgeHtml(b, true)}</div>`).join('')}</div>` : ''}
    ${meal ? `<div class="es-meal"><span>🍽️</span><div><small>Ton repas après la séance</small><b>${esc(meal.n)}</b><em>${esc(meal.items)}</em><em>${meal.kcal} kcal · ${meal.p} g de protéines</em></div><button data-es-meal="${meal.i}">J'ai mangé ça</button></div>` : ''}
    <p class="es-q">Comment s'est passée la séance ?</p>
    <div class="feel">${[['😵', 'Épuisé'], ['😓', 'Difficile'], ['🙂', 'Correct'], ['💪', 'En forme'], ['🔥', 'Au top']].map(([em, l]) => `<button data-feel="${l}"><span>${em}</span><small>${l}</small></button>`).join('')}</div>
    <button class="es-main" data-es="journal">Voir le journal</button><button class="es-sec" data-es="close">Fermer</button></div>`;
  document.body.appendChild(o);
  if (window.notify) { setTimeout(() => { for (const p of prs) window.notify('🏆', 'Nouveau record', p, { silent: true }); for (const b of fresh) window.notify(b.i, 'Badge débloqué : ' + b.n, b.d, { silent: true }); if (meal) window.notify('🍽️', 'Ton repas après la séance', meal.n + ' · ' + meal.p + ' g de protéines', { silent: true }); }, 50); }
  requestAnimationFrame(() => { o.classList.add('show'); for (const el of o.querySelectorAll('[data-to]')) { const to = +el.dataset.to, t0 = performance.now(); const stp = n => { const k = Math.min(1, (n - t0) / 900), e2 = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * e2).toLocaleString('fr-FR'); if (k < 1) requestAnimationFrame(stp); }; requestAnimationFrame(stp); } });
  o.addEventListener('click', ev => {
    const mb = ev.target.closest('[data-es-meal]'); if (mb) { window.NUTRI.ate(+mb.dataset.esMeal); mb.textContent = 'Noté ✓'; mb.disabled = true; return; }
    const f = ev.target.closest('[data-feel]'); if (f) { entry.feel = f.dataset.feel; save(); for (const x of o.querySelectorAll('[data-feel]')) x.classList.toggle('sel', x === f); return; }
    const a = ev.target.closest('[data-es]'); if (!a) return; o.classList.remove('show'); setTimeout(() => o.remove(), 300); if (a.dataset.es === 'journal') go('progress'); if (chal) setTimeout(() => window.showChallenge(chal), 350);
  });
}

/* ---------- chrono ---------- */
function tick() {
  const D = S.draft, live = $('#live');
  live.hidden = !D || view === 'workout';
  if (!D) return;
  const tot = fmt((Date.now() - D.start) / 1000);
  for (const el of document.querySelectorAll('[data-clock="total"]')) el.textContent = D.back ? 'notée' : tot;
  const r = D.rest, lv = $('#lvRest'), stop = $('#lvStop'), box = $('#grest');
  if (r) {
    const left = r.target - (Date.now() - r.since) / 1000, over = left < 0, txt = (over ? '+' : '') + fmt(Math.abs(left));
    if (left <= 0 && !r.dinged) { r.dinged = true; ding(); save(); }
    if (box) { box.hidden = false; box.classList.toggle('over', over); $('#grT').textContent = txt; $('#grLbl').textContent = over ? 'Repos terminé' : 'Repos'; const p = $('#gringP'); if (p) p.style.strokeDashoffset = String(113.1 * (1 - Math.max(0, left) / r.target)); }
    lv.textContent = (over ? 'Repos fini ' : 'Repos ') + txt; lv.classList.toggle('over', over); stop.hidden = false;
  } else {
    const c = D.ex[D.cur];
    if (box) box.hidden = true;
    lv.textContent = c ? c.n : 'Séance en cours'; lv.classList.remove('over'); stop.hidden = true;
  }
}
setInterval(tick, 500);
let wl = null;
let actx = null;
function unlockAudio() { try { if (navigator.audioSession) navigator.audioSession.type = 'transient'; actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); const b = actx.createBuffer(1, 1, 22050), src = actx.createBufferSource(); src.buffer = b; src.connect(actx.destination); src.start(0); } catch (e) { } }
function ding() {
  try { if (!actx) return; const t = actx.currentTime; for (const [f, d, v] of [[1318.5, 0, .32], [1760, .16, .26]]) { const o = actx.createOscillator(), g = actx.createGain(); o.type = 'sine'; o.frequency.value = f; o.connect(g); g.connect(actx.destination); g.gain.setValueAtTime(0, t + d); g.gain.linearRampToValueAtTime(v, t + d + .01); g.gain.exponentialRampToValueAtTime(.0008, t + d + 1.1); o.start(t + d); o.stop(t + d + 1.2); } } catch (e) { }
  try { navigator.vibrate && navigator.vibrate([120, 80, 120]); } catch (e) { }
}
function blip() { try { if (!actx) return; const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(actx.destination); g.gain.setValueAtTime(.18, t); g.gain.exponentialRampToValueAtTime(.001, t + .15); o.start(t); o.stop(t + .16); } catch (e) { } }
let wl2 = null; async function wakeOn() { try { if ('wakeLock' in navigator && !wl2) { wl2 = await navigator.wakeLock.request('screen'); wl2.addEventListener('release', () => { wl2 = null; }); } } catch (e) { } }
async function wake() { try { if (S.draft && 'wakeLock' in navigator && !wl) { wl = await navigator.wakeLock.request('screen'); wl.addEventListener('release', () => { wl = null; }); } } catch (e) { } }
function releaseWake() { try { wl && wl.release(); } catch (e) { } wl = null; }
document.addEventListener('visibilitychange', () => { if (!document.hidden) { wake(); tick(); } });

/* ---------- feuilles ---------- */
function sheet(html) { $('#sheetBody').innerHTML = html; $('#sheet').hidden = false; }
function closeSheet() { $('#sheet').hidden = true; $('#sheetBody').innerHTML = ''; }
let fM = '', fE = '', addTarget = 'draft', addSi;
function listEx() {
  const box = $('#exlist'); if (!box) return; const q = ($('#exq').value || '').toLowerCase();
  for (const c of document.querySelectorAll('[data-act=fm]')) c.classList.toggle('sel', c.dataset.v === fM);
  for (const c of document.querySelectorAll('[data-act=fe]')) c.classList.toggle('sel', c.dataset.v === fE);
  const list = [...allEx().values()].filter(e => { const m = metaOf(e.id); return e.n.toLowerCase().includes(q) && (!fM || m.m === fM) && (!fE || (fE === 'G' ? m.eq === 'M' || m.eq === 'S' : m.eq === fE)); });
  box.innerHTML = list.slice(0, 80).map(e => { const m = metaOf(e.id); return `<div class="list-item"><div><b>${esc(e.n)}</b><div class="tiny">${esc([m.m, (window.EQUIP || {})[m.eq]].filter(Boolean).join(' · '))}${m.m ? ' · ' : ''}${e.sets} × ${esc(e.reps)}</div></div><button class="sm" data-act="pickex" data-id="${esc(e.id)}" data-target="${addTarget}" data-si="${addSi ?? ''}">Ajouter</button></div>`; }).join('') || '<p class="tiny">Aucun résultat : crée-le en dessous.</p>';
}
function addExSheet(target = 'draft', si) {
  addTarget = target; addSi = si;
  const EQ = window.EQUIP || {}, MU = window.MUSCLES || [];
  sheet(`<h2>Ajouter un exercice</h2>
    <label style="margin-top:10px">Chercher<input id="exq" placeholder="Ex. curl, tirage, presse…" autocomplete="off"></label>
    <div class="chips scrollx" style="margin-top:8px">${MU.map(m => `<button class="sm" data-act="fm" data-v="${esc(m)}">${esc(m)}</button>`).join('')}</div>
    <div class="chips scrollx" style="margin-top:6px"><button class="sm" data-act="fe" data-v="G">Machines guidées</button>${['P', 'H', 'B', 'K', 'E', 'C'].map(k => `<button class="sm" data-act="fe" data-v="${k}">${EQ[k]}</button>`).join('')}</div>
    <div id="exlist" style="margin-top:6px;max-height:36vh;overflow:auto"></div>
    <div class="sec">Ou créer un nouvel exercice</div>
    <label>Nom<input id="nn" placeholder="Ex. Presse à cuisses inclinée"></label>
    <div class="trio"><label>Muscle<select id="nm"><option value="">—</option>${MU.map(m => `<option>${esc(m)}</option>`).join('')}</select></label><label>Matériel<select id="ne">${Object.entries(EQ).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label><label>Séries<input id="ns" inputmode="numeric" value="3"></label></div>
    <div class="trio"><label>Reps<input id="nr" value="10-12"></label><label>Repos (s)<input id="nt" inputmode="numeric" value="90"></label></div>
    ${target === 'draft' && S.draft && S.draft.sid ? `<label style="margin-top:10px;display:flex;gap:8px;align-items:center;color:var(--ink)"><input type="checkbox" id="nkeep" style="width:22px;min-height:22px"> L'ajouter aussi au programme ${esc(S.draft.name)}</label>` : ''}
    <button class="p wide" style="margin-top:12px" data-act="createex" data-target="${target}" data-si="${si ?? ''}">Créer et ajouter</button>
    <button class="ghost wide" style="margin-top:8px" data-close>Fermer</button>`);
  $('#exq').addEventListener('input', listEx); listEx();
}
function addExercise(e, target, si, keep) {
  if (target === 'program') { const { m, eq, ...rest } = e; S.program[si].ex.push({ ...rest }); save(); closeSheet(); render(); return; }
  const D = S.draft; const l = lastSets(e.id);
  D.ex.push({ id: e.id, n: e.n, reps: e.reps, rest: +e.rest || 90, q: e.q || e.n + ' technique', state: 'todo', sets: Array.from({ length: +e.sets || 3 }, (_, i) => ({ kg: l ? (l[i] || l.at(-1)).kg : '', r: '', ok: false, t: '' })) });
  if (D.ex[D.cur]?.state !== 'todo' || D.ex.length === 1) D.cur = D.ex.length - 1;
  if (keep) { const p = S.program.find(p => p.id === D.sid); if (p && !p.ex.some(x => x.id === e.id)) p.ex.push({ ...e }); }
  save(); closeSheet(); render(); toast('Exercice ajouté');
}
function settingsHtml() { return settingsInner().replace('<button class="ghost wide" style="margin-top:8px" data-close>Fermer</button>', ''); }
function settingsSheet() { go('me'); window.VIEWS.meGoto('reglages'); render(); }
function settingsInner() {
  return (`<div class="tcard">
  <label style="margin-top:12px">Lien de ta playlist Spotify<input id="spurl" value="${esc(S.set.spotify)}" placeholder="https://open.spotify.com/playlist/…" inputmode="url"></label>
  <p class="tiny">Dans Spotify : ta playlist, ⋯, Partager, Copier le lien.</p>
  <label style="margin-top:10px">Séances par semaine pour garder la flamme<select id="goal">${[1, 2, 3, 4, 5, 6].map(n => `<option ${n === S.set.goal ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
  <label style="margin-top:10px">Repos entre deux exercices<select id="exrest">${[90, 120, 150, 180, 240].map(n => `<option value="${n}" ${n === S.set.exRest ? 'selected' : ''}>${fmt(n)}</option>`).join('')}</select></label>
  <button class="p wide" style="margin-top:14px" data-act="saveset">Enregistrer</button>
  <div class="sec">Notifications et rappels</div>
  <p class="tiny">Records, badges et idées de repas s'affichent dans la cloche de l'accueil. Les notifications iPhone marchent quand l'app est ouverte (iOS 16.4 ou plus, app ajoutée à l'écran d'accueil).</p>
  <button class="wide" data-ex="notif">${'Notification' in window && Notification.permission === 'granted' ? 'Notifications activées ✓' : 'Activer les notifications'}</button>
  <p class="tiny" style="margin-top:10px">Pour être prévenu même app fermée et sans réseau : ajoute tes séances au calendrier de l'iPhone, avec une alerte 30 min avant.</p>
  <button class="wide" data-ex="ics">Ajouter mes séances au calendrier iPhone</button>
  <div class="sec">Semaine de décharge</div><p class="tiny">Une semaine plus légère conseillée toutes les :</p>
  <div class="pills">${[6, 7, 8].map(n => `<button class="${(window.DELOAD ? window.DELOAD.cfg().every : 7) === n ? 'sel' : ''}" data-ex="deloadevery" data-v="${n}">${n} semaines</button>`).join('')}</div>
  ${window.SYNC ? window.SYNC.html() : ''}
  <div class="sec">Version</div><p class="tiny">Version 23 de l'app. Avec du réseau, l'app se met à jour toute seule à l'ouverture.</p><button class="wide" data-act="upd">Rechercher une mise à jour</button>
  <div class="sec">Sauvegarde</div>
  <p class="tiny">Copie de secours manuelle, utile si la synchro n'est pas activée. Pour passer tes séances, guides, photos et vidéos d'un appareil à l'autre : Exporter ici, envoie le fichier (AirDrop, iCloud Drive), puis Importer sur l'autre. Ce qui existe déjà n'est pas dupliqué.</p>
  <label style="display:flex;gap:8px;align-items:center;color:var(--ink);margin:8px 0"><input type="checkbox" id="expmedia" checked style="width:22px;min-height:22px"> Inclure mes photos et vidéos</label>
  <div class="row"><button class="grow" data-act="export">Exporter mes données</button><label class="btn grow">Importer<input type="file" accept="application/json,.json" hidden id="impf"></label></div>
  <button class="ghost wide" style="margin-top:8px" data-close>Fermer</button></div>`);
}

/* ---------- toast ---------- */
let tt = null, calT = null;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2200); }

/* ---------- événements ---------- */
const confirmTap = (b, label) => { if (b.dataset.sure) return true; b.dataset.sure = '1'; const o = b.textContent; b.textContent = label; setTimeout(() => { if (b.isConnected) { b.textContent = o; delete b.dataset.sure; } }, 3500); return false; };
document.addEventListener('click', ev => { const m = ev.target.closest('.bodymap [data-muscle]'); if (!m) return; xM = xM === m.dataset.muscle ? '' : m.dataset.muscle; render(); }, true);
document.addEventListener('click', async ev => {
  if (ev.target.closest('[data-close]')) { closeSheet(); return; }
  const lvStop = ev.target.closest('#lvStop');
  if (lvStop) { ev.stopPropagation(); if (S.draft) { S.draft.rest = null; save(); tick(); } return; }
  if (ev.target.closest('#live')) { go('workout'); return; }
  const nb = ev.target.closest('#nav button'); if (nb) { go(nb.dataset.view); return; }
  const b = ev.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act, D = S.draft, cur = D && D.ex[D.cur];
  switch (a) {
    case 'goto': go(b.dataset.v); break;
    case 'upd': b.textContent = 'Recherche…'; try { const r = window.__reg || await navigator.serviceWorker.getRegistration(); if (r) await r.update(); } catch (e) { } setTimeout(() => location.reload(), 600); break;
    case 'tool': window.VIEWS.toolsGoto(b.dataset.k); if (b.dataset.k === 'nutri' && window.NUTRI_GO) window.NUTRI_GO('jour'); go('tools'); break;
    case 'settings': settingsSheet(); break;
    case 'start': if (!S.draft) start(b.dataset.sid); break;
    case 'pick': { const i = +b.dataset.i; D.cur = i; D.rest = null; if (D.ex[i].state !== 'todo') D.ex[i].state = 'todo'; save(); render(); const el = document.querySelectorAll('.ex')[i]; el && el.scrollIntoView({ block: 'start', behavior: 'smooth' }); break; }
    case 'ck': { const j = +b.dataset.j, s = cur.sets[j]; s.ok = !s.ok; s.pr = false;
      if (s.ok) {
        if (!s.r) s.r = String(parseInt(s.t === 'e' && s.hint ? s.hint : cur.reps) || '');
        const nx = cur.sets[j + 1]; if (nx && nx.kg === '') nx.kg = s.kg;
        const R = REC.get(cur.id), kg = num(s.kg), sessBest = Math.max(0, ...cur.sets.filter((x, k) => k !== j && x.ok && x.t !== 'e').map(x => num(x.kg)));
        if (s.t !== 'e' && R && kg > R.kg && kg > sessBest) { s.pr = true; toast(`Nouveau record ! ${kg} kg (avant : ${R.kg} kg)`); try { navigator.vibrate && navigator.vibrate([80, 60, 80]); } catch (e) { } }
        const grp = cur.ss ? D.ex.map((x, k) => ({ x, k })).filter(o => o.x.ss === cur.ss) : null;
        if (cur.sets.every(x => x.ok)) cur.state = 'done';
        if (grp && grp.length > 1) {
          const pos = grp.findIndex(o => o.k === D.cur), after = [...grp.slice(pos + 1), ...grp.slice(0, pos)].find(o => o.x.state === 'todo' && o.x.sets.some(z => !z.ok));
          const lastInRound = pos === grp.length - 1 || !grp.slice(pos + 1).some(o => o.x.state === 'todo');
          if (after && !lastInRound) { D.cur = after.k; D.rest = null; }
          else if (after) { D.cur = after.k; D.rest = { since: Date.now(), target: Math.max(...grp.map(o => o.x.rest)) }; }
          else { D.rest = { since: Date.now(), target: S.set.exRest }; const n = nextTodo(D); if (n >= 0) D.cur = n; toast(n >= 0 ? 'Superset fini · prochain : ' + D.ex[n].n : 'Dernier exercice fini !'); }
        } else if (cur.state === 'done') { D.rest = { since: Date.now(), target: S.set.exRest }; const n = nextTodo(D); if (n >= 0) D.cur = n; if (!s.pr) toast(n >= 0 ? 'Exercice fini · prochain : ' + D.ex[n].n : 'Dernier exercice fini !'); }
        else D.rest = { since: Date.now(), target: s.t === 'e' ? Math.min(60, cur.rest) : cur.rest };
      }
      save(); render(); break; }
    case 'stype': { const s = cur.sets[+b.dataset.j], o = ['', 'e', 'd', 'f']; s.t = o[(o.indexOf(s.t || '') + 1) % 4]; save(); render(); break; }
    case 'superset': { const n = D.ex[D.cur + 1]; if (!n) break; if (cur.ss && n.ss === cur.ss) { const g = cur.ss; for (const x of D.ex) if (x.ss === g) delete x.ss; } else { const g = cur.ss || uid(); cur.ss = g; n.ss = g; } save(); render(); break; }
    case 'calgoal': S.cal.goal = b.dataset.k; save(); render(); break;
    case 'psub': progSub = b.dataset.k; render(); break;
    case 'csub': coachSub = b.dataset.k; render(); break;
    case 'xm': xM = xM === b.dataset.v ? '' : b.dataset.v; render(); break;
    case 'xe': xE = xE === b.dataset.v ? '' : b.dataset.v; render(); break;
    case 'exinfo': exInfo(b.dataset.id); break;
    case 'toprog': { const e = allEx().get(b.dataset.id), si = +$('#xsess').value, p = S.program[si]; if (p.ex.some(x => x.id === e.id)) { toast('Déjà dans ' + p.name); break; } const { m, eq, ...r } = e; p.ex.push({ ...r }); save(); toast('Ajouté à ' + p.name); break; }
    case 'ptab': progTab = b.dataset.t; render(); break;
    case 'metric': metric = b.dataset.m; render(); break;
    case 'fm': fM = fM === b.dataset.v ? '' : b.dataset.v; listEx(); break;
    case 'fe': fE = fE === b.dataset.v ? '' : b.dataset.v; listEx(); break;
    case 'addset': cur.sets.push({ kg: cur.sets.at(-1)?.kg ?? '', r: '', ok: false, t: '' }); save(); render(); break;
    case 'rmset': if (cur.sets.length > 1) cur.sets.pop(); save(); render(); break;
    case 'skip': cur.state = 'skip'; D.rest = null; { const n = nextTodo(D); if (n >= 0) D.cur = n; } save(); render(); break;
    case 'exdone': cur.state = cur.sets.some(s => s.ok) ? 'done' : 'skip'; D.rest = { since: Date.now(), target: S.set.exRest }; { const n = nextTodo(D); if (n >= 0) D.cur = n; } save(); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); break;
    case 'stoprest': D.rest = null; save(); tick(); break;
    case 'plus15': if (D.rest) { D.rest.target += 15; D.rest.dinged = false; save(); tick(); } break;
    case 'hidemedia': mediaHidden = !mediaHidden; render(); break;
    case 'help': helpOpen = !helpOpen; render(); break;
    case 'techmore': techOpen = true; render(); break;
    case 'tech': { cur.tech = cur.tech || []; const v = b.dataset.v; cur.tech = cur.tech.includes(v) ? cur.tech.filter(x => x !== v) : [...cur.tech, v]; save(); render(); break; }
    case 'delset': if (cur.sets.length > 1) { cur.sets.splice(+b.dataset.j, 1); save(); render(); } break;
    case 'gnext': gymMove(1); break;
    case 'gprev': gymMove(-1); break;
    case 'gymquit': sheet(`<h2>Quitter le mode salle ?</h2><p class="mute small">${esc(D.name)} · ${D.ex.reduce((a, e) => a + e.sets.filter(x => x.ok).length, 0)} séries validées</p>
      <button class="wide" style="margin-top:12px" data-act="gohome">Continuer plus tard</button><p class="tiny">Le chrono continue, la séance reste en bas de l'écran.</p>
      <button class="p wide" style="margin-top:10px" data-act="finish" data-close-first>Terminer et enregistrer</button>
      <button class="ghost wide" style="margin-top:8px" data-act="abort">Abandonner la séance</button>`); break;
    case 'gohome': closeSheet(); go('home'); break;
    case 'addex': addExSheet('draft'); break;
    case 'pickex': { const e = allEx().get(b.dataset.id); if (e) addExercise(e, b.dataset.target, b.dataset.si === '' ? undefined : +b.dataset.si, $('#nkeep')?.checked); break; }
    case 'createex': { const n = $('#nn').value.trim(); if (!n) { $('#nn').focus(); toast("Donne un nom à l'exercice"); break; } const e = { ...X('c_' + uid(), n, parseInt($('#ns').value) || 3, $('#nr').value.trim() || '10', parseInt($('#nt').value) || 90), m: $('#nm').value, eq: $('#ne').value }; S.lib.push(e); addExercise(e, b.dataset.target, b.dataset.si === '' ? undefined : +b.dataset.si, $('#nkeep')?.checked); break; }
    case 'finish': closeSheet(); if (D.ex.some(e => e.sets.some(s => s.ok)) || confirmTap(b, 'Aucune série validée : terminer quand même ?')) finish(); break;
    case 'abort': if (confirmTap(b, 'Toucher encore pour tout effacer')) { closeSheet(); S.draft = null; save(); releaseWake(); go('home'); toast('Séance abandonnée'); } break;
    case 'delmedia': await mediaTx(st => st.delete(+b.dataset.k)); fillMedia(b.dataset.ex); break;
    case 'pmove': { const s = S.program[+b.dataset.si], i = +b.dataset.ei, j = i + +b.dataset.d; [s.ex[i], s.ex[j]] = [s.ex[j], s.ex[i]]; save(); render(); break; }
    case 'pdel': if (confirmTap(b, 'Sûr ?')) { S.program[+b.dataset.si].ex.splice(+b.dataset.ei, 1); save(); render(); } break;
    case 'paddex': addExSheet('program', +b.dataset.si); break;
    case 'paddsess': S.program.push({ id: 's_' + uid(), name: 'Nouvelle séance', sub: '', ex: [] }); save(); render(); window.scrollTo(0, document.body.scrollHeight); break;
    case 'pdelsess': if (S.program.length > 1 && confirmTap(b, 'Toucher encore pour supprimer')) { S.program.splice(+b.dataset.si, 1); save(); render(); } break;
    case 'preset': if (confirmTap(b, 'Toucher encore : tes modifications du programme seront perdues')) { S.program = defaultProgram(); save(); render(); toast('Programme de base rétabli'); } break;
    case 'dellog': if (confirmTap(b, 'Toucher encore pour supprimer')) { S.log = S.log.filter(s => s.id !== b.dataset.id); refreshRec(); save(); render(); } break;
    case 'quick': { const q = QUICK[+b.dataset.i]; S.coachQ = q; $('#cq').value = q; save(); break; }
    case 'ask': { const q = ($('#cq').value || '').trim() || QUICK[0]; const p = coachPrompt(q); try { await navigator.clipboard.writeText(p); } catch (e) { } const l = document.createElement('a'); l.href = 'https://claude.ai/new?q=' + encodeURIComponent(p.slice(0, 6000)); l.target = '_blank'; l.rel = 'noopener'; document.body.appendChild(l); l.click(); l.remove(); break; }
    case 'copyctx': { const p = coachPrompt(($('#cq').value || '').trim() || '(écris ta question ici)'); try { await navigator.clipboard.writeText(p); toast('Résumé copié : colle-le dans Claude'); } catch (e) { sheet(`<h2>Ton résumé</h2><p class="tiny">Sélectionne le texte et copie-le.</p><textarea rows="12" readonly>${esc(p)}</textarea><button class="wide" style="margin-top:8px" data-close>Fermer</button>`); } break; }
    case 'saveset': { const v = $('#spurl').value.trim(); if (v && !/^https:\/\/(open\.)?spotify\.com\//.test(v) && !/^https:\/\/spotify\.link\//.test(v)) { toast('Colle un lien Spotify (https://open.spotify.com/…)'); break; } S.set.spotify = v; S.set.goal = +$('#goal').value; S.set.exRest = +$('#exrest').value; save(); render(); toast('Réglages enregistrés'); break; }
    case 'export': { b.disabled = true; b.textContent = 'Préparation…'; const withMedia = $('#expmedia')?.checked; let media = [];
      if (withMedia) { await idbReady; media = await new Promise(res => { if (!idb) return res([]); const q = idb.transaction('media').objectStore('media').getAll(); q.onsuccess = () => res(q.result || []); q.onerror = () => res([]); }); media = await Promise.all(media.map(m => new Promise(r => { const fr = new FileReader(); fr.onload = () => r({ ex: m.ex, type: m.type, size: m.blob.size, t: m.t, data: fr.result }); fr.onerror = () => r(null); fr.readAsDataURL(m.blob); }))); media = media.filter(Boolean); }
      const blob = new Blob([JSON.stringify({ app: 'carnet-sport', v: 2, at: Date.now(), program: S.program, lib: S.lib, log: S.log, badges: S.badges, best: S.best, set: S.set, guides: S.guides, cal: S.cal, media })], { type: 'application/json' });
      const name = 'carnet-sport-' + new Date().toISOString().slice(0, 10) + '.json', file = new File([blob], name, { type: 'application/json' });
      try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Carnet sport' }); } else throw 0; } catch (e) { if (e && e.name === 'AbortError') { b.disabled = false; b.textContent = 'Exporter mes données'; break; } const l = document.createElement('a'); l.href = URL.createObjectURL(blob); l.download = name; document.body.appendChild(l); l.click(); l.remove(); }
      b.disabled = false; b.textContent = 'Exporter mes données'; toast(media.length ? `Exporté avec ${media.length} photo(s)/vidéo(s)` : 'Fichier exporté'); break; }
  }
});
document.addEventListener('input', ev => {
  const t = ev.target, D = S.draft;
  if (t.dataset.f === 'kg' || t.dataset.f === 'r') { const c = D.ex[D.cur]; c.sets[+t.dataset.j][t.dataset.f] = t.value; save(); }
  else if (t.dataset.f === 'note' && D) { D.note = t.value; save(); }
  else if (t.dataset.guide) { const v = t.value; if (v.trim()) S.guides[t.dataset.guide] = v; else delete S.guides[t.dataset.guide]; save(); }
  else if (t.dataset.cal) { const v = num(t.value); if (v > 0 || (t.dataset.cal !== 'w' && t.dataset.cal !== 'h' && t.dataset.cal !== 'age' && t.value.trim() === '0')) { S.cal[t.dataset.cal] = v; save(); clearTimeout(calT); calT = setTimeout(() => { const pos = t.dataset.cal; render(); const el = document.querySelector(`[data-cal="${pos}"]`); if (el) { el.focus(); const n = el.value.length; try { el.setSelectionRange(n, n); } catch (e) { } } }, 700); } }
  else if (t.dataset.f === 'xq') { xq = t.value; $('#xlist').innerHTML = exosList(); }
  else if (t.dataset.f === 'coachq') { S.coachQ = t.value; save(); }
  else if (t.dataset.pf) { const s = S.program[+t.dataset.si]; if (t.dataset.ei === undefined) s[t.dataset.pf] = t.value; else { const e = s.ex[+t.dataset.ei], f = t.dataset.pf; e[f] = f === 'sets' || f === 'rest' ? (parseInt(t.value) || 0) : t.value; if (f === 'n') e.q = t.value + ' technique'; } save(); }
});
document.addEventListener('change', async ev => {
  const t = ev.target;
  if (t.dataset.add && t.files.length) { await idbReady; for (const f of t.files) { if (f.size > 200e6) { toast('Vidéo trop lourde (max 200 Mo)'); continue; } await mediaTx(st => st.add({ ex: t.dataset.add, blob: f, type: f.type || '' })); } fillMedia(t.dataset.add); fillGymMedia(t.dataset.add); toast('Ajouté à cet exercice'); }
  else if (t.dataset.act === 'chartsel') { chartId = t.value; drawChart(); }
  else if (t.id === 'impf' && t.files[0]) {
    try { const v = JSON.parse(await t.files[0].text()); if (v.app !== 'carnet-sport' || !Array.isArray(v.log)) throw 0;
      const have = new Set(S.log.map(s => s.id)); for (const s of v.log) if (s && s.id && !have.has(s.id)) S.log.push(s); S.log.sort((a, b) => a.start - b.start);
      if (Array.isArray(v.program) && v.program.length) S.program = v.program; if (Array.isArray(v.lib)) S.lib = v.lib; S.badges = { ...v.badges, ...S.badges }; S.best = Math.max(S.best || 0, v.best || 0); if (v.set) S.set = { ...S.set, ...v.set }; if (v.guides) S.guides = { ...S.guides, ...v.guides }; if (v.cal && !S.cal) S.cal = v.cal;
      if (Array.isArray(v.media) && v.media.length) { await idbReady; const have = await new Promise(res => { if (!idb) return res([]); const q = idb.transaction('media').objectStore('media').getAll(); q.onsuccess = () => res(q.result || []); q.onerror = () => res([]); }); let n = 0; for (const m of v.media) { if (!m || typeof m.data !== 'string' || !m.data.startsWith('data:') || have.some(h => h.ex === m.ex && h.blob.size === m.size)) continue; const blob = await (await fetch(m.data)).blob(); await mediaTx(st => st.add({ ex: String(m.ex), blob, type: String(m.type || blob.type), ...(m.t ? { t: +m.t } : {}) })); n++; } if (n) toast(n + ' photo(s)/vidéo(s) importée(s)'); }
      refreshRec(); save(); closeSheet(); render(); toast('Données importées'); } catch (e) { toast("Ce fichier n'est pas une sauvegarde Carnet sport"); }
  }
});
document.addEventListener('toggle', ev => { const d = ev.target; if (d.open && d.dataset && d.dataset.mfor) fillMedia(d.dataset.mfor); }, true);
addEventListener('online', () => view === 'coach' && render()); addEventListener('offline', () => view === 'coach' && render());

/* ---------- hors ligne ---------- */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(r => { window.__reg = r; r.update().catch(() => { }); document.addEventListener('visibilitychange', () => { if (!document.hidden) r.update().catch(() => { }); }); }).catch(() => { });
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloaded) return; reloaded = true; if (!S.draft) location.reload(); else toast("Nouvelle version prête : elle s'appliquera à la prochaine ouverture"); });
}

window.CARNET = { S: () => S, save, render, go, toast, sheet, closeSheet, body, REC: () => REC, coach: vCoachClaude, settingsHtml, start, lastSets, metaOf, addExSheet, vProgram, vExos, planNew: sid => window.VIEWS.planNew(sid), ding, blip, unlockAudio, wakeOn, refreshRec, allEx };
window.CARNET_fillMedia = fillMedia;
window.CARNET.media = { ready: () => idbReady, list: mediaFor, tx: mediaTx };
if (!['home', 'workout', 'program', 'progress', 'tools', 'me', 'lib', 'exo', 'progs', 'ana'].includes(view)) view = 'home';
window.applyTheme && window.applyTheme();
window.weekCountNow = () => weekCounts().get(monday(Date.now())) || 0;
setTimeout(() => { try { window.dailyChecks && window.dailyChecks(); } catch (e) { console.error(e); } }, 1200);
checkBadges(); save(); render(); if (S.draft) wake();
}
