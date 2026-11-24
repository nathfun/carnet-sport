'use strict';
/* Mes séances : calendrier semaine / mois, séances planifiées, fiche de séance. */
{
const C = () => window.CARNET;
const VIEWS = window.VIEWS = window.VIEWS || {}, AFTER = window.AFTER = window.AFTER || {};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DAY = 864e5, DN = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'], DL = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MOM = { matin: 'Matin', midi: 'Midi', apm: 'Après-midi', soir: 'Soir' };
const KIND = { muscu: 'Musculation', run: 'Course à pied', bike: 'Vélo' };
const day0 = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const iso = t => { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const mon = t => { const d = new Date(day0(t)); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
const addD = (t, n) => { const d = new Date(t); d.setDate(d.getDate() + n); return day0(d.getTime()); };
const fDay = t => new Date(t).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
let sub = 'cal', mode = 'semaine', wk = mon(Date.now()), monthT = day0(Date.now()), sel = null; // sel = {date, pid} | {date, lid}

function plans() { const S = C().S(); S.plans = S.plans || []; return S.plans; }
function plansOn(t) {
  const d = new Date(t).getDay(), key = iso(t);
  return plans().filter(p => p.repeat === 'week' ? (p.days || []).includes(d) && t >= day0(p.from || 0) && !(p.skip || []).includes(key) : p.date === key).sort((a, b) => Object.keys(MOM).indexOf(a.moment) - Object.keys(MOM).indexOf(b.moment));
}
const logsOn = t => C().S().log.filter(l => day0(l.start) === day0(t));
const tpl = id => C().S().program.find(p => p.id === id);
const planName = p => p.kind === 'muscu' ? (tpl(p.sid)?.name || 'Séance supprimée') : (p.name || KIND[p.kind]);
function estimate(s) { let sec = 0, sets = 0; for (const e of s.ex) { sets += +e.sets || 0; sec += (+e.sets || 0) * (45 + (+e.rest || 60)); } return { sets, min: Math.round(sec / 60) }; }
const isDone = (p, t) => logsOn(t).some(l => p.kind === 'muscu' ? l.sid === p.sid : l.kind === p.kind);

function thumb(e) { const m = C().metaOf(e.id); return `<div class="exthumb" data-thumb="${esc(e.id)}">${window.bodySvg(m.m || 'Pecs', { one: true })}</div>`; }
function detail(t) {
  if (!sel) return '';
  if (sel.lid) {
    const l = C().S().log.find(x => x.id === sel.lid); if (!l) return '';
    return `<div class="sdetail"><div class="tiny">${fDay(l.start)} · faite</div><h2>${esc(l.name)}</h2>
      <div class="chipsrow" style="margin:8px 0"><span class="okchip">Faite</span>${l.ex ? `<span class="chip2">${l.ex.length} exercices</span><span class="chip2">${Math.round(l.vol || 0)} kg soulevés</span>` : ''}${l.km ? `<span class="chip2">${l.km} km</span>` : ''}${l.feel ? `<span class="chip2">Ressenti : ${esc(l.feel)}</span>` : ''}</div>
      ${(l.ex || []).map(e => `<div class="small"><b>${esc(e.n)}</b> · ${e.sets.map(s => s.kg + '×' + s.r).join(' · ')}</div>`).join('')}
      <div class="row" style="margin-top:12px">${l.sid ? `<button class="grow" data-pl="redo" data-v="${esc(l.sid)}">Refaire</button>` : ''}<button class="grow" data-pl="journal">Voir dans le journal</button></div></div>`;
  }
  const p = plans().find(x => x.id === sel.pid); if (!p) return '';
  const date = sel.date, done = isDone(p, date), today = day0(Date.now()) === date, past = date < day0(Date.now());
  const head = `<div class="tiny">${fDay(date)}${p.repeat === 'week' ? ' · chaque ' + p.days.map(d => DN[d].toLowerCase()).join(', ') : ''}</div>
    <div class="row" style="gap:6px;margin:6px 0"><span class="momtag">${MOM[p.moment] || ''}</span><span class="chip2">${KIND[p.kind]}</span>${done ? '<span class="okchip">Faite</span>' : ''}</div>`;
  if (p.kind !== 'muscu') {
    return `<div class="sdetail">${head}<h2>${esc(planName(p))}</h2><p class="small mute">${esc(p.note || (p.kind === 'run' ? 'Ta séance de course de la semaine.' : 'Ta sortie vélo de la semaine.'))} Le suivi se fait dans Strava.</p>
      <div class="row" style="margin-top:10px"><a class="btn grow" href="https://www.strava.com/dashboard" target="_blank" rel="noopener">Ouvrir Strava</a>${done ? '' : `<button class="grow" data-pl="donecardio" data-v="${p.id}">Marquer comme faite</button>`}</div>
      <div class="row" style="margin-top:8px">${p.repeat === 'week' ? `<button class="sm ghost" data-pl="skip" data-v="${p.id}">Pas cette fois</button>` : ''}<button class="sm ghost" data-pl="delplan" data-v="${p.id}">Retirer de l'agenda</button></div></div>`;
  }
  const s = tpl(p.sid); if (!s) return '';
  const est = estimate(s), si = C().S().program.indexOf(s);
  return `<div class="sdetail">${head}<h2>${esc(s.name)}</h2>
    <div class="chipsrow" style="margin:8px 0"><span class="chip2">${s.ex.length} exercices</span><span class="chip2">${est.sets} séries</span><span class="chip2">≈ ${est.min} min</span></div>
    <div class="exstrip">${s.ex.map(e => { const l = C().lastSets(e.id); return `<div class="excard">${thumb(e)}<b>${esc(e.n)}</b><small>${e.sets} × ${esc(e.reps)} · ${e.rest} s</small>${l ? `<span class="okchip">${l.at(-1).kg} kg</span>` : ''}</div>`; }).join('') || '<p class="tiny">Aucun exercice pour le moment.</p>'}</div>
    <div class="row" style="margin-top:10px"><button class="grow" data-pl="addex" data-v="${si}">+ Exercice</button><button class="grow" data-pl="edit">Modifier</button></div>
    ${C().S().draft ? `<button class="p wide" style="margin-top:10px" data-act="goto" data-v="workout">Reprendre la séance en cours</button>` : done ? '' : `<div class="slide" data-slide="${esc(s.id)}"><div class="slide-knob" aria-hidden="true">▶</div><span>Glisser pour commencer</span></div><button class="sr-only-btn" data-act="start" data-sid="${esc(s.id)}">Commencer la séance</button>`}
    ${!done && (today || past) ? `<p class="tiny" style="text-align:center;margin-top:8px">Séance déjà faite ? <button class="link" data-pl="logit" data-v="${esc(s.id)}" data-d="${date}">La noter</button></p>` : ''}
    <div class="row" style="margin-top:8px">${p.repeat === 'week' ? `<button class="sm ghost" data-pl="skip" data-v="${p.id}">Pas cette fois</button>` : ''}<button class="sm ghost" data-pl="delplan" data-v="${p.id}">Retirer de l'agenda</button></div></div>`;
}
function dayBlock(t, compact) {
  const ps = plansOn(t), ls = logsOn(t), today = day0(Date.now()) === t;
  const items = ls.map(l => `<button class="ditem done ${sel && sel.lid === l.id ? 'sel' : ''}" data-pl="sellog" data-v="${l.id}" data-d="${t}"><span class="okchip">Faite</span><b>${esc(l.name)}</b><small>${l.ex ? l.ex.length + ' exos · ' + Math.round(l.vol || 0) + ' kg' : (l.km ? l.km + ' km' : '')}</small></button>`)
    .concat(ps.filter(p => !isDone(p, t)).map(p => { const s = p.kind === 'muscu' && tpl(p.sid); return `<button class="ditem k-${p.kind} ${sel && sel.pid === p.id && sel.date === t ? 'sel' : ''}" data-pl="selplan" data-v="${p.id}" data-d="${t}"><span class="momtag">${MOM[p.moment] || ''}</span><b>${esc(planName(p))}</b><small>${s ? s.ex.length + ' exercices · ≈ ' + estimate(s).min + ' min' : KIND[p.kind]}</small></button>`; }));
  return `<div class="dayrow ${today ? 'today' : ''}"><div class="dlabel"><small>${DN[new Date(t).getDay()]}</small><b>${new Date(t).getDate()}</b></div><div class="ditems">${items.join('') || '<span class="rest">Repos</span>'}<button class="addday" data-pl="new" data-d="${t}">+ Ajouter</button></div></div>`;
}
function vWeek() {
  const days = Array.from({ length: 7 }, (_, i) => addD(wk, i)), end = days[6];
  return `<div class="wnav"><button class="sm" data-pl="wprev" aria-label="Semaine précédente">‹</button><div><b>${new Date(wk).getDate()} ${new Date(wk).toLocaleDateString('fr-FR', { month: 'short' })} – ${new Date(end).getDate()} ${new Date(end).toLocaleDateString('fr-FR', { month: 'short' })}</b>${wk !== mon(Date.now()) ? '<button class="link" data-pl="wnow">Revenir à cette semaine</button>' : ''}</div><button class="sm" data-pl="wnext" aria-label="Semaine suivante">›</button></div>
  <div class="week">${days.map(t => dayBlock(t)).join('')}</div>`;
}
function vMonth() {
  const m = new Date(monthT); m.setDate(1); const first = m.getTime(), start = mon(first), y = m.getFullYear(), mo = m.getMonth();
  const cells = Array.from({ length: 42 }, (_, i) => addD(start, i)).filter((t, i) => i < 35 || new Date(addD(start, 35)).getMonth() === mo);
  const selD = sel ? sel.date : day0(Date.now());
  return `<div class="wnav"><button class="sm" data-pl="mprev" aria-label="Mois précédent">‹</button><b>${m.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</b><button class="sm" data-pl="mnext" aria-label="Mois suivant">›</button></div>
  <div class="mgrid">${DL.map(d => `<small>${d}</small>`).join('')}${cells.map(t => { const ls = logsOn(t), ps = plansOn(t).filter(p => !isDone(p, t)), out = new Date(t).getMonth() !== mo, today = day0(Date.now()) === t; return `<button class="mday ${out ? 'out' : ''} ${today ? 'today' : ''} ${ls.length ? 'done' : ''} ${ps.length && !ls.length ? 'plan' : ''} ${t === selD ? 'sel' : ''}" data-pl="mday" data-d="${t}">${new Date(t).getDate()}${ls.length ? '<i>✓</i>' : ''}</button>`; }).join('')}</div>
  <div class="mlegend"><span><i class="lg-done"></i>faite</span><span><i class="lg-plan"></i>prévue</span><span><i class="lg-today"></i>aujourd'hui</span></div>
  <div class="sec">${fDay(selD)}</div>${dayBlock(selD)}`;
}
VIEWS.seances = () => {
  const tabs = `<div class="kicker">Entraînement</div><div class="between"><h1>Mes séances</h1><button class="p sm" data-pl="new" data-d="${day0(Date.now())}">+ Séance</button></div><div class="seg" style="margin:12px 0">${[['cal', 'Calendrier'], ['modeles', 'Mes modèles'], ['exos', 'Exercices']].map(([k, l]) => `<button class="${sub === k ? 'sel' : ''}" data-pl="sub" data-v="${k}">${l}</button>`).join('')}</div>`;
  if (sub === 'modeles') return tabs + VIEWS.models();
  if (sub === 'exos') { setTimeout(() => window.AFTER.lib && window.AFTER.lib(), 0); return tabs + window.VIEWS.lib(); }
  return tabs + seg2() + (mode === 'semaine' ? vWeek() : vMonth()) + `<div id="sdet">${detail()}</div>`;
};
const seg2 = () => `<div class="seg mini2" style="margin-bottom:10px">${[['semaine', 'Semaine'], ['mois', 'Mois']].map(([k, l]) => `<button class="${mode === k ? 'sel' : ''}" data-pl="mode" data-v="${k}">${l}</button>`).join('')}</div>`;
VIEWS.seancesSub = k => { sub = k; };
AFTER.program = () => { if (sel) { const el = document.getElementById('sdet'); if (el && el.firstElementChild && window.innerWidth < 900 && pendingScroll) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } } pendingScroll = false; bindSlides(); };
let pendingScroll = false;

/* glisser pour commencer */
function bindSlides() {
  for (const sl of document.querySelectorAll('.slide')) {
    const knob = sl.querySelector('.slide-knob'); let x0 = null, dx = 0;
    const max = () => sl.clientWidth - knob.offsetWidth - 8;
    const move = x => { dx = Math.max(0, Math.min(max(), x - x0)); knob.style.transform = `translateX(${dx}px)`; sl.style.setProperty('--p', dx / max()); };
    const end = () => { if (x0 === null) return; x0 = null; knob.style.transition = 'transform .25s'; if (dx > max() * .8) { knob.style.transform = `translateX(${max()}px)`; setTimeout(() => C().start(sl.dataset.slide), 120); } else { knob.style.transform = ''; sl.style.setProperty('--p', 0); } };
    sl.addEventListener('pointerdown', e => { x0 = e.clientX - dx; knob.style.transition = 'none'; sl.setPointerCapture(e.pointerId); });
    sl.addEventListener('pointermove', e => { if (x0 !== null) move(e.clientX); });
    sl.addEventListener('pointerup', end); sl.addEventListener('pointercancel', end);
    sl.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') C().start(sl.dataset.slide); });
    sl.tabIndex = 0; sl.setAttribute('role', 'button'); sl.setAttribute('aria-label', 'Commencer la séance');
  }
}

/* nouvelle séance */
function newSheet(t, fromId) {
  const S = C().S(), d = new Date(+t).getDay();
  window.__np = { kind: 'muscu', days: [d], repeat: 'once', moment: 'apm', date: +t, from: '' };
  C().sheet(`<h2>Nouvelle séance</h2><div class="tiny" style="margin-top:6px">Quel genre de séance ?</div>
    <div class="kinds">${Object.entries(KIND).map(([k, l]) => `<button class="${k === 'muscu' ? 'sel' : ''}" data-np="kind" data-v="${k}"><b>${l}</b><small>${k === 'muscu' ? 'Exercices, séries, charges, repos' : 'Suivie dans Strava'}</small></button>`).join('')}</div>
    <div id="npmuscu"><label class="lbl">Partir de<select id="npfrom"><option value="">Une nouvelle séance vide</option>${S.program.map(p => `<option value="${esc(p.id)}" ${p.id === fromId ? 'selected' : ''}>${esc(p.name)} (${p.ex.length} exos)</option>`).join('')}</select></label></div>
    <label class="lbl">Nom (facultatif)<input id="npname" placeholder="Ex. Musculation · lundi après-midi"></label>
    <div class="tiny" style="margin-top:12px">Jours</div><div class="dpick">${[1, 2, 3, 4, 5, 6, 0].map((x, i) => `<button class="${x === d ? 'sel' : ''}" data-np="day" data-v="${x}">${DL[i]}</button>`).join('')}</div>
    <div class="tiny" style="margin-top:12px">Répéter cette séance ?</div>
    <div class="rep2"><button class="sel" data-np="rep" data-v="once"><b>Une seule fois</b><small>${new Date(+t).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}</small></button><button data-np="rep" data-v="week"><b>Chaque semaine</b><small>Les jours choisis</small></button></div>
    <div class="tiny" style="margin-top:12px">Moment</div><div class="pills">${Object.entries(MOM).map(([k, l]) => `<button class="${k === 'apm' ? 'sel' : ''}" data-np="mom" data-v="${k}">${l}</button>`).join('')}</div>
    <button class="p wide" style="margin-top:16px" data-pl="create">+ Créer la séance</button><button class="ghost wide" style="margin-top:8px" data-close>Fermer</button>`);
}
function onePerDay() { return; }

document.addEventListener('click', e => {
  const b = e.target.closest('[data-pl],[data-np]'); if (!b || !window.CARNET) return;
  const S = C().S(), v = b.dataset.v, d = +b.dataset.d;
  if (b.dataset.np) {
    const np = window.__np, grp = b.parentElement;
    if (b.dataset.np === 'kind') { np.kind = v; $('#npmuscu').hidden = v !== 'muscu'; }
    if (b.dataset.np === 'day') { const x = +v; np.days = np.days.includes(x) ? np.days.filter(y => y !== x) : [...np.days, x]; b.classList.toggle('sel'); return; }
    if (b.dataset.np === 'rep') np.repeat = v;
    if (b.dataset.np === 'mom') np.moment = v;
    for (const x of grp.children) x.classList.toggle('sel', x === b); return;
  }
  switch (b.dataset.pl) {
    case 'sub': sub = v; break;
    case 'mode': mode = v; break;
    case 'wprev': wk = addD(wk, -7); break;
    case 'wnext': wk = addD(wk, 7); break;
    case 'wnow': wk = mon(Date.now()); break;
    case 'mprev': { const m = new Date(monthT); m.setMonth(m.getMonth() - 1); monthT = m.getTime(); break; }
    case 'mnext': { const m = new Date(monthT); m.setMonth(m.getMonth() + 1); monthT = m.getTime(); break; }
    case 'mday': { const ps = plansOn(d).filter(p => !isDone(p, d)), ls = logsOn(d); sel = ps[0] ? { date: d, pid: ps[0].id } : ls[0] ? { date: d, lid: ls[0].id } : { date: d }; break; }
    case 'selplan': sel = { date: d, pid: v }; pendingScroll = true; break;
    case 'sellog': sel = { date: d, lid: v }; pendingScroll = true; break;
    case 'new': newSheet(d || day0(Date.now())); return;
    case 'create': {
      const np = window.__np, name = $('#npname').value.trim();
      if (np.repeat === 'week' && !np.days.length) { C().toast('Choisis au moins un jour'); return; }
      let sid = '';
      if (np.kind === 'muscu') {
        const from = $('#npfrom').value;
        if (from && !name) sid = from;
        else { const base = from ? JSON.parse(JSON.stringify(tpl(from))) : { ex: [] }; sid = 's_' + Date.now().toString(36); S.program.push({ ...base, id: sid, name: name || (from ? base.name + ' (copie)' : 'Musculation · ' + MOM[np.moment].toLowerCase()), sub: base.sub || '', kind: '' }); }
      }
      let date = np.date; if (np.repeat === 'once' && np.days.length && !np.days.includes(new Date(date).getDay())) { for (let k = 0; k < 7; k++) { const t = addD(date, k); if (np.days.includes(new Date(t).getDay())) { date = t; break; } } }
      const p = { id: 'p_' + Date.now().toString(36), kind: np.kind, sid, name: np.kind !== 'muscu' ? (name || KIND[np.kind]) : '', days: np.days, repeat: np.repeat, date: iso(date), moment: np.moment, from: day0(np.repeat === 'week' ? Date.now() : date) };
      plans().push(p); sel = { date, pid: p.id }; pendingScroll = true; if (mode === 'semaine') wk = mon(date); else monthT = date;
      C().closeSheet(); C().toast('Séance ajoutée à ton agenda'); break;
    }
    case 'skip': { const p = plans().find(x => x.id === v); p.skip = [...(p.skip || []), iso(sel.date)]; sel = null; C().toast('Séance retirée pour ce jour'); break; }
    case 'delplan': { const p = plans().find(x => x.id === v); if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = p.repeat === 'week' ? 'Toucher encore : retirer toutes les semaines' : 'Toucher encore pour retirer'; return; } S.plans = plans().filter(x => x.id !== v); sel = null; break; }
    case 'addex': C().addExSheet('program', +v); return;
    case 'edit': sub = 'modeles'; { const pp = plans().find(x => x.id === (sel && sel.pid)); if (pp) VIEWS.modelsOpen(pp.sid); } break;
    case 'redo': C().start(v); return;
    case 'journal': C().go('progress'); return;
    case 'logit': C().start(v, { date: d }); return;
    case 'donecardio': { const p = plans().find(x => x.id === v); const t = sel.date + 18 * 36e5; S.log.push({ id: 'c_' + Date.now().toString(36), kind: p.kind, name: planName(p), start: t, end: t + 3600e3, ex: [], vol: 0 }); C().toast('Notée. Les détails restent dans Strava.'); break; }
    default: return;
  }
  C().save(); C().render();
});
const $ = s => document.querySelector(s);
VIEWS.planNew = sid => newSheet(day0(Date.now()), sid);
VIEWS.nextPlanned = () => { for (let k = 0; k < 14; k++) { const t = addD(day0(Date.now()), k), ps = plansOn(t).filter(p => !isDone(p, t)); if (ps.length) return { label: (k === 0 ? "Aujourd'hui" : k === 1 ? 'Demain' : fDay(t)) + ' · ' + (MOM[ps[0].moment] || '').toLowerCase(), name: planName(ps[0]) }; } return null; };
VIEWS.plansAll = t => plansOn(day0(t));
VIEWS.plansOn = t => { t = day0(t); return plansOn(t).filter(p => !isDone(p, t)).map(p => planName(p)); };
VIEWS.plannedToday = () => { const t = day0(Date.now()); return plansOn(t).filter(p => !isDone(p, t)); };
VIEWS.selectPlan = (pid, date) => { sel = { date, pid }; sub = 'cal'; };
}
