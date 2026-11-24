'use strict';
/* Programme personnalisé (muscu, course, vélo), carte « Bien démarrer » de l'accueil et guide de l'app. */
{
const C = () => window.CARNET;
const VIEWS = window.VIEWS = window.VIEWS || {}, AFTER = window.AFTER = window.AFTER || {};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mm = s => { s = Math.round(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const iso = t => { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const DN = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'], ORDER = [1, 2, 3, 4, 5, 6, 0];
const LIB = () => (window.LIBRARY || []).map(e => ({ ...e, t: e.k || e.t }));

/* ---------- état du questionnaire ---------- */
let G = null, out = null;
const DEF = {
  gym: { goal: 'muscle', level: 'debutant', days: [1, 3, 5], dur: 60, eq: 'machines', prio: [], pain: [] },
  run: { goal: '10k', level: 'debutant', days: [2, 4, 6], weeks: 8 },
  bike: { goal: 'endu', days: [6], weeks: 8, km: 60 },
};
function start(kind) { const ks = ['gym', 'run', 'bike'].filter(k => window.PROFILE.has(k)); kind = kind && ks.includes(kind) ? kind : ks[0]; G = { kind, ...JSON.parse(JSON.stringify(DEF[kind])) }; out = null; C().go('gen'); }

/* ---------- muscu ---------- */
const SPLITS = {
  FB: [['Quadriceps', 'c'], ['Pecs', 'c'], ['Dos', 'c'], ['Ischios', 'i'], ['Épaules', 'c'], ['Abdos', 'a'], ['Fessiers', 'i'], ['Biceps', 'i'], ['Triceps', 'i']],
  Push: [['Pecs', 's'], ['Pecs', 'c'], ['Épaules', 'c'], ['Pecs', 'i'], ['Épaules', 'i'], ['Triceps', 'i'], ['Triceps', 'i'], ['Abdos', 'a']],
  Pull: [['Dos', 's'], ['Dos', 'c'], ['Dos', 'c'], ['Épaules', 'i'], ['Biceps', 'i'], ['Dos', 'i'], ['Biceps', 'i'], ['Abdos', 'a']],
  Legs: [['Quadriceps', 's'], ['Ischios', 'i'], ['Fessiers', 'c'], ['Quadriceps', 'i'], ['Mollets', 'i'], ['Fessiers', 'i'], ['Abdos', 'a'], ['Ischios', 'i']],
  Haut: [['Pecs', 'c'], ['Dos', 'c'], ['Épaules', 'c'], ['Dos', 'c'], ['Pecs', 'i'], ['Épaules', 'i'], ['Biceps', 'i'], ['Triceps', 'i']],
  Bas: [['Quadriceps', 's'], ['Fessiers', 'c'], ['Ischios', 'i'], ['Quadriceps', 'i'], ['Fessiers', 'i'], ['Mollets', 'i'], ['Abdos', 'a'], ['Abdos', 'a']],
};
const SPLITNAME = { FB: 'Corps entier', Push: 'Poussée (pecs, épaules, triceps)', Pull: 'Tirage (dos, biceps)', Legs: 'Jambes', Haut: 'Haut du corps', Bas: 'Bas du corps' };
const PRIO = { Pecs: ['Pecs'], Dos: ['Dos'], 'Épaules': ['Épaules'], Bras: ['Biceps', 'Triceps'], Jambes: ['Quadriceps', 'Ischios'], Fessiers: ['Fessiers'], Abdos: ['Abdos'] };
const PAIN = { genoux: /fente|squat|saut|bulgare|step|leg extension|hack/i, dos: /soulevé de terre|good morning|rowing barre|squat barre|extension lombaire|t-bar/i, 'épaules': /militaire|dips|nuque|menton|développé couché barre|upright/i };
const SCHEME = { muscle: { s: [4, '6-8', 150], c: [3, '8-10', 120], i: [3, '10-12', 75], a: [3, '15', 60] }, tone: { s: [3, '10-12', 90], c: [3, '12', 75], i: [3, '12-15', 60], a: [3, '20', 45] }, force: { s: [5, '4-6', 180], c: [4, '6-8', 150], i: [3, '8-10', 90], a: [3, '12', 60] }, forme: { s: [3, '10', 90], c: [3, '10-12', 75], i: [2, '12-15', 60], a: [2, '15', 45] } };
const rk = (p, t) => { const i = p.indexOf(t); return i < 0 ? 9 : i; };
function genGym(o) {
  const n = o.days.length, splits = n <= 2 ? ['FB', 'FB'] : n === 3 ? (o.level === 'debutant' ? ['FB', 'FB', 'FB'] : ['Push', 'Pull', 'Legs']) : n === 4 ? ['Haut', 'Bas', 'Haut', 'Bas'] : ['Push', 'Pull', 'Legs', 'Haut', 'Bas'];
  const nex = { 45: 5, 60: 6, 75: 7, 90: 8 }[o.dur] || 6, EQ = o.eq === 'machines' ? ['M', 'S', 'P'] : ['M', 'S', 'P', 'H', 'B', 'C', 'K'];
  const lib = LIB().filter(e => EQ.includes(e.eq) && e.t !== 'd' && !o.pain.some(p => PAIN[p] && PAIN[p].test(e.n)));
  const prioM = o.prio.flatMap(p => PRIO[p] || []), used = new Map(), letters = {};
  return splits.map((sp, si) => {
    let slots = SPLITS[sp].slice(0, nex);
    for (const pm of prioM) if (SPLITS[sp].some(s => s[0] === pm) && slots.length < nex + 2) slots.push([pm, 'i']);
    const taken = new Set(), ex = [];
    for (const [m, t] of slots) {
      const pref = { s: ['s', 'c'], c: ['c', 's', 'i'], i: ['i', 'c'], a: ['a'] }[t];
      const cand = lib.filter(e => e.m === m && !taken.has(e.id)).sort((a, b) => rk(pref, a.t) - rk(pref, b.t) || (EQ.indexOf(a.eq) - EQ.indexOf(b.eq)) || ((used.get(a.id) || 0) - (used.get(b.id) || 0)));
      const pool = cand.filter(e => pref.includes(e.t)); const pick = (pool.length ? pool : cand)[si % Math.max(1, Math.min(2, (pool.length ? pool : cand).length))];
      if (!pick) continue; taken.add(pick.id); used.set(pick.id, (used.get(pick.id) || 0) + 1);
      let [sets, reps, rest] = SCHEME[o.goal][t === 's' && o.level === 'debutant' ? 'c' : t];
      if (o.level === 'debutant') sets = Math.max(2, sets - 1); if (prioM.includes(m) && t !== 'a') sets++;
      if (pick.id === 'planche') reps = '30-45';
      ex.push({ id: pick.id, n: pick.n, sets, reps, rest, q: pick.n + ' technique' });
    }
    letters[sp] = (letters[sp] || 0) + 1;
    const same = splits.filter(x => x === sp).length;
    return { id: 'g' + Date.now().toString(36) + si, name: SPLITNAME[sp].split(' (')[0] + (same > 1 ? ' ' + 'ABCDE'[letters[sp] - 1] : ''), sub: SPLITNAME[sp] + ' · programme personnalisé', ex, day: o.days[si] };
  });
}

/* ---------- course ---------- */
function paceRef() { const S = C().S(), r = S.log.filter(l => l.kind === 'run' && l.km >= 3).slice(-5); return r.length ? r.reduce((a, l) => a + (l.pace || l.sec / l.km), 0) / r.length : null; }
function genRun(o) {
  const P = paceRef(), goal = window.PROFILE.goal() || (P ? P - 15 : null), W = o.weeks, n = o.days.length;
  const ef = P ? `à ${mm(P + 30)}–${mm(P + 60)}/km` : 'en aisance respiratoire', q = goal ? 'à ' + mm(goal - 10) + '/km' : 'rapide mais tenable', tempo = goal ? 'à ' + mm(goal + 10) + '/km' : '« confortablement difficile »';
  const LONG = { start: [0, 0], '5k': [4, 7], '10k': [6, 12], pace: [7, 11], semi: [10, 18] }[o.goal];
  const weeks = [];
  for (let w = 0; w < W; w++) {
    const f = W > 1 ? w / (W - 1) : 1, taper = w === W - 1 && o.goal !== 'start', s = [];
    if (o.goal === 'start') {
      const run = Math.min(30, Math.round(1 + f * 29)), walk = run >= 30 ? 0 : Math.max(1, 3 - Math.floor(f * 3)), reps = run >= 30 ? 1 : Math.max(2, Math.round(24 / (run + walk)));
      for (let k = 0; k < n; k++) s.push(run >= 30 ? (w === W - 1 && k === n - 1 ? '🏁 Test : 30 min sans t\'arrêter' : '30 min de course continue, très tranquille') : `${reps} × (${run} min course / ${walk} min marche)`);
    } else {
      const longKm = Math.round(LONG[0] + (LONG[1] - LONG[0]) * Math.min(1, f * 1.15)), inter = w % 2 === 0;
      const Q = inter ? `Fractionné ${['8 × 400 m', '6 × 600 m', '6 × 800 m', '5 × 1000 m', '4 × 1200 m'][Math.min(4, Math.floor(f * 5))]} ${q}, récup 1 min 30` : `Tempo ${Math.round(15 + f * 15)} min ${tempo}`;
      const order = n === 2 ? ['Q', 'L'] : n === 3 ? ['E', 'Q', 'L'] : ['E', 'Q', 'E', 'L'];
      for (const t of order) s.push(t === 'Q' ? (taper ? `Rappel : 4 × 400 m ${q}` : Q) : t === 'E' ? `Endurance ${Math.round(30 + f * 15)} min ${ef}` : taper ? `🏁 Course test : ${{ '5k': '5 km', '10k': '10 km', pace: '10 km', semi: 'semi-marathon (21,1 km)' }[o.goal]} à fond` : `Sortie longue ${longKm} km ${ef}`);
    }
    weeks.push(s);
  }
  return weeks;
}
/* ---------- vélo ---------- */
function genBike(o) {
  const W = o.weeks, n = o.days.length, weeks = [];
  for (let w = 0; w < W; w++) {
    const f = W > 1 ? w / (W - 1) : 1, s = [], longKm = Math.round(o.km * (0.55 + 0.45 * Math.min(1, f * 1.2)) / 5) * 5;
    const Q = o.goal === 'climb' ? `Côtes : ${4 + Math.floor(f * 3)} × 5 min en montée, récup en descente` : `Intervalles : ${3 + Math.floor(f * 2)} × ${8 + Math.floor(f * 4)} min au seuil, récup 4 min`;
    const order = n === 1 ? ['L'] : n === 2 ? ['Q', 'L'] : ['E', 'Q', 'L'];
    for (const t of order) s.push(t === 'L' ? (w === W - 1 ? `🏁 Objectif : sortie de ${o.km} km` : `Sortie longue ${longKm} km en zone 2, mange toutes les 45 min`) : t === 'Q' ? (o.goal === 'endu' ? `Sortie de ${Math.round(longKm * 0.5 / 5) * 5} km avec 3 accélérations de 5 min` : Q) : `Endurance ${Math.round(60 + f * 30)} min, rythme tranquille`);
    weeks.push(s);
  }
  return weeks;
}

/* ---------- vue ---------- */
const chip = (k, v, l, multi) => { const on = multi ? (G[k] || []).includes(v) : G[k] === v; return `<button class="${on ? 'sel' : ''}" data-gn="${multi ? 'tog' : 'set'}" data-k="${k}" data-v="${esc(v)}">${l}</button>`; };
const q = (t, body, d) => `<section class="gq"><h3>${t}</h3>${d ? `<p class="tiny">${d}</p>` : ''}<div class="gch">${body}</div></section>`;
const daysQ = () => q('Quels jours ?', ORDER.map(d => `<button class="${G.days.includes(d) ? 'sel' : ''}" data-gn="day" data-v="${d}">${DN[d]}</button>`).join(''), `${G.days.length} jour${G.days.length > 1 ? 's' : ''} choisi${G.days.length > 1 ? 's' : ''}. Laisse au moins un jour de repos entre deux séances si tu peux.`);
VIEWS.gen = () => {
  if (!G) start();
  const ks = ['gym', 'run', 'bike'].filter(k => window.PROFILE.has(k));
  const head = `<button class="link" data-act="goto" data-v="program">← Séances</button><div class="kicker">Sur mesure</div><h1>Mon programme personnalisé</h1>
    <div class="sportseg" style="grid-template-columns:repeat(${ks.length},minmax(0,1fr));margin-top:12px">${ks.map(k => `<button class="${G.kind === k ? 'sel' : ''}" style="--c:${{ gym: 'var(--acc)', run: '#2563eb', bike: '#16a34a' }[k]}" data-gn="kind" data-v="${k}"><span>${{ gym: '🏋️', run: '🏃', bike: '🚴' }[k]}</span>${{ gym: 'Muscu', run: 'Course', bike: 'Vélo' }[k]}</button>`).join('')}</div>`;
  if (out) return head + preview();
  let form = '';
  if (G.kind === 'gym') form = q('Ton objectif', chip('goal', 'muscle', '💪 Prendre du muscle') + chip('goal', 'tone', '🔥 Tonifier, perdre du gras') + chip('goal', 'force', '🏋️ Gagner en force') + chip('goal', 'forme', '🌱 Remise en forme'))
    + q('Ton niveau', chip('level', 'debutant', 'Débutant') + chip('level', 'inter', 'Quelques mois') + chip('level', 'confirme', 'Plus d\'un an'))
    + daysQ() + q('Durée d\'une séance', [45, 60, 75, 90].map(d => chip('dur', d, d + ' min')).join(''))
    + q('Ton matériel', chip('eq', 'machines', '⚙️ Machines guidées et poulies') + chip('eq', 'all', '🏋️ Tout (haltères, barres…)'), 'Les machines guident le mouvement : plus sûr quand on s\'entraîne seul.')
    + q('Zones à travailler en priorité', Object.keys(PRIO).map(p => chip('prio', p, p, true)).join(''), 'Facultatif : une série de plus et un exercice en plus pour ces zones.')
    + q('Des douleurs ?', [['genoux', 'Genoux'], ['dos', 'Bas du dos'], ['épaules', 'Épaules']].map(([v, l]) => chip('pain', v, l, true)).join(''), 'Les exercices qui les sollicitent le plus sont écartés. En cas de douleur, demande l\'avis d\'un médecin.');
  else if (G.kind === 'run') form = q('Ton objectif', chip('goal', 'start', '🌱 Courir 30 min sans m\'arrêter') + chip('goal', '5k', '5 km') + chip('goal', '10k', '10 km') + chip('goal', 'pace', '⚡ Améliorer mon allure') + chip('goal', 'semi', 'Semi-marathon'))
    + daysQ() + q('Durée du plan', [6, 8, 10, 12].map(w => chip('weeks', w, w + ' semaines')).join(''), window.PROFILE.goal() ? `Les allures sont calculées sur ton objectif de ${window.PROFILE.goalTxt()}/km${paceRef() ? ' et tes dernières courses' : ''}.` : paceRef() ? 'Les allures sont calculées sur tes dernières courses.' : 'Sans course enregistrée, le plan parle en sensations (aisance, rapide mais tenable).');
  else form = q('Ton objectif', chip('goal', 'endu', '🛣️ Rouler plus longtemps') + chip('goal', 'speed', '⚡ Rouler plus vite') + chip('goal', 'climb', '⛰️ Mieux grimper'))
    + q('Distance visée pour ta grande sortie', [40, 60, 80, 100, 150].map(k => chip('km', k, k + ' km')).join('')) + daysQ() + q('Durée du plan', [6, 8, 10, 12].map(w => chip('weeks', w, w + ' semaines')).join(''));
  return head + `<div class="genform">${form}</div><button class="p wide" style="margin-top:14px" data-gn="go">✨ Créer mon programme</button>`;
};
function preview() {
  if (G.kind === 'gym') return `<div class="tcard"><p class="small">${out.length} séances, à faire ${G.days.map(d => DN[d].toLowerCase()).join(', ')}. Tu pourras tout modifier ensuite dans Séances (charges, exercices, ordre).</p></div>
    ${out.map(s => `<section class="tcard gsess"><div class="between"><h3>${esc(s.name)}</h3><span class="chip2">${DN[s.day]}</span></div><p class="tiny">${esc(s.sub)}</p>${s.ex.map((e, i) => `<div class="gex"><span>${i + 1}</span><span class="grow"><b>${esc(e.n)}</b><small>${e.sets} × ${esc(e.reps)} · repos ${e.rest} s</small></span></div>`).join('')}</section>`).join('')}
    <label class="checkrow"><input type="checkbox" id="gnplan" checked> Planifier ces séances chaque semaine (${G.days.map(d => DN[d]).join(', ')})</label>
    <div class="row" style="margin-top:12px"><button class="p grow" data-gn="apply" data-v="add">Ajouter à mes séances</button><button class="grow" data-gn="apply" data-v="replace">Remplacer mes séances</button></div><button class="ghost wide" style="margin-top:8px" data-gn="edit">← Modifier mes réponses</button>`;
  const first = nextStart();
  return `<div class="tcard"><p class="small">${out.length} semaines à partir du ${first.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}, ${G.days.length} sortie${G.days.length > 1 ? 's' : ''} par semaine. Chaque sortie apparaîtra dans ton calendrier et sur l'accueil le jour J.</p></div>
    ${out.map((w, i) => `<section class="tcard gsess"><h3>Semaine ${i + 1}</h3>${w.map((s, k) => `<div class="gex"><span>${DN[sortedDays()[k % sortedDays().length]]}</span><span class="grow">${esc(s)}</span></div>`).join('')}</section>`).join('')}
    <div class="row" style="margin-top:12px"><button class="p grow" data-gn="apply" data-v="plan">Ajouter à mon calendrier</button></div><button class="ghost wide" style="margin-top:8px" data-gn="edit">← Modifier mes réponses</button>`;
}
const sortedDays = () => G.days.slice().sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
function nextStart() { const d = new Date(); d.setHours(0, 0, 0, 0); const dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow + (dow > 2 ? 7 : 0)); return d; }
function apply(mode) {
  const S = C().S(); S.plans = S.plans || [];
  if (G.kind === 'gym') {
    const sess = out.map(({ day, ...s }) => s);
    if (mode === 'replace') { S.plans = S.plans.filter(p => p.kind !== 'muscu'); S.program = sess; S.set.prSession = false; } else S.program.push(...sess);
    if (document.getElementById('gnplan')?.checked) out.forEach((s, i) => S.plans.push({ id: 'p_' + s.id, kind: 'muscu', sid: s.id, name: '', days: [s.day], repeat: 'week', moment: 'apm', from: Date.now() }));
  } else {
    const kind = G.kind; S.plans = S.plans.filter(p => p.gen !== kind);
    const mon = nextStart(), days = sortedDays();
    out.forEach((w, wi) => w.forEach((s, k) => { const d = days[k % days.length], t = new Date(mon); t.setDate(t.getDate() + wi * 7 + ORDER.indexOf(d)); if (t.getTime() < new Date().setHours(0, 0, 0, 0)) return; S.plans.push({ id: 'p_' + kind + wi + '_' + k + Date.now().toString(36), kind, sid: '', name: s.slice(0, 90), days: [d], repeat: 'once', date: iso(t), moment: kind === 'run' ? 'soir' : 'matin', gen: kind }); }));
  }
  S.set.genDone = true; C().save(); G = null; out = null;
  C().toast('Programme ajouté ✨'); C().go(kindDest());
}
let lastKind = 'gym'; const kindDest = () => 'program';
document.addEventListener('click', e => {
  const b = e.target.closest('[data-gn]'); if (!b || !window.CARNET) return; const a = b.dataset.gn, v = b.dataset.v;
  if (a === 'start') { start(v); return; }
  if (!G) return;
  if (a === 'kind') { G = null; start(v); return; }
  if (a === 'set') G[b.dataset.k] = isNaN(+v) || v === '' ? v : +v;
  else if (a === 'tog') { const L = G[b.dataset.k] = G[b.dataset.k] || []; const i = L.indexOf(v); i >= 0 ? L.splice(i, 1) : L.push(v); }
  else if (a === 'day') { const d = +v, i = G.days.indexOf(d); if (i >= 0) { if (G.days.length > 1) G.days.splice(i, 1); } else if (G.days.length < (G.kind === 'gym' ? 5 : 4)) G.days.push(d); else C().toast(G.kind === 'gym' ? '5 séances maximum par semaine' : '4 sorties maximum par semaine'); G.days = sortedDays(); }
  else if (a === 'go') { out = G.kind === 'gym' ? genGym(G) : G.kind === 'run' ? genRun(G) : genBike(G); window.scrollTo(0, 0); }
  else if (a === 'edit') out = null;
  else if (a === 'apply') { apply(v); return; }
  C().render();
});

/* ---------- accueil : bien démarrer ---------- */
window.GEN = {
  start,
  starter() {
    const S = C().S(); if (S.set.starterOff) return '';
    const steps = [['guide', '📖', 'Faire le tour de l\'app', '2 minutes pour tout comprendre', !!S.set.guideSeen, 'data-act="goto" data-v="guide"'],
      ['gen', '✨', 'Créer mon programme personnalisé', 'Muscu, course ou vélo, selon tes objectifs', !!S.set.genDone, 'data-gn="start"'],
      ['plan', '📅', 'Planifier ma semaine', 'Tes séances apparaissent le jour J', (S.plans || []).length > 0, 'data-act="goto" data-v="program"'],
      ['friends', '👥', 'Ajouter mes proches', 'Pour s\'encourager entre amis', !!S.set.hasFriends, 'data-so="sub" data-v="friends"'],
      ['first', '🎯', 'Faire ma première activité', 'Séance en mode salle ou sortie notée', S.log.length > 0, 'data-act="goto" data-v="program"']];
    const done = steps.filter(s => s[4]).length; if (done === steps.length) return '';
    return `<section class="card starter"><div class="between"><div class="eyebrow" style="margin:0">Bien démarrer · ${done}/${steps.length}</div><button class="link" data-act="starteroff">Masquer</button></div>
      <div class="ch-bar" style="margin:8px 0 4px"><i style="width:${done / steps.length * 100}%"></i></div>
      ${steps.map(([k, i, t, d, ok, attr]) => `<button class="arow st ${ok ? 'ok' : ''}" ${attr}><span class="a-ic" style="--c:${ok ? 'var(--ok)' : 'var(--acc)'}">${ok ? '✓' : i}</span><span class="a-t"><b>${t}</b><small>${d}</small></span><span class="mer-go">›</span></button>`).join('')}</section>`;
  },
};
document.addEventListener('click', e => { const b = e.target.closest('[data-act=starteroff]'); if (!b || !window.CARNET) return; C().S().set.starterOff = true; C().save(); C().render(); });

/* ---------- guide de l'app ---------- */
const SLIDES = [
  ['👋', 'Bienvenue dans ton carnet', ['Ton coach de poche pour la muscu, la course et le vélo.', 'Tout marche <b>sans réseau</b> à la salle : ça se synchronise en sortant.', 'Tu choisis tes sports dans Moi → Réglages.']],
  ['🏠', 'Accueil : ta journée', ['« Aujourd\'hui » te dit quoi faire : la séance prévue, une sortie, ou repos.', '« Ta semaine » montre où tu en es, avec la flamme 🔥 des semaines réussies.', 'La cloche 🔔 garde tes records, badges et messages d\'amis.']],
  ['📅', 'Séances : tes programmes', ['<b>Mes modèles</b> : tes séances (exercices, séries, repos), modifiables.', '<b>Calendrier</b> : planifie tes séances, elles apparaissent le jour J.', '<b>✨ Programme personnalisé</b> : réponds à quelques questions, l\'app crée tout.']],
  ['⏱️', 'Le mode salle', ['Lance une séance : un exercice par écran, avec ton GIF en haut.', 'Note les kilos et les répétitions, puis valide ✓ : le chrono de repos démarre et sonne à la fin.', 'L\'app te propose d\'augmenter la charge quand tu progresses.']],
  ['🏃', 'Course et vélo', ['Connecte Strava (si disponible) : tes sorties arrivent toutes seules.', 'Sinon, « + Noter une sortie » : distance et durée suffisent.', 'Chaque sortie a son analyse : allure, records, comparaison.']],
  ['📊', 'Journal : tes progrès', ['<b>Résumé</b> : ta semaine et tes dernières activités.', '<b>Chiffres</b> : graphiques et records par sport.', '<b>Badges</b> et défi du mois pour garder la motivation.']],
  ['👥', 'Amis', ['Ajoute tes proches avec leur pseudo, ou envoie une invitation.', 'Fil d\'activités, ❤️ et commentaires pour s\'encourager.', 'Tu choisis qui voit quoi dans « Mon profil public ». Ton poids et tes photos restent privés.']],
  ['🧰', 'Outils et Moi', ['<b>Outils</b> : charge max, calories, allures, chronos, nutrition.', '<b>Moi</b> : ton poids, tes mensurations, tes photos avant/après, l\'apparence de l\'app.', 'Tu peux revoir ce guide à tout moment dans Moi → Réglages.']],
];
let slide = 0;
VIEWS.guide = () => { const [i, t, L] = SLIDES[slide], last = slide === SLIDES.length - 1;
  return `<div class="guide"><div class="g-top"><span>${slide + 1} / ${SLIDES.length}</span><button class="link" data-gd="end">Passer</button></div>
    <div class="g-ill">${i}</div><h1>${t}</h1><ul>${L.map(x => `<li>${x}</li>`).join('')}</ul>
    <div class="g-dots">${SLIDES.map((_, k) => `<i class="${k === slide ? 'on' : ''}"></i>`).join('')}</div>
    <div class="row">${slide ? '<button class="grow" data-gd="prev">← Précédent</button>' : ''}<button class="p grow" data-gd="${last ? 'end' : 'next'}">${last ? 'C\'est parti 💪' : 'Suivant →'}</button></div></div>`; };
document.addEventListener('click', e => {
  const b = e.target.closest('[data-gd]'); if (!b || !window.CARNET) return; const a = b.dataset.gd;
  if (a === 'next') slide = Math.min(SLIDES.length - 1, slide + 1); else if (a === 'prev') slide = Math.max(0, slide - 1);
  else { slide = 0; C().S().set.guideSeen = true; C().save(); C().go('home'); return; }
  C().render();
});
let tx = null; document.addEventListener('touchstart', e => { if (document.body.dataset.view === 'guide') tx = e.touches[0].clientX; }, { passive: true });
document.addEventListener('touchend', e => { if (tx == null || document.body.dataset.view !== 'guide') return; const dx = e.changedTouches[0].clientX - tx; tx = null; if (Math.abs(dx) > 60) { slide = Math.max(0, Math.min(SLIDES.length - 1, slide + (dx < 0 ? 1 : -1))); C().render(); } }, { passive: true });
}
