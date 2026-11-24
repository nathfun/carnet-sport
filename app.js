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
// Exercices retirés du programme, gardés pour pouvoir les rajouter (« + Ajouter un exercice »).
const SPARE = [X('bench', 'Développé couché barre', 4, '6-8', 150), X('inclh', 'Développé incliné haltères 30°', 3, '8-10', 120), X('inclb', 'Développé incliné barre ou Smith', 4, '8-10', 120), X('couchh', 'Développé couché haltères', 3, '10-12', 90), X('milit', 'Développé militaire haltères assis', 3, '8-10', 120), X('ecpou', 'Écarté poulie vis-à-vis', 3, '12-15', 60), X('ecbh', 'Écarté poulie bas vers haut', 3, '15', 60), X('latpou', 'Élévations latérales poulie', 3, '12-15', 60), X('lath', 'Élévations latérales haltères', 4, '15', 60), X('dips', 'Dips', 3, '8-12', 90, 'dips pectoraux technique'), X('front', 'Barre au front EZ', 2, '10-12', 75), X('rowb', 'Rowing barre buste penché', 4, '8', 120)];
const RUNS = [{ t: '6 × 1 000 m', d: '4:25–4:30 /km, récup 2 min en trottinant' }, { t: '3 × 2 km tempo', d: '4:40–4:45 /km, récup 2 min' }, { t: '10 × 400 m', d: '4:05–4:10 /km, récup 1 min 15' }];
const isoWeek = ts => { const d = new Date(ts), t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7)); return Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7); };
const monday = ts => { const d = new Date(ts); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };

/* ---------- état ---------- */
const KEY = 'carnet-sport.v1';
let S = null;
try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { }
if (!S || !Array.isArray(S.program)) S = { progV: 2, program: defaultProgram(), lib: [], log: [], draft: null, badges: {}, set: { spotify: '', goal: 1, exRest: 180 } };
S.set = { spotify: '', goal: 1, exRest: 180, ...S.set }; S.lib = S.lib || []; S.badges = S.badges || {}; S.guides = S.guides || {};
for (const e of SPARE) if (!S.lib.some(x => x.id === e.id)) S.lib.push(e);
if ((S.progV || 1) < 2) { const d = defaultProgram(); for (const id of ['pecsA', 'pecsB', 'dosA']) { const i = S.program.findIndex(p => p.id === id), n = d.find(p => p.id === id); if (i >= 0) S.program[i] = n; } S.progV = 2; }
let saveFail = false;
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); saveFail = false; } catch (e) { if (!saveFail) toast('Mémoire du téléphone pleine : exporte tes données'); saveFail = true; } };
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { }
let view = S.draft ? 'workout' : 'home';

/* ---------- médias perso (IndexedDB) ---------- */
let idb = null;
const idbReady = new Promise(res => { try { const r = indexedDB.open('carnet-media', 1); r.onupgradeneeded = () => r.result.createObjectStore('media', { keyPath: 'k', autoIncrement: true }).createIndex('ex', 'ex'); r.onsuccess = () => { idb = r.result; res(); }; r.onerror = () => res(); } catch (e) { res(); } });
const mediaFor = ex => new Promise(res => { if (!idb) return res([]); try { const q = idb.transaction('media').objectStore('media').index('ex').getAll(ex); q.onsuccess = () => res(q.result || []); q.onerror = () => res([]); } catch (e) { res([]); } });
const mediaTx = (fn) => new Promise(res => { if (!idb) return res(); const t = idb.transaction('media', 'readwrite'); fn(t.objectStore('media')); t.oncomplete = res; t.onerror = () => { toast("Impossible d'enregistrer ce fichier"); res(); }; });
const objUrls = [];
async function fillMedia(exId) {
  await idbReady; const boxes = document.querySelectorAll(`[data-media="${CSS.escape(exId)}"]`); if (!boxes.length) return;
  const list = await mediaFor(exId);
  for (const box of boxes) box.innerHTML = list.length ? list.map(m => { const u = URL.createObjectURL(m.blob); objUrls.push(u); return `<figure>${String(m.type).startsWith('video') ? `<video src="${u}" muted loop playsinline controls preload="metadata"></video>` : `<img src="${u}" alt="Ma démo">`}<button data-act="delmedia" data-k="${m.k}" data-ex="${esc(exId)}">Retirer</button></figure>`; }).join('') : '<p class="tiny">Aucune photo ni vidéo pour cet exercice. Ajoute la tienne, elle sera dispo même sans réseau.</p>';
}

/* ---------- calculs ---------- */
const allEx = () => { const m = new Map(); for (const s of S.program) for (const e of s.ex) if (!m.has(e.id)) m.set(e.id, e); for (const e of S.lib) if (!m.has(e.id)) m.set(e.id, e); return m; };
const lastSets = id => { for (let i = S.log.length - 1; i >= 0; i--) { const e = (S.log[i].ex || []).find(x => x.id === id && x.sets.length); if (e) return e.sets; } return null; };
const bestKg = (id, before = Infinity) => { let b = 0; for (const s of S.log) if (s.start < before) for (const e of s.ex || []) if (e.id === id) for (const x of e.sets) b = Math.max(b, num(x.kg)); return b; };
const setsTxt = sets => sets.map(x => `${num(x.kg)} kg × ${x.r || '?'}`).join(' · ');
const lastDone = sid => { for (let i = S.log.length - 1; i >= 0; i--) if (S.log[i].sid === sid) return S.log[i].start; return 0; };
const suggested = () => [...S.program].sort((a, b) => lastDone(a.id) - lastDone(b.id))[0];
const weekCounts = () => { const m = new Map(); for (const s of S.log) { const k = monday(s.start); m.set(k, (m.get(k) || 0) + 1); } return m; };
function streak() {
  const m = weekCounts(), goal = S.set.goal, W = 7 * 864e5; let wk = monday(Date.now()), n = 0;
  const thisWeek = m.get(wk) || 0, ok = thisWeek >= goal;
  if (!ok) wk -= W;
  while ((m.get(wk) || 0) >= goal) { n++; wk -= W; }
  return { n, ok, thisWeek };
}
const tonnage = () => S.log.reduce((a, s) => a + (s.vol || 0), 0);
const prCount = () => S.log.reduce((a, s) => a + (s.prs || []).length, 0);
const BADGES = [
  { id: 'first', t: 1, i: '1', n: 'Première séance', ok: () => S.log.length >= 1 },
  { id: 's10', t: 1, i: '10', n: '10 séances', ok: () => S.log.length >= 10 },
  { id: 's25', t: 2, i: '25', n: '25 séances', ok: () => S.log.length >= 25 },
  { id: 's50', t: 3, i: '50', n: '50 séances', ok: () => S.log.length >= 50 },
  { id: 's100', t: 4, i: '100', n: '100 séances', ok: () => S.log.length >= 100 },
  { id: 'w4', t: 1, i: '4', n: '4 semaines de feu', ok: () => S.best >= 4 },
  { id: 'w8', t: 2, i: '8', n: '8 semaines de feu', ok: () => S.best >= 8 },
  { id: 'w12', t: 3, i: '12', n: '12 semaines de feu', ok: () => S.best >= 12 },
  { id: 'w26', t: 4, i: '26', n: '6 mois de feu', ok: () => S.best >= 26 },
  { id: 't10', t: 1, i: '10 t', n: '10 tonnes soulevées', ok: () => tonnage() >= 1e4 },
  { id: 't50', t: 2, i: '50 t', n: '50 tonnes soulevées', ok: () => tonnage() >= 5e4 },
  { id: 't100', t: 3, i: '100 t', n: '100 tonnes soulevées', ok: () => tonnage() >= 1e5 },
  { id: 'pr5', t: 1, i: 'PR', n: '5 records battus', ok: () => prCount() >= 5 },
  { id: 'pr25', t: 3, i: 'PR', n: '25 records battus', ok: () => prCount() >= 25 },
  { id: 'early', t: 2, i: '7h', n: 'Séance avant 8h', ok: () => S.log.some(s => new Date(s.start).getHours() < 8) },
  { id: 'long', t: 2, i: '90', n: 'Séance de 1h30', ok: () => S.log.some(s => s.end - s.start >= 5400e3) }
];
function checkBadges() { const fresh = []; S.best = Math.max(S.best || 0, streak().n); for (const b of BADGES) if (!S.badges[b.id] && b.ok()) { S.badges[b.id] = Date.now(); fresh.push(b); } return fresh; }
const badgeHtml = (b, on) => `<div class="badge ${on ? 't' + b.t : 'lock'}"><b>${esc(b.i)}</b>${esc(b.n)}</div>`;

/* ---------- rendu ---------- */
const app = $('#app');
function go(v) { view = v; render(); window.scrollTo(0, 0); }
function render() {
  for (const b of document.querySelectorAll('#nav button')) b.classList.toggle('sel', b.dataset.view === view);
  app.innerHTML = ({ home: vHome, workout: vWorkout, program: vProgram, progress: vProgress, coach: vCoach }[view] || vHome)();
  if (view === 'workout' && S.draft) { const c = S.draft.ex[S.draft.cur]; if (c) fillMedia(c.id); }
  if (view === 'progress') drawChart();
  tick();
}
const spotifyBtn = (cls = '') => S.set.spotify ? `<a class="btn ${cls}" href="${esc(S.set.spotify)}" target="_blank" rel="noopener">Musique Spotify</a>` : '';

function vHome() {
  const st = streak(), sug = suggested(), D = S.draft, m = weekCounts(), W = 7 * 864e5, now = monday(Date.now());
  const weeks = Array.from({ length: 8 }, (_, i) => { const k = now - (7 - i) * W; return `<i class="${(m.get(k) || 0) >= S.set.goal ? 'on' : ''} ${k === now ? 'now' : ''}" title="${dateFr(k)}"></i>`; }).join('');
  const run = RUNS[isoWeek(Date.now()) % 3], pogi = isoWeek(Date.now()) % 4 === 0;
  return `
  <div class="between"><h1>Salut Nathan</h1><button class="sm ghost" data-act="settings">Réglages</button></div>
  <div class="card streak">${FLAME.replace('class="flame"', `class="flame ${st.n || st.ok ? '' : 'off'}"`)}
    <div><div class="num">${st.n} <span style="font-size:20px">semaine${st.n > 1 ? 's' : ''}</span></div>
    <div class="small" style="color:#d8dae0">${st.ok ? 'Semaine validée, la flamme continue.' : `Cette semaine : ${st.thisWeek}/${S.set.goal} séance${S.set.goal > 1 ? 's' : ''} pour garder la flamme.`}</div>
    <div class="weeks">${weeks}</div></div></div>
  ${D ? `<div class="card next"><p class="tiny">Séance en cours</p><h2>${esc(D.name)}</h2><button class="p wide" style="margin-top:10px" data-act="goto" data-v="workout">Reprendre la séance</button></div>`
      : `<div class="card next"><p class="tiny">Conseillée : c'est celle que tu as faite il y a le plus longtemps</p><h2>${esc(sug.name)}</h2><p class="mute small">${esc(sug.sub || '')}</p>
      <div class="row" style="margin-top:10px"><button class="p grow" data-act="start" data-sid="${sug.id}">Commencer</button>${spotifyBtn('grow')}</div></div>`}
  ${!S.set.spotify ? `<p class="tiny">Ajoute le lien de ta playlist dans Réglages pour avoir un bouton Spotify ici.</p>` : ''}
  <div class="sec">Choisir une autre séance</div>
  <div class="card">${S.program.map(s => { const l = lastDone(s.id); return `<div class="sess"><div><h3>${esc(s.name)}</h3><div class="tiny">${s.ex.length} exercices · ${l ? 'dernière fois ' + dateFr(l) : 'jamais faite'}</div></div><button class="sm" data-act="start" data-sid="${s.id}" ${D ? 'disabled' : ''}>Lancer</button></div>`; }).join('')}
    <div class="sess"><div><h3>Séance libre</h3><div class="tiny">Tu ajoutes les exercices au fur et à mesure</div></div><button class="sm" data-act="start" data-sid="" ${D ? 'disabled' : ''}>Lancer</button></div></div>
  <div class="sec">Cardio de la semaine (suivi dans Strava)</div>
  <div class="card"><h3>Course : ${esc(run.t)}</h3><p class="small mute">${esc(run.d)}. Échauffement 15 min, retour au calme 10 min.</p>
    <h3 style="margin-top:12px">Vélo : ${pogi ? 'sortie « Pogačar » 60 km' : 'endurance 50–70 km'}</h3><p class="small mute">${pogi ? '4 à 5 efforts de 5 min en côte, récup 3–4 min.' : 'Zone 2 : tu dois pouvoir parler. Cadence 85–95.'}</p>
    <a class="btn wide" style="margin-top:8px" href="https://www.strava.com/dashboard" target="_blank" rel="noopener">Ouvrir Strava</a>
    <p class="tiny" style="margin-top:8px">Pour analyser tes sorties, demande à Claude : il lit ton Strava.</p></div>
  <div class="sec">Paliers</div>
  <div class="badges">${BADGES.filter(b => S.badges[b.id]).slice(-6).map(b => badgeHtml(b, true)).join('') || '<p class="tiny">Termine ta première séance pour débloquer ton premier palier.</p>'}</div>`;
}

const demoBlock = (id, q, label) => `<details data-mfor="${esc(id)}" ${S.guides[id] ? 'open' : ''}><summary>${label}</summary>
  ${S.guides[id] ? `<p class="small" style="white-space:pre-wrap">${esc(S.guides[id])}</p>` : ''}
  <div class="media" data-media="${esc(id)}"></div>
  <div class="row"><label class="btn sm">Ajouter photo, GIF ou vidéo<input type="file" accept="image/*,video/*" multiple hidden data-add="${esc(id)}"></label><a class="btn sm" href="${yt(q)}" target="_blank" rel="noopener">Vidéos YouTube</a></div></details>`;
function exCard(e, i, D) {
  const cur = i === D.cur, done = e.state === 'done', skip = e.state === 'skip', nOk = e.sets.filter(s => s.ok).length;
  const pill = done ? '<span class="pill ok">Fait</span>' : skip ? '<span class="pill">Passé</span>' : cur ? '<span class="pill cur">En cours</span>' : `<span class="pill">${nOk}/${e.sets.length}</span>`;
  let body = '';
  if (cur) {
    const l = lastSets(e.id);
    body = `<div class="exb">${l ? `<p class="last">Dernière fois : ${esc(setsTxt(l))}</p>` : ''}
    ${e.sets.map((s, j) => `<div class="set ${s.ok ? 'ok' : ''}"><b class="num">${j + 1}</b>
      <div class="unit"><input inputmode="decimal" aria-label="Charge série ${j + 1}" value="${esc(s.kg)}" data-f="kg" data-j="${j}"><span>kg</span></div>
      <div class="unit"><input inputmode="numeric" aria-label="Répétitions série ${j + 1}" placeholder="${esc(e.reps)}" value="${esc(s.r)}" data-f="r" data-j="${j}"><span>reps</span></div>
      <button class="ck" data-act="ck" data-j="${j}" aria-label="Valider la série ${j + 1}">${s.ok ? 'Fait' : 'OK'}</button></div>`).join('')}
    <div class="row" style="margin-top:8px"><button class="sm" data-act="addset">+ série</button><button class="sm" data-act="rmset" ${e.sets.length < 2 ? 'disabled' : ''}>− série</button><button class="sm ghost" data-act="skip">Passer l'exercice</button></div>
    <button class="p wide" style="margin-top:10px" data-act="exdone">Exercice terminé</button>
    <div style="margin-top:8px">${demoBlock(e.id, e.q, 'Guide, photos et vidéos')}</div></div>`;
  }
  return `<article class="ex ${cur ? 'cur' : ''} ${done ? 'done' : ''} ${skip ? 'skip' : ''}"><button class="exh" data-act="pick" data-i="${i}"><div><h3>${esc(e.n)}</h3><div class="tiny">${e.sets.length} × ${esc(e.reps)} · repos ${restLabel(e.rest)}</div></div>${pill}</button>${body}</article>`;
}
function vWorkout() {
  const D = S.draft;
  if (!D) return `<h1>Séance</h1><div class="card"><p>Aucune séance en cours.</p><button class="p wide" data-act="goto" data-v="home">Choisir une séance</button></div>`;
  const left = D.ex.filter(e => e.state === 'todo').length;
  return `<div class="whead"><div class="between"><h2>${esc(D.name)}</h2>${spotifyBtn('sm')}</div>
    <div class="clocks"><div class="clk"><div class="tiny">Durée totale</div><div class="num" data-clock="total">0:00</div></div>
    <div class="clk rest" id="restBox"><div><div class="tiny" id="restLbl">Repos</div><div class="num" data-clock="rest">—</div></div><button class="sm p" data-act="stoprest" id="restStop">Stop</button></div></div></div>
  ${D.ex.map((e, i) => exCard(e, i, D)).join('')}
  <button class="wide" data-act="addex">+ Ajouter un exercice</button>
  <div class="card"><label>Ressenti, notes<textarea rows="2" data-f="note">${esc(D.note || '')}</textarea></label>
    <button class="p wide" style="margin-top:10px" data-act="finish">${left ? `Terminer la séance (${left} restant${left > 1 ? 's' : ''})` : 'Terminer la séance'}</button>
    <button class="ghost wide" style="margin-top:8px" data-act="abort">Abandonner la séance</button></div>`;
}

function vProgram() {
  return `<h1>Programme</h1><p class="mute small">Modifie tes séances : exercices, séries, répétitions, repos. Lance n'importe quelle séance n'importe quel jour depuis l'accueil.</p>
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

function vProgress() {
  const st = streak(), ids = [...new Set(S.log.flatMap(s => (s.ex || []).map(e => e.id)))], EX = allEx();
  const sel = ids.includes(chartId) ? chartId : (chartId = ids[0] || '');
  return `<h1>Progrès</h1>
  <div class="stats" style="margin-top:12px"><div class="stat"><div class="tiny">Séances</div><div class="num">${S.log.length}</div></div><div class="stat"><div class="tiny">Flamme (sem.)</div><div class="num">${st.n}</div></div><div class="stat"><div class="tiny">Soulevé</div><div class="num">${(tonnage() / 1000).toFixed(1)} t</div></div></div>
  <div class="card"><label>Progression d'un exercice<select data-act="chartsel">${ids.length ? ids.map(id => `<option value="${esc(id)}" ${id === sel ? 'selected' : ''}>${esc(EX.get(id)?.n || S.log.flatMap(s => s.ex).find(e => e.id === id)?.n || id)}</option>`).join('') : '<option>Pas encore de données</option>'}</select></label>
    <div class="fig"><svg id="chart" role="img" aria-label="Courbe de la charge maximale"></svg></div><p class="tiny" id="chartNote"></p></div>
  <div class="sec">Paliers (${Object.keys(S.badges).length}/${BADGES.length})</div>
  <div class="badges">${BADGES.map(b => badgeHtml(b, S.badges[b.id])).join('')}</div>
  <div class="sec">Historique</div>
  <div class="card">${S.log.length ? `<table class="hist"><tbody>${[...S.log].reverse().map(s => `<tr><td><b>${esc(s.name)}</b><div class="tiny">${dateFr(s.start)} · ${fmt((s.end - s.start) / 1000)}${s.note ? ' · ' + esc(s.note) : ''}</div>
      <details><summary>Détail</summary>${(s.ex || []).map(e => `<div class="small"><b>${esc(e.n)}</b> : ${esc(setsTxt(e.sets))}</div>`).join('') || '<div class="tiny">Aucune série validée</div>'}<button class="sm ghost" style="margin-top:6px" data-act="dellog" data-id="${esc(s.id)}">Supprimer cette séance</button></details></td>
      <td class="r"><b class="num">${Math.round(s.vol || 0)} kg</b>${(s.prs || []).length ? `<div class="tiny" style="color:var(--acc-ink)">${s.prs.length} record${s.prs.length > 1 ? 's' : ''}</div>` : ''}</td></tr>`).join('')}</tbody></table>` : '<p class="tiny">Tes séances terminées apparaîtront ici.</p>'}</div>`;
}
let chartId = '';
function drawChart() {
  const svg = $('#chart'); if (!svg) return; const W = svg.clientWidth, H = svg.clientHeight; if (!W) return;
  const pts = S.log.filter(s => (s.ex || []).some(e => e.id === chartId)).map(s => ({ t: s.start, kg: Math.max(0, ...s.ex.find(e => e.id === chartId).sets.map(x => num(x.kg))) }));
  const note = $('#chartNote');
  if (pts.length < 2) { svg.innerHTML = `<text x="${W / 2}" y="${H / 2}" text-anchor="middle" fill="currentColor" opacity=".55" font-size="15">${pts.length ? 'Encore une séance pour voir la courbe' : 'Pas encore de données'}</text>`; note.textContent = ''; return; }
  const mn = Math.min(...pts.map(p => p.kg)), mx = Math.max(...pts.map(p => p.kg)), px = 34, py = 26;
  const x = i => px + i * (W - 2 * px) / (pts.length - 1), y = v => H - py - (mx === mn ? .5 : (v - mn) / (mx - mn)) * (H - 2 * py);
  svg.innerHTML = `<line x1="${px}" x2="${W - px}" y1="${H - py}" y2="${H - py}" stroke="currentColor" opacity=".15"/><path d="${pts.map((p, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(p.kg).toFixed(1)).join('')}" fill="none" stroke="#e0262e" stroke-width="3" stroke-linejoin="round"/>${pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.kg)}" r="4.5" fill="#e0262e"/>`).join('')}<text x="${px}" y="15" font-size="13" fill="currentColor">${mx} kg</text><text x="${px}" y="${H - 6}" font-size="13" fill="currentColor" opacity=".6">${mn} kg</text>`;
  const dlt = pts.at(-1).kg - pts[0].kg; note.textContent = `Charge la plus lourde à chaque séance : ${pts[0].kg} kg au début, ${pts.at(-1).kg} kg la dernière fois (${dlt >= 0 ? '+' : ''}${dlt.toFixed(1)} kg).`;
}
new ResizeObserver(() => view === 'progress' && drawChart()).observe(document.body);

/* coach */
const QUICK = ['Quelles charges je dois augmenter à ma prochaine séance ?', "Je stagne au développé couché, qu'est-ce que je change ?", 'Fais-moi le bilan de mes 2 dernières semaines.', 'Que manger avant et après la salle pour être sec ?'];
function coachPrompt(q) {
  const EXm = allEx();
  const recent = S.log.slice(-12).map(s => `- ${dateFr(s.start)} ${s.name} (${fmt((s.end - s.start) / 1000)}) : ` + (s.ex || []).map(e => `${e.n} ${setsTxt(e.sets)}`).join(' ; ') + (s.note ? ` | ressenti : ${s.note}` : '')).join('\n') || '- aucune séance enregistrée';
  const prog = S.program.map(s => `${s.name} : ` + s.ex.map(e => `${e.n} ${e.sets}×${e.reps}`).join(', ')).join('\n');
  return `Je suis Nathan (67 kg, 1,76 m), étudiant ingénieur. Objectifs : prendre du muscle et être sec pour l'été, courir 10 km à 4:30/km, vélo de route. Je t'écris depuis mon appli Carnet sport.\n\nMon programme muscu :\n${prog}\n\nMes dernières séances :\n${recent}\n\nFlamme : ${streak().n} semaine(s) d'affilée.\n\nMa question : ${q}`;
}
function vCoach() {
  const on = navigator.onLine;
  return `<h1>Coach</h1><p class="mute small">Ta question part chez Claude avec tes dernières séances et ton programme. Tu n'as rien à réexpliquer.</p>
  ${on ? '' : '<p class="offline">Pas de réseau en ce moment. Écris ta question, elle reste prête pour quand tu en retrouves.</p>'}
  <div class="card"><div class="chips">${QUICK.map((q, i) => `<button data-act="quick" data-i="${i}">${esc(q)}</button>`).join('')}</div>
    <label style="margin-top:12px">Ta question<textarea rows="3" id="cq" data-f="coachq">${esc(S.coachQ || '')}</textarea></label>
    <button class="p wide" style="margin-top:10px" data-act="ask" ${on ? '' : 'disabled'}>Demander à Claude</button>
    <button class="wide" style="margin-top:8px" data-act="copyctx">Copier mon résumé</button>
    <p class="tiny" style="margin-top:8px">Le bouton ouvre Claude avec ta question déjà écrite. Pour une analyse de tes sorties course et vélo, Claude peut aussi lire ton Strava.</p></div>`;
}

/* ---------- séance : logique ---------- */
function start(sid) {
  const s = S.program.find(p => p.id === sid);
  const mk = e => { const l = lastSets(e.id); return { id: e.id, n: e.n, reps: e.reps, rest: +e.rest || 90, q: e.q || e.n + ' technique', state: 'todo', sets: Array.from({ length: +e.sets || 3 }, (_, i) => ({ kg: l ? (l[i] || l.at(-1)).kg : '', r: '', ok: false })) }; };
  S.draft = { id: uid(), sid: s ? s.id : '', name: s ? s.name : 'Séance libre', start: Date.now(), cur: 0, rest: null, note: '', ex: s ? s.ex.map(mk) : [] };
  save(); wake(); go('workout');
  if (!s) addExSheet();
}
const nextTodo = D => { for (let k = 1; k <= D.ex.length; k++) { const i = (D.cur + k) % D.ex.length; if (D.ex[i].state === 'todo') return i; } return -1; };
function finish() {
  const D = S.draft; if (!D) return;
  const ex = D.ex.map(e => ({ id: e.id, n: e.n, sets: e.sets.filter(s => s.ok).map(s => ({ kg: num(s.kg), r: parseInt(s.r) || 0 })) })).filter(e => e.sets.length);
  const prs = ex.filter(e => { const b = bestKg(e.id); const m = Math.max(...e.sets.map(s => s.kg)); return m > 0 && m > b && S.log.some(s => (s.ex || []).some(x => x.id === e.id)); }).map(e => e.n);
  const entry = { id: D.id, sid: D.sid, name: D.name, start: D.start, end: Date.now(), note: (D.note || '').trim(), ex, prs, vol: ex.reduce((a, e) => a + e.sets.reduce((b, s) => b + s.kg * s.r, 0), 0) };
  const before = streak().n;
  S.log.push(entry); S.draft = null;
  const fresh = checkBadges(); save(); releaseWake();
  const st = streak();
  go('home');
  sheet(`<div class="summary"><h2>Séance terminée</h2><p class="mute">${esc(entry.name)} · ${dateFr(entry.start)}</p>
    <div class="stats" style="margin-top:12px"><div class="stat"><div class="tiny">Durée</div><div class="num">${fmt((entry.end - entry.start) / 1000)}</div></div><div class="stat"><div class="tiny">Séries</div><div class="num">${ex.reduce((a, e) => a + e.sets.length, 0)}</div></div><div class="stat"><div class="tiny">Soulevé</div><div class="num">${Math.round(entry.vol)} kg</div></div></div>
    ${prs.length ? `<div class="card"><h3>Nouveau${prs.length > 1 ? 'x' : ''} record${prs.length > 1 ? 's' : ''}</h3><p>${prs.map(esc).join(' · ')}</p></div>` : ''}
    <div class="card streak">${FLAME}<div><div class="num">${st.n}</div><div class="small" style="color:#d8dae0">${st.n > before ? 'La flamme grandit ! Semaine validée.' : st.ok ? 'Semaine déjà validée, tu en fais plus : bien joué.' : 'Continue cette semaine pour valider la flamme.'}</div></div></div>
    ${fresh.length ? `<div class="sec">Palier${fresh.length > 1 ? 's' : ''} débloqué${fresh.length > 1 ? 's' : ''}</div><div class="badges">${fresh.map(b => badgeHtml(b, true)).join('')}</div>` : ''}
    <button class="p wide" style="margin-top:14px" data-close>Super</button></div>`);
}

/* ---------- chrono ---------- */
function tick() {
  const D = S.draft, live = $('#live');
  live.hidden = !D || view === 'workout';
  if (!D) return;
  const tot = fmt((Date.now() - D.start) / 1000);
  for (const el of document.querySelectorAll('[data-clock="total"]')) el.textContent = tot;
  const r = D.rest, el = $('[data-clock="rest"]'), box = $('#restBox'), lv = $('#lvRest'), stop = $('#lvStop');
  if (r) {
    const sec = (Date.now() - r.since) / 1000, over = sec > r.target, txt = `${fmt(sec)} / ${fmt(r.target)}`;
    if (el) { el.textContent = fmt(sec); box.classList.toggle('over', over); box.classList.remove('idle'); $('#restLbl').textContent = `Repos · ${fmt(r.target)}`; $('#restStop').hidden = false; }
    lv.textContent = 'Repos ' + txt; lv.classList.toggle('over', over); stop.hidden = false;
  } else {
    const c = D.ex[D.cur];
    if (el) { el.textContent = '—'; box.classList.add('idle'); box.classList.remove('over'); $('#restLbl').textContent = 'Repos'; $('#restStop').hidden = true; }
    lv.textContent = c ? c.n : 'Séance en cours'; lv.classList.remove('over'); stop.hidden = true;
  }
}
setInterval(tick, 500);
let wl = null;
async function wake() { try { if (S.draft && 'wakeLock' in navigator && !wl) { wl = await navigator.wakeLock.request('screen'); wl.addEventListener('release', () => { wl = null; }); } } catch (e) { } }
function releaseWake() { try { wl && wl.release(); } catch (e) { } wl = null; }
document.addEventListener('visibilitychange', () => { if (!document.hidden) { wake(); tick(); } });

/* ---------- feuilles ---------- */
function sheet(html) { $('#sheetBody').innerHTML = html; $('#sheet').hidden = false; }
function closeSheet() { $('#sheet').hidden = true; $('#sheetBody').innerHTML = ''; }
function addExSheet(target = 'draft', si) {
  const EX = [...allEx().values()];
  sheet(`<h2>Ajouter un exercice</h2>
    <label style="margin-top:10px">Chercher<input id="exq" placeholder="Ex. curl, tirage, presse…" autocomplete="off"></label>
    <div id="exlist" style="margin-top:6px;max-height:34vh;overflow:auto"></div>
    <div class="sec">Ou créer un nouvel exercice</div>
    <label>Nom<input id="nn" placeholder="Ex. Presse à cuisses"></label>
    <div class="trio"><label>Séries<input id="ns" inputmode="numeric" value="3"></label><label>Reps<input id="nr" value="10-12"></label><label>Repos (s)<input id="nt" inputmode="numeric" value="90"></label></div>
    ${target === 'draft' && S.draft && S.draft.sid ? `<label style="margin-top:10px;display:flex;gap:8px;align-items:center;color:var(--ink)"><input type="checkbox" id="nkeep" style="width:22px;min-height:22px"> L'ajouter aussi au programme ${esc(S.draft.name)}</label>` : ''}
    <button class="p wide" style="margin-top:12px" data-act="createex" data-target="${target}" data-si="${si ?? ''}">Créer et ajouter</button>
    <button class="ghost wide" style="margin-top:8px" data-close>Fermer</button>`);
  const list = () => { const q = ($('#exq').value || '').toLowerCase(); $('#exlist').innerHTML = EX.filter(e => e.n.toLowerCase().includes(q)).slice(0, 40).map(e => `<div class="list-item"><div><b>${esc(e.n)}</b><div class="tiny">${e.sets} × ${esc(e.reps)} · repos ${restLabel(+e.rest)}</div></div><button class="sm" data-act="pickex" data-id="${esc(e.id)}" data-target="${target}" data-si="${si ?? ''}">Ajouter</button></div>`).join('') || '<p class="tiny">Aucun résultat : crée-le en dessous.</p>'; };
  $('#exq').addEventListener('input', list); list();
}
function addExercise(e, target, si, keep) {
  if (target === 'program') { S.program[si].ex.push({ ...e }); save(); closeSheet(); render(); return; }
  const D = S.draft; const l = lastSets(e.id);
  D.ex.push({ id: e.id, n: e.n, reps: e.reps, rest: +e.rest || 90, q: e.q || e.n + ' technique', state: 'todo', sets: Array.from({ length: +e.sets || 3 }, (_, i) => ({ kg: l ? (l[i] || l.at(-1)).kg : '', r: '', ok: false })) });
  if (D.ex[D.cur]?.state !== 'todo' || D.ex.length === 1) D.cur = D.ex.length - 1;
  if (keep) { const p = S.program.find(p => p.id === D.sid); if (p && !p.ex.some(x => x.id === e.id)) p.ex.push({ ...e }); }
  save(); closeSheet(); render(); toast('Exercice ajouté');
}
function settingsSheet() {
  sheet(`<h2>Réglages</h2>
  <label style="margin-top:12px">Lien de ta playlist Spotify<input id="spurl" value="${esc(S.set.spotify)}" placeholder="https://open.spotify.com/playlist/…" inputmode="url"></label>
  <p class="tiny">Dans Spotify : ta playlist, ⋯, Partager, Copier le lien.</p>
  <label style="margin-top:10px">Séances par semaine pour garder la flamme<select id="goal">${[1, 2, 3, 4, 5, 6].map(n => `<option ${n === S.set.goal ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
  <label style="margin-top:10px">Repos entre deux exercices<select id="exrest">${[90, 120, 150, 180, 240].map(n => `<option value="${n}" ${n === S.set.exRest ? 'selected' : ''}>${fmt(n)}</option>`).join('')}</select></label>
  <button class="p wide" style="margin-top:14px" data-act="saveset">Enregistrer</button>
  <div class="sec">Sauvegarde</div>
  <p class="tiny">Tout est enregistré sur ton téléphone. Fais un export de temps en temps (Fichiers ou iCloud) pour ne rien perdre si tu changes de téléphone.</p>
  <div class="row"><button class="grow" data-act="export">Exporter mes données</button><label class="btn grow">Importer<input type="file" accept="application/json,.json" hidden id="impf"></label></div>
  <button class="ghost wide" style="margin-top:8px" data-close>Fermer</button>`);
}

/* ---------- toast ---------- */
let tt = null;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2200); }

/* ---------- événements ---------- */
const confirmTap = (b, label) => { if (b.dataset.sure) return true; b.dataset.sure = '1'; const o = b.textContent; b.textContent = label; setTimeout(() => { if (b.isConnected) { b.textContent = o; delete b.dataset.sure; } }, 3500); return false; };
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
    case 'settings': settingsSheet(); break;
    case 'start': if (!S.draft) start(b.dataset.sid); break;
    case 'pick': { const i = +b.dataset.i; D.cur = i; D.rest = null; if (D.ex[i].state !== 'todo') D.ex[i].state = 'todo'; save(); render(); const el = document.querySelectorAll('.ex')[i]; el && el.scrollIntoView({ block: 'start', behavior: 'smooth' }); break; }
    case 'ck': { const s = cur.sets[+b.dataset.j]; s.ok = !s.ok;
      if (s.ok) { if (!s.r) s.r = String(parseInt(cur.reps) || ''); const nx = cur.sets[+b.dataset.j + 1]; if (nx && nx.kg === '') nx.kg = s.kg;
        if (cur.sets.every(x => x.ok)) { cur.state = 'done'; D.rest = { since: Date.now(), target: S.set.exRest }; const n = nextTodo(D); if (n >= 0) D.cur = n; toast(n >= 0 ? 'Exercice fini · prochain : ' + D.ex[n].n : 'Dernier exercice fini !'); }
        else D.rest = { since: Date.now(), target: cur.rest }; }
      save(); render(); break; }
    case 'addset': cur.sets.push({ kg: cur.sets.at(-1)?.kg ?? '', r: '', ok: false }); save(); render(); break;
    case 'rmset': if (cur.sets.length > 1) cur.sets.pop(); save(); render(); break;
    case 'skip': cur.state = 'skip'; D.rest = null; { const n = nextTodo(D); if (n >= 0) D.cur = n; } save(); render(); break;
    case 'exdone': cur.state = cur.sets.some(s => s.ok) ? 'done' : 'skip'; D.rest = { since: Date.now(), target: S.set.exRest }; { const n = nextTodo(D); if (n >= 0) D.cur = n; } save(); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); break;
    case 'stoprest': D.rest = null; save(); tick(); break;
    case 'addex': addExSheet('draft'); break;
    case 'pickex': { const e = allEx().get(b.dataset.id); if (e) addExercise(e, b.dataset.target, b.dataset.si === '' ? undefined : +b.dataset.si, $('#nkeep')?.checked); break; }
    case 'createex': { const n = $('#nn').value.trim(); if (!n) { $('#nn').focus(); toast("Donne un nom à l'exercice"); break; } const e = X('c_' + uid(), n, parseInt($('#ns').value) || 3, $('#nr').value.trim() || '10', parseInt($('#nt').value) || 90); S.lib.push(e); addExercise(e, b.dataset.target, b.dataset.si === '' ? undefined : +b.dataset.si, $('#nkeep')?.checked); break; }
    case 'finish': if (D.ex.some(e => e.sets.some(s => s.ok)) || confirmTap(b, 'Aucune série validée : terminer quand même ?')) finish(); break;
    case 'abort': if (confirmTap(b, 'Toucher encore pour tout effacer')) { S.draft = null; save(); releaseWake(); go('home'); toast('Séance abandonnée'); } break;
    case 'delmedia': await mediaTx(st => st.delete(+b.dataset.k)); fillMedia(b.dataset.ex); break;
    case 'pmove': { const s = S.program[+b.dataset.si], i = +b.dataset.ei, j = i + +b.dataset.d; [s.ex[i], s.ex[j]] = [s.ex[j], s.ex[i]]; save(); render(); break; }
    case 'pdel': if (confirmTap(b, 'Sûr ?')) { S.program[+b.dataset.si].ex.splice(+b.dataset.ei, 1); save(); render(); } break;
    case 'paddex': addExSheet('program', +b.dataset.si); break;
    case 'paddsess': S.program.push({ id: 's_' + uid(), name: 'Nouvelle séance', sub: '', ex: [] }); save(); render(); window.scrollTo(0, document.body.scrollHeight); break;
    case 'pdelsess': if (S.program.length > 1 && confirmTap(b, 'Toucher encore pour supprimer')) { S.program.splice(+b.dataset.si, 1); save(); render(); } break;
    case 'preset': if (confirmTap(b, 'Toucher encore : tes modifications du programme seront perdues')) { S.program = defaultProgram(); save(); render(); toast('Programme de base rétabli'); } break;
    case 'dellog': if (confirmTap(b, 'Toucher encore pour supprimer')) { S.log = S.log.filter(s => s.id !== b.dataset.id); save(); render(); } break;
    case 'quick': { const q = QUICK[+b.dataset.i]; S.coachQ = q; $('#cq').value = q; save(); break; }
    case 'ask': { const q = ($('#cq').value || '').trim() || QUICK[0]; const p = coachPrompt(q); try { await navigator.clipboard.writeText(p); } catch (e) { } const l = document.createElement('a'); l.href = 'https://claude.ai/new?q=' + encodeURIComponent(p.slice(0, 6000)); l.target = '_blank'; l.rel = 'noopener'; document.body.appendChild(l); l.click(); l.remove(); break; }
    case 'copyctx': { const p = coachPrompt(($('#cq').value || '').trim() || '(écris ta question ici)'); try { await navigator.clipboard.writeText(p); toast('Résumé copié : colle-le dans Claude'); } catch (e) { sheet(`<h2>Ton résumé</h2><p class="tiny">Sélectionne le texte et copie-le.</p><textarea rows="12" readonly>${esc(p)}</textarea><button class="wide" style="margin-top:8px" data-close>Fermer</button>`); } break; }
    case 'saveset': { const v = $('#spurl').value.trim(); if (v && !/^https:\/\/(open\.)?spotify\.com\//.test(v) && !/^https:\/\/spotify\.link\//.test(v)) { toast('Colle un lien Spotify (https://open.spotify.com/…)'); break; } S.set.spotify = v; S.set.goal = +$('#goal').value; S.set.exRest = +$('#exrest').value; save(); closeSheet(); render(); toast('Réglages enregistrés'); break; }
    case 'export': { const blob = new Blob([JSON.stringify({ app: 'carnet-sport', v: 1, at: Date.now(), program: S.program, lib: S.lib, log: S.log, badges: S.badges, best: S.best, set: S.set, guides: S.guides })], { type: 'application/json' }); const l = document.createElement('a'); l.href = URL.createObjectURL(blob); l.download = 'carnet-sport-' + new Date().toISOString().slice(0, 10) + '.json'; document.body.appendChild(l); l.click(); l.remove(); toast('Fichier exporté'); break; }
  }
});
document.addEventListener('input', ev => {
  const t = ev.target, D = S.draft;
  if (t.dataset.f === 'kg' || t.dataset.f === 'r') { const c = D.ex[D.cur]; c.sets[+t.dataset.j][t.dataset.f] = t.value; save(); }
  else if (t.dataset.f === 'note' && D) { D.note = t.value; save(); }
  else if (t.dataset.guide) { const v = t.value; if (v.trim()) S.guides[t.dataset.guide] = v; else delete S.guides[t.dataset.guide]; save(); }
  else if (t.dataset.f === 'coachq') { S.coachQ = t.value; save(); }
  else if (t.dataset.pf) { const s = S.program[+t.dataset.si]; if (t.dataset.ei === undefined) s[t.dataset.pf] = t.value; else { const e = s.ex[+t.dataset.ei], f = t.dataset.pf; e[f] = f === 'sets' || f === 'rest' ? (parseInt(t.value) || 0) : t.value; if (f === 'n') e.q = t.value + ' technique'; } save(); }
});
document.addEventListener('change', async ev => {
  const t = ev.target;
  if (t.dataset.add && t.files.length) { await idbReady; for (const f of t.files) { if (f.size > 200e6) { toast('Vidéo trop lourde (max 200 Mo)'); continue; } await mediaTx(st => st.add({ ex: t.dataset.add, blob: f, type: f.type || '' })); } fillMedia(t.dataset.add); toast('Ajouté à cet exercice'); }
  else if (t.dataset.act === 'chartsel') { chartId = t.value; drawChart(); }
  else if (t.id === 'impf' && t.files[0]) {
    try { const v = JSON.parse(await t.files[0].text()); if (v.app !== 'carnet-sport' || !Array.isArray(v.log)) throw 0;
      const have = new Set(S.log.map(s => s.id)); for (const s of v.log) if (s && s.id && !have.has(s.id)) S.log.push(s); S.log.sort((a, b) => a.start - b.start);
      if (Array.isArray(v.program) && v.program.length) S.program = v.program; if (Array.isArray(v.lib)) S.lib = v.lib; S.badges = { ...v.badges, ...S.badges }; S.best = Math.max(S.best || 0, v.best || 0); if (v.set) S.set = { ...S.set, ...v.set }; if (v.guides) S.guides = { ...v.guides, ...S.guides };
      save(); closeSheet(); render(); toast('Données importées'); } catch (e) { toast("Ce fichier n'est pas une sauvegarde Carnet sport"); }
  }
});
document.addEventListener('toggle', ev => { const d = ev.target; if (d.open && d.dataset && d.dataset.mfor) fillMedia(d.dataset.mfor); }, true);
addEventListener('online', () => view === 'coach' && render()); addEventListener('offline', () => view === 'coach' && render());

/* ---------- hors ligne ---------- */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => { });
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloaded) return; reloaded = true; if (!S.draft) location.reload(); else toast("Nouvelle version prête : elle s'appliquera à la prochaine ouverture"); });
}

checkBadges(); save(); render(); if (S.draft) wake();
}
