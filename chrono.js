'use strict';
/* Chronos : For time, AMRAP, EMOM, Tabata, Intervalles (dont tes fractionnés). */
{
const C = () => window.CARNET;
const T2 = window.TOOLS2 = window.TOOLS2 || {};
const fmt = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const MODES = { fortime: ['For time', 'Le plus vite possible, chrono qui monte'], amrap: ['AMRAP', 'Un max de tours en un temps donné'], emom: ['EMOM', 'Un départ chaque minute'], tabata: ['Tabata', '8 × 20 s effort / 10 s récup'], inter: ['Intervalles', 'Effort / récup au choix, pour ton fractionné'] };
const PRESETS = [['6 × 1 000 m', 6, 268, 120], ['3 × 2 km tempo', 3, 565, 120], ['10 × 400 m', 10, 100, 75], ['10 × 30/30', 10, 30, 30], ['8 × 400 m (VMA)', 8, 100, 90]];
const st = { mode: 'inter', amrap: 12, emom: 10, cap: 20, n: 6, w: 268, r: 120, run: false, t0: 0, acc: 0, rounds: 0, phases: [], last: -1, beeped: -1, done: false };
function phases() {
  if (st.mode === 'emom') return Array.from({ length: st.emom }, (_, i) => ({ l: 'Minute ' + (i + 1) + ' / ' + st.emom, d: 60, k: 'w' }));
  if (st.mode === 'tabata') return Array.from({ length: 16 }, (_, i) => i % 2 ? { l: 'Récup · tour ' + (i + 1) / 2 + ' sur 8', d: 10, k: 'r' } : { l: 'Effort · tour ' + (i / 2 + 1) + ' sur 8', d: 20, k: 'w' });
  if (st.mode === 'inter') { const p = []; for (let i = 0; i < st.n; i++) { p.push({ l: 'Effort · ' + (i + 1) + ' sur ' + st.n, d: st.w, k: 'w' }); if (i < st.n - 1 && st.r) p.push({ l: 'Récup · ensuite ' + (i + 2) + ' sur ' + st.n, d: st.r, k: 'r' }); } return p; }
  if (st.mode === 'amrap') return [{ l: 'AMRAP ' + st.amrap + ' min', d: st.amrap * 60, k: 'w' }];
  return [{ l: 'For time · limite ' + st.cap + ' min', d: st.cap * 60, k: 'w', up: true }];
}
const el = () => (Date.now() - st.t0) / 1000 * (st.run ? 1 : 0) + st.acc;
function where(t) { let a = 0; for (let i = 0; i < st.phases.length; i++) { if (t < a + st.phases[i].d) return { i, p: st.phases[i], in: t - a, left: a + st.phases[i].d - t }; a += st.phases[i].d; } return null; }
const total = () => st.phases.reduce((a, p) => a + p.d, 0);
function stepper(k, v, unit, step) { return `<div><div class="tiny">${unit}</div><div class="stepper"><button class="sbtn" data-ch="set" data-k="${k}" data-d="${-step}">−</button><div class="sval">${v}</div><button class="sbtn" data-ch="set" data-k="${k}" data-d="${step}">+</button></div></div>`; }
T2.chrono = () => {
  if (!st.phases.length) st.phases = phases();
  const cfg = st.mode === 'amrap' ? stepper('amrap', st.amrap + ' min', 'Durée', 1) : st.mode === 'emom' ? stepper('emom', st.emom + ' min', 'Minutes', 1) : st.mode === 'fortime' ? stepper('cap', st.cap + ' min', 'Temps limite', 1) : st.mode === 'inter' ? `${stepper('n', st.n, 'Répétitions', 1)}${stepper('w', fmt(st.w), 'Effort', 5)}${stepper('r', fmt(st.r), 'Récup', 5)}` : '';
  return `<p class="lede">Le chrono qui suit ta séance : un ding à chaque changement, trois bips avant la fin de chaque phase.</p>
  <div class="pills" style="margin-bottom:10px">${Object.entries(MODES).map(([k, v]) => `<button class="${st.mode === k ? 'sel' : ''}" data-ch="mode" data-v="${k}">${v[0]}</button>`).join('')}</div>
  <p class="tiny">${MODES[st.mode][1]}</p>
  ${st.mode === 'inter' ? `<div class="pills" style="margin:8px 0">${PRESETS.map((p, i) => `<button data-ch="preset" data-v="${i}">${p[0]}</button>`).join('')}</div>` : ''}
  <div class="chcfg">${cfg}</div>
  <div class="cbig" id="cbig"><svg viewBox="0 0 220 220" class="cring"><circle cx="110" cy="110" r="96" class="cr-bg"/><circle cx="110" cy="110" r="96" class="cr-p" id="crP"/></svg>
    <div class="cr-c"><small id="cLbl">Prêt</small><b class="num" id="cTime">${fmt(st.mode === 'fortime' ? 0 : st.phases[0].d)}</b><span id="cSub">${st.phases.length > 1 ? 'tour 1 sur ' + st.phases.filter(p => p.k === 'w').length : ''}</span></div></div>
  <div class="cdots" id="cDots">${st.phases.filter(p => p.k === 'w').slice(0, 24).map(() => '<i></i>').join('')}</div>
  ${st.mode === 'amrap' || st.mode === 'fortime' ? `<button class="cround" data-ch="round"><b>Tour terminé</b><small id="cRounds">${st.rounds} tour${st.rounds > 1 ? 's' : ''}</small></button>` : ''}
  <div class="row cbtns"><button class="p grow" data-ch="go" id="cGo">${st.run ? 'Pause' : el() > 0 ? 'Reprendre' : 'Départ'}</button><button class="grow" data-ch="reset">Remise à zéro</button></div>
  <p class="tiny">Garde l'app ouverte à l'écran : sur iPhone, le son ne peut pas sonner quand le téléphone est verrouillé.</p>`;
};
function draw() {
  const big = document.getElementById('cbig'); if (!big) return;
  const t = el(), w = where(t), dots = document.querySelectorAll('#cDots i'), wi = st.phases.slice(0, w ? w.i + 1 : st.phases.length).filter(p => p.k === 'w').length;
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  const ring = document.getElementById('crP'), C2 = 2 * Math.PI * 96;
  if (!w) { st.run = false; set('cLbl', 'Terminé'); set('cTime', st.mode === 'fortime' ? fmt(total()) : '0:00'); set('cSub', st.mode === 'amrap' ? st.rounds + ' tours' : 'Bravo !'); ring.style.strokeDashoffset = 0; big.className = 'cbig end'; dots.forEach(d => d.className = 'on'); set('cGo', 'Départ'); if (!st.done) { st.done = true; C().ding(); setTimeout(() => C().ding(), 450); } return; }
  const up = w.p.up, frac = w.in / w.p.d;
  set('cLbl', st.run || t > 0 ? w.p.l : 'Prêt'); set('cTime', fmt(up ? w.in : w.left)); set('cSub', st.mode === 'amrap' || st.mode === 'fortime' ? (st.rounds + ' tour' + (st.rounds > 1 ? 's' : '')) : 'tour ' + Math.max(1, wi) + ' sur ' + st.phases.filter(p => p.k === 'w').length);
  ring.style.strokeDasharray = C2; ring.style.strokeDashoffset = up ? C2 * (1 - frac) : C2 * frac;
  big.className = 'cbig ' + (w.p.k === 'r' ? 'rest' : 'work') + (st.run ? ' running' : '');
  dots.forEach((d, i) => d.className = i < wi - 1 ? 'on' : i === wi - 1 ? 'cur' : '');
  if (st.run) {
    if (w.i !== st.last) { if (st.last >= 0) C().ding(); st.last = w.i; }
    const s = Math.ceil(w.left); if (!up && s <= 3 && s >= 1 && st.beeped !== w.i * 10 + s) { st.beeped = w.i * 10 + s; C().blip(); }
  }
}
setInterval(() => { if (document.getElementById('cbig') && (st.run || st.done)) draw(); }, 200);
document.addEventListener('click', e => {
  const b = e.target.closest('[data-ch]'); if (!b || !window.CARNET) return; const v = b.dataset.v;
  switch (b.dataset.ch) {
    case 'mode': if (st.run) return; st.mode = v; break;
    case 'preset': { const p = PRESETS[+v]; st.n = p[1]; st.w = p[2]; st.r = p[3]; break; }
    case 'set': { if (st.run) return; const k = b.dataset.k, d = +b.dataset.d, lim = { amrap: [1, 60], emom: [1, 60], cap: [1, 90], n: [1, 30], w: [5, 1800], r: [0, 600] }[k]; st[k] = Math.min(lim[1], Math.max(lim[0], st[k] + d)); break; }
    case 'go': C().unlockAudio(); if (st.run) { st.acc = el(); st.run = false; } else { if (st.done) { st.acc = 0; st.rounds = 0; st.done = false; st.last = -1; } st.t0 = Date.now(); st.run = true; C().wakeOn && C().wakeOn(); } b.textContent = st.run ? 'Pause' : 'Reprendre'; draw(); return;
    case 'reset': st.run = false; st.acc = 0; st.rounds = 0; st.last = -1; st.done = false; break;
    case 'round': if (st.run) { st.rounds++; const r = document.getElementById('cRounds'); if (r) r.textContent = st.rounds + ' tour' + (st.rounds > 1 ? 's' : ''); C().blip(); draw(); } return;
    default: return;
  }
  if (!st.run) { st.phases = phases(); st.acc = b.dataset.ch === 'reset' || b.dataset.ch === 'mode' || b.dataset.ch === 'set' || b.dataset.ch === 'preset' ? 0 : st.acc; }
  C().render(); draw();
});
window.AFTER = window.AFTER || {}; const prevAfter = window.AFTER.tools; window.AFTER.tools = () => { prevAfter && prevAfter(); draw(); };
}
