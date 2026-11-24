'use strict';
/* Outils : charge max, calories, allures. Utilise le pont window.CARNET exposé par app.js. */
{
const C = () => window.CARNET;
const VIEWS = window.VIEWS = window.VIEWS || {}, AFTER = window.AFTER = window.AFTER || {};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fr = (v, d = 0) => Number(v).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
const fk = v => fr(v, Math.round(v * 10) % 10 ? 1 : 0);
const half = v => Math.round(v * 2) / 2, q25 = v => Math.round(v / 2.5) * 2.5;
const mmss = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
const parseT = t => { const p = String(t || '').trim().split(':').map(Number); if (!p.length || p.some(isNaN)) return 0; return p.reduce((a, b) => a * 60 + b, 0); };

/* ---------- animations : on dessine l'ancienne valeur puis on glisse vers la nouvelle ---------- */
const prev = new Map(), pend = [];
const reduce = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
// compteur animé
const cu = (key, val, dec = 0, suffix = '') => { const p = prev.has(key) ? prev.get(key) : 0; pend.push({ t: 'cu', key, val, dec }); return `<span data-cu="${key}" data-suf="${esc(suffix)}">${fr(p, dec)}${suffix}</span>`; };
// largeur / hauteur animées (en %)
const aw = (key, val, prop = 'width') => { const p = prev.has(key) ? prev.get(key) : 0; pend.push({ t: 'st', key, val, prop }); return `data-st="${key}" style="${prop}:${p}%"`; };
function runAnims() {
  const jobs = pend.splice(0);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    for (const j of jobs) {
      if (j.t === 'st') { const el = document.querySelector(`[data-st="${j.key}"]`); if (el) el.style[j.prop] = j.val + '%'; prev.set(j.key, j.val); }
      else if (j.t === 'dash') { const el = document.querySelector(`[data-dash="${j.key}"]`); if (el) { el.style.strokeDasharray = `${j.len} ${j.circ}`; el.style.strokeDashoffset = j.off; } prev.set(j.key, [j.len, j.off]); }
      else if (j.t === 'cu') {
        const el = document.querySelector(`[data-cu="${j.key}"]`), from = prev.has(j.key) ? prev.get(j.key) : 0; prev.set(j.key, j.val); if (!el) continue;
        const suf = el.dataset.suf || '';
        if (reduce() || from === j.val) { el.textContent = fr(j.val, j.dec) + suf; continue; }
        const t0 = performance.now(), D = 650;
        const step = now => { const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3); el.textContent = fr(from + (j.val - from) * e, j.dec) + suf; if (k < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      }
    }
  }));
}
// anneau (donut) : segments [{v, color, key}]
function donut(segs, size, stroke, center) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r, tot = segs.reduce((a, s) => a + s.v, 0) || 1, gap = segs.length > 1 ? 3 : 0;
  let acc = 0;
  const arcs = segs.map(s => {
    const len = Math.max(0, s.v / tot * circ - gap), off = -acc; acc += s.v / tot * circ;
    const p = prev.get(s.key) || [0, off]; pend.push({ t: 'dash', key: s.key, len, off, circ });
    return `<circle data-dash="${s.key}" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${stroke}" stroke-linecap="butt" style="stroke-dasharray:${p[0]} ${circ};stroke-dashoffset:${p[1]}" transform="rotate(-90 ${size / 2} ${size / 2})"/>`;
  }).join('');
  return `<div class="donut" style="width:${size}px;height:${size}px"><svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--track)" stroke-width="${stroke}"/>${arcs}</svg><div class="donut-c">${center}</div></div>`;
}
const stepper = (act, label, unit, big = true) => `<div class="stepper ${big ? 'big' : ''}"><button class="sbtn" data-t="${act}" data-d="-1" aria-label="Moins">−</button><div class="sval">${label}<small>${unit}</small></div><button class="sbtn" data-t="${act}" data-d="1" aria-label="Plus">+</button></div>`;
const seg = (act, cur, opts) => `<div class="seg">${opts.map(([k, l]) => `<button class="${String(cur) === String(k) ? 'sel' : ''}" data-t="${act}" data-v="${esc(k)}">${l}</button>`).join('')}</div>`;

/* ---------- état des outils ---------- */
function T() {
  const S = C().S(); S.tools = S.tools || {};
  const b = C().body();
  S.tools.cm = { w: 100, r: 5, ex: '', ...S.tools.cm };
  S.tools.cal = { sex: 'h', neat: 'moments', sess: 6, min: 75, int: 'moy', goal: 'maintien', meals: 3, bf: '', ...S.tools.cal };
  S.tools.al = { unit: 'km', pace: 300, seuil: 270, dist: '10', target: 2700, pdist: 10, ptime: '50:58', vma: 14, ...S.tools.al };
  return { ...S.tools, b };
}
let toolSub = 'cm';

/* ================= CHARGE MAX ================= */
const FORM = { Brzycki: (w, r) => w * 36 / (37 - r), Epley: (w, r) => r === 1 ? w : w * (1 + r / 30), Lombardi: (w, r) => w * Math.pow(r, 0.1), "O'Connor": (w, r) => w * (1 + 0.025 * r) };
const LOADS = [[95, 2, 'f'], [90, 3, 'f'], [85, 6, 'f'], [80, 8, 'h'], [75, 10, 'h'], [70, 12, 'h'], [65, 16, 'e'], [60, 20, 'e'], [55, 22, 'e'], [50, 25, 'e']];
const ZN = { f: ['Force', 'z-f'], h: ['Hypertrophie', 'z-h'], e: ['Endurance', 'z-e'] };
const PLATES = [[25, '#d7263d', 100], [20, '#2f5bea', 92], [15, '#f0b429', 82], [10, '#1f9d55', 72], [5, '#f4f4f4', 58], [2.5, '#c0392b', 46], [1.25, '#9aa0a6', 38]];
function barbell(total) {
  let side = Math.max(0, (total - 20) / 2); const used = [];
  for (const [kg, col, h] of PLATES) while (side >= kg - 1e-6) { used.push([kg, col, h]); side -= kg; }
  const W = 300, H = 120, cx = W / 2; let x = 0, pl = '';
  const draw = (dir) => { x = 0; return used.map(([kg, col, h]) => { const w = kg >= 10 ? 13 : kg >= 2.5 ? 9 : 7; const px = dir > 0 ? cx + 70 + x : cx - 70 - x - w; x += w + 2; return `<rect x="${px}" y="${H / 2 - h / 2 * .9}" width="${w}" height="${h * .9}" rx="2.5" fill="${col}" stroke="rgba(0,0,0,.18)"/>`; }).join(''); };
  pl = draw(1) + draw(-1);
  return { svg: `<svg viewBox="0 0 ${W} ${H}" class="barbell" role="img" aria-label="Barre chargée à ${fr(total, 1)} kg"><rect x="8" y="${H / 2 - 3}" width="${W - 16}" height="6" rx="3" fill="#8b9099"/><rect x="${cx - 74}" y="${H / 2 - 9}" width="6" height="18" rx="2" fill="#6b7078"/><rect x="${cx + 68}" y="${H / 2 - 9}" width="6" height="18" rx="2" fill="#6b7078"/>${pl}</svg>`, used: used.map(u => u[0]) };
}
function vCharge() {
  const t = T(), cm = t.cm, REC = C().REC(), recs = [...REC.values()].sort((a, b) => a.n.localeCompare(b.n, 'fr'));
  const vals = Object.fromEntries(Object.entries(FORM).map(([k, f]) => [k, half(f(cm.w, cm.r))]));
  const e1 = vals.Epley, lo = Math.min(...Object.values(vals)), hi = Math.max(...Object.values(vals));
  const bb = barbell(q25(Math.ceil(e1 / 2.5) * 2.5)), tot = Math.ceil(e1 / 2.5) * 2.5;
  const fmax = Math.max(...Object.values(vals));
  const warm = [[40, 8], [55, 5], [70, 3], [80, 1]].map(([p, r]) => [p, q25(e1 * p / 100), r]);
  return `<p class="lede">Une charge, un nombre de répétitions : ton 1RM estimé et tes charges pour la force, la masse ou l'endurance.</p>
  ${recs.length ? `<label class="lbl">Partir d'un de mes records<select data-t="cmex"><option value="">Saisie libre</option>${recs.map(R => `<option value="${esc(R.id)}" ${cm.ex === R.id ? 'selected' : ''}>${esc(R.n)} · ${fr(R.kg, 1)} kg × ${R.r || 1}</option>`).join('')}</select></label>` : ''}
  <div class="tool-grid">
    <div class="tcard">
      <div class="eyebrow">Charge soulevée</div>${stepper('cmw', fr(cm.w, cm.w % 1 ? 1 : 0), ' kg')}
      <div class="eyebrow" style="margin-top:14px">Répétitions faites</div>
      <div class="chips12">${Array.from({ length: 12 }, (_, i) => `<button class="${cm.r === i + 1 ? 'sel' : ''}" data-t="cmr" data-v="${i + 1}">${i + 1}</button>`).join('')}</div>
      <div class="eyebrow" style="margin-top:14px">Ton 1RM sur la barre</div>
      <div class="barbox">${bb.svg}<p class="tiny">Pour ${fr(tot, 1)} kg : barre de 20 kg + ${bb.used.map(p => fr(p, p % 1 ? 2 : 0).replace(',00', '')).join(', ') || 'rien'} de chaque côté</p></div>
    </div>
    <div class="tcard hero-cm">
      <div class="eyebrow dot">Ton 1RM estimé</div>
      <div class="bignum">${cu('cm-e1', e1, e1 % 1 ? 1 : 1)}<small>kg</small></div>
      <p class="small">Tu pourrais soulever environ ${fr(e1, 1)} kg une seule fois. Les 4 formules donnent ${fr(lo, 1)} à ${fr(hi, 1)} kg :</p>
      ${Object.entries(vals).map(([k, v], i) => `<div class="fbar ${k === 'Epley' ? 'on' : ''}"><span>${k}</span><div><i ${aw('cm-f' + i, v / fmax * 100)}></i></div><b>${fr(v, 1)}</b></div>`).join('')}
    </div>
  </div>
  <h2 class="h2t">Tes charges de travail</h2><p class="sub2">D'après ton 1RM de ${fr(e1, 1)} kg : la charge à mettre et le nombre de répétitions possibles.</p>
  <div class="loads">${LOADS.map(([p, r, z], i) => `<div class="lrow"><b>${p} %</b><div class="lbar ${ZN[z][1]}"><i ${aw('cm-l' + i, p)}></i></div><span class="kg">${fr(half(e1 * p / 100), half(e1 * p / 100) % 1 ? 1 : 0)} kg</span><span class="xr">× ${r}</span><span class="ztag ${ZN[z][1]}">${ZN[z][0]}</span></div>`).join('')}</div>
  <h2 class="h2t">Selon ton objectif</h2>
  <div class="goal3">
    <div class="gcard z-f"><small>Plus fort sur une répétition</small><b>Force</b><div class="gnum">${fk(half(e1 * .85))}–${fk(half(e1 * .95))} kg</div><p>85 à 95 % · 1 à 6 rép. · repos 3 à 5 min</p></div>
    <div class="gcard z-h"><small>Plus de muscle</small><b>Hypertrophie</b><div class="gnum">${fk(half(e1 * .7))}–${fk(half(e1 * .8))} kg</div><p>70 à 80 % · 8 à 12 rép. · repos 1 min 30 à 2 min</p></div>
    <div class="gcard z-e"><small>Tenir plus longtemps</small><b>Endurance</b><div class="gnum">${fk(half(e1 * .5))}–${fk(half(e1 * .65))} kg</div><p>50 à 65 % · 15 à 25 rép. · repos 30 à 60 s</p></div>
  </div>
  <h2 class="h2t">Ton échauffement</h2><p class="sub2">Avant ta série de travail : quatre paliers, sans te fatiguer.</p>
  <div class="stairs">${warm.map(([p, kg, r], i) => `<div class="stair"><div class="sfill" ${aw('cm-w' + i, 38 + i * 12, 'height')}><small>${p} %</small><b>${fr(kg, kg % 1 ? 1 : 0)}</b><small>× ${r}</small></div></div>`).join('')}<div class="stair"><div class="sfill top" ${aw('cm-w4', 100, 'height')}><small>Série</small><b>${fr(cm.w, cm.w % 1 ? 1 : 0)}</b><small>× ${cm.r}${cm.r < 12 ? ' à ' + (cm.r + 1) : ''}</small></div></div></div>
  <p class="tiny" style="margin-top:12px">Sur machine guidée, prends la plaque la plus proche de la charge indiquée.</p>`;
}

/* ================= CALORIES ================= */
const NEAT = { assis: [.15, 'Assis'], moments: [.3, 'Debout par moments'], souvent: [.45, 'Debout souvent'], actif: [.6, 'Très actif'] };
const MET = { leg: [4, 'Légère'], moy: [6, 'Moyenne'], int: [8, 'Intense'] };
const GOAL = { perte: [-.2, 'Perdre du poids', '−20 %'], maintien: [0, 'Maintien', '±0 %'], prise: [.1, 'Prise de masse', '+10 %'] };
const MEALS = {
  1: [['Repas', '12 h – 14 h', 100, 0]], 2: [['Déjeuner', '12 h – 14 h', 45, 0], ['Dîner', '19 h 30 – 21 h', 55, 0]],
  3: [['Petit-déjeuner', '7 h – 9 h', 25, 0], ['Déjeuner', '12 h – 14 h', 40, 0], ['Dîner', '19 h 30 – 21 h', 35, 0]],
  4: [['Petit-déjeuner', '7 h – 9 h', 25, 0], ['Déjeuner', '12 h – 14 h', 35, 0], ['Goûter', '16 h – 17 h', 10, 1], ['Dîner', '19 h 30 – 21 h', 30, 0]],
  5: [['Petit-déjeuner', '7 h – 9 h', 20, 0], ['Collation', '10 h – 11 h', 10, 1], ['Déjeuner', '12 h – 14 h', 30, 0], ['Goûter', '16 h – 17 h', 10, 1], ['Dîner', '19 h 30 – 21 h', 30, 0]],
  6: [['Petit-déjeuner', '7 h – 9 h', 20, 0], ['Collation', '10 h – 11 h', 8, 1], ['Déjeuner', '12 h – 14 h', 28, 0], ['Goûter', '16 h – 17 h', 8, 1], ['Dîner', '19 h 30 – 21 h', 28, 0], ['Collation du soir', '22 h', 8, 1]],
  7: [['Petit-déjeuner', '7 h – 9 h', 18, 0], ['Collation', '10 h – 11 h', 8, 1], ['Déjeuner', '12 h – 14 h', 26, 0], ['Goûter', '16 h – 17 h', 8, 1], ['Après la séance', '18 h – 19 h', 8, 1], ['Dîner', '19 h 30 – 21 h', 24, 0], ['Collation du soir', '22 h', 8, 1]]
};
const MCOL = ['#ff8a3d', '#2f6bff', '#8b5cf6', '#10b981', '#f43f5e', '#f5b400', '#06b6d4'];
function calCalc(c, b) {
  const w = b.w, lbm = c.bf ? w * (1 - c.bf / 100) : 0;
  const bmr = lbm ? 370 + 21.6 * lbm : 10 * w + 6.25 * b.h - 5 * b.age + (c.sex === 'h' ? 5 : -161);
  const neat = bmr * NEAT[c.neat][0], sport = c.sess * c.min / 60 * MET[c.int][0] * w / 7, tdee = bmr + neat + sport;
  const g = k => Math.round(tdee * (1 + GOAL[k][0]));
  const kcal = g(c.goal), p = Math.round(1.8 * w), f = Math.round(0.8 * w), carb = Math.max(0, Math.round((kcal - p * 4 - f * 9) / 4));
  return { bmr, neat, sport, tdee, kcal, p, f, carb, goals: { perte: g('perte'), maintien: g('maintien'), prise: g('prise') } };
}
function vCalories() {
  const t = T(), c = t.cal, b = t.b, r = calCalc(c, b), diff = r.kcal - r.tdee;
  const scale = Math.max(r.tdee, r.kcal) * 1.08, pct = v => v / scale * 100;
  const wkKg = Math.abs(diff) * 7 / 7700;
  const goalTxt = c.goal === 'maintien' ? `Ta dépense est de ${fr(r.tdee)} kcal par jour : manger autant garde ton poids stable. Avec assez de protéines et la muscu, c'est la recomposition.` : `Ta dépense est de ${fr(r.tdee)} kcal par jour ; ${diff < 0 ? '−20 %' : '+10 %'}, soit environ ${fr(wkKg, 2)} kg ${diff < 0 ? 'perdu' : 'pris'} par semaine.`;
  const meals = MEALS[c.meals], tw = meals.reduce((a, m) => a + m[2], 0), snacks = meals.filter(m => m[3]), mains = meals.filter(m => !m[3]);
  const pSnack = Math.round(r.p * .1), pMain = Math.round((r.p - pSnack * snacks.length) / mains.length);
  const mrows = meals.map((m, i) => { const k = Math.round(r.kcal * m[2] / tw), pp = m[3] ? pSnack : pMain, rest = Math.max(0, k - pp * 4), share = rest / Math.max(1, r.f * 9 + r.carb * 4); return { n: m[0], h: m[1], k, pct: Math.round(m[2] / tw * 100), p: pp, f: Math.round(r.f * 9 * share / 9), g: Math.round(r.carb * 4 * share / 4), col: MCOL[i] }; });
  const bmrLbl = c.bf ? 'formule de Katch-McArdle, avec ta masse grasse' : 'formule de Mifflin-St Jeor';
  return `<p class="lede">Ta dépense de chaque jour, au repos et en bougeant, puis tes calories et tes macros pour perdre du poids, le maintenir ou prendre de la masse.</p>
  <div class="tool-grid">
    <div class="tcard">
      <div class="eyebrow">Tu es</div>${seg('csex', c.sex, [['h', 'Un homme'], ['f', 'Une femme']])}
      <div class="eyebrow" style="margin-top:14px">Âge, taille, poids <span class="mute">(depuis Mon corps)</span></div>
      <div class="trio3"><div class="mini"><b>${b.age}</b><small>ans</small></div><div class="mini"><b>${fr(b.h)}</b><small>cm</small></div><div class="mini"><b>${fr(b.w, b.w % 1 ? 1 : 0)}</b><small>kg</small></div></div>
      <button class="link" data-t="gome">Modifier dans Mon corps</button>
      <label class="lbl">Masse grasse (facultatif)<div class="unit"><input inputmode="decimal" data-tin="bf" value="${esc(c.bf)}" placeholder="—"><span>%</span></div></label>
      <div class="eyebrow" style="margin-top:14px">Au quotidien</div>
      <div class="pills">${Object.entries(NEAT).map(([k, v]) => `<button class="${c.neat === k ? 'sel' : ''}" data-t="cneat" data-v="${k}">${v[1]}</button>`).join('')}</div>
      <div class="eyebrow" style="margin-top:14px">Sport</div>
      <div class="duo"><div><div class="tiny">Séances par semaine</div>${stepper('csess', c.sess, '', false)}</div><div><div class="tiny">Minutes par séance</div>${stepper('cmin', c.min, '', false)}</div></div>
      ${seg('cint', c.int, Object.entries(MET).map(([k, v]) => [k, v[1]]))}
      <div class="eyebrow" style="margin-top:14px">Objectif</div>
      ${seg('cgoal', c.goal, Object.entries(GOAL).map(([k, v]) => [k, `${v[1]}<small>${v[2]}</small>`]))}
    </div>
    <div class="tcard hero-cal">
      <div class="eyebrow dot">${GOAL[c.goal][1]}</div>
      <div class="bignum">${cu('cal-k', r.kcal)}</div><div class="unit-l">kcal / jour</div>
      <p class="small">${goalTxt}</p>
      <div class="gauge-h"><span>Objectif</span></div>
      <div class="gauge"><i class="g1" ${aw('cal-g1', pct(r.bmr))}></i><i class="g2" ${aw('cal-g2', pct(r.neat))}></i><i class="g3" ${aw('cal-g3', pct(r.sport))}></i><em ${aw('cal-gm', pct(r.kcal), 'left')}></em></div>
      <div class="legend"><span><i class="g1"></i>Au repos ${fr(r.bmr)}</span><span><i class="g2"></i>Journée ${fr(r.neat)}</span><span><i class="g3"></i>Sport ${fr(r.sport)}</span></div>
      <div class="macro">${donut([{ v: r.p * 4, color: '#2f6bff', key: 'cal-dp' }, { v: r.f * 9, color: '#f5b400', key: 'cal-df' }, { v: r.carb * 4, color: '#10b981', key: 'cal-dc' }], 132, 16, `<b>${cu('cal-dk', r.kcal)}</b><small>kcal</small>`)}
        <ul><li><i style="background:#2f6bff"></i><b>${cu('cal-p', r.p)} g</b> protéines</li><li><i style="background:#f5b400"></i><b>${cu('cal-f', r.f)} g</b> lipides</li><li><i style="background:#10b981"></i><b>${cu('cal-c', r.carb)} g</b> glucides</li><li><i style="background:#a78bfa"></i><b>30 à 40 g</b> fibres</li></ul></div>
    </div>
  </div>
  <h2 class="h2t">Ta dépense, poste par poste</h2><p class="sub2">Les trois parts de tes ${fr(r.tdee)} kcal de chaque jour, avant l'objectif.</p>
  <div class="goal3">
    <div class="pcard"><div class="ptag g1">Au repos</div><b>Métabolisme de base</b><div class="gnum">${fr(r.bmr)} <small>kcal</small><em>${Math.round(r.bmr / r.tdee * 100)} %</em></div><p>Ce que ton corps dépense sans bouger : respirer, garder 37 °C, faire battre le cœur. Calculé avec la ${bmrLbl}.</p></div>
    <div class="pcard"><div class="ptag g2">Journée</div><b>Activité hors sport</b><div class="gnum">${fr(r.neat)} <small>kcal</small><em>${Math.round(r.neat / r.tdee * 100)} %</em></div><p>Marcher, monter les escaliers, aller en cours. Réglage « ${NEAT[c.neat][1]} » : ${Math.round(NEAT[c.neat][0] * 100)} % du métabolisme de base en plus.</p></div>
    <div class="pcard"><div class="ptag g3">Sport</div><b>Tes séances</b><div class="gnum">${fr(r.sport)} <small>kcal</small><em>${Math.round(r.sport / r.tdee * 100)} %</em></div><p>${c.sess} séances de ${c.min} min par semaine, intensité ${MET[c.int][1].toLowerCase()}, ramenées à un jour.</p></div>
  </div>
  <h2 class="h2t">Choisis ton objectif</h2>
  <div class="goal3">${Object.entries(GOAL).map(([k, v]) => `<button class="ocard ${c.goal === k ? 'sel' : ''}" data-t="cgoal" data-v="${k}"><small>${v[1]}</small><b>${fr(r.goals[k])}</b><span>kcal / jour</span><p>${k === 'maintien' ? 'Dépense du jour · poids stable' : `${v[2]} · ≈ ${k === 'perte' ? '−' : '+'}${fr(Math.abs(r.goals[k] - r.tdee) * 7 / 7700, 2)} kg / semaine`}</p></button>`).join('')}</div>
  <h2 class="h2t">Tes repas</h2>
  <div class="tiny">Répartis en (de 1 à 7 par jour)</div><div style="max-width:260px">${stepper('cmeals', c.meals, ' repas', false)}</div>
  <div class="meals">${donut(mrows.map((m, i) => ({ v: m.k, color: m.col, key: 'cal-m' + i + '-' + c.meals })), 190, 26, `<b>${fr(r.kcal)}</b><small>kcal par jour<br>en ${c.meals} repas</small>`)}
    <div class="mlist">${mrows.map(m => `<div class="mrow"><i style="background:${m.col}"></i><div><small class="mh">${m.h}</small><b>${m.n}</b><p><span class="dp">${m.p} g prot.</span><span class="df">${m.f} g lip.</span><span class="dc">${m.g} g gluc.</span></p></div><div class="mk"><b>${fr(m.k)}</b><small>${m.pct} %</small></div></div>`).join('')}</div></div>
  <p class="tiny">Les repas principaux reçoivent la même quantité de protéines ; les collations et le goûter en reçoivent 10 % chacun. Estimation à ±10 % : pèse-toi 3 matins par semaine et ajuste de 150 kcal si ta moyenne bouge trop.</p>`;
}

/* ================= ALLURES ================= */
const DISTS = { '5': [5, '5 km'], '10': [10, '10 km'], semi: [21.0975, 'Semi'], marathon: [42.195, 'Marathon'] };
const ZONES = [['Z1', 'Récupération', 'Footing très léger, après une séance dure.', .5, .6, 1.30, '#6b7280'], ['Z2', 'Endurance fondamentale', 'La zone reine : 70 à 80 % de ton volume.', .6, .7, 1.18, '#10b981'], ['Z3', 'Aérobie', 'Allure marathon, phrases courtes.', .7, .8, 1.08, '#d4a017'], ['Z4', 'Seuil', 'Allure 10 km rapide, séances tempo.', .8, .9, 1.0, '#ea580c'], ['Z5', 'VMA', 'Fractionné court, quelques minutes au total.', .9, 1, .92, '#dc2626']];
function vAllures() {
  const t = T(), a = t.al, b = t.b, mi = a.unit === 'mile', U = mi ? 1.609344 : 1, ul = mi ? '/mi' : '/km';
  const pace = a.pace, spd = 3600 / pace, show = s => mmss(s * U);
  const times = Object.entries(DISTS).map(([k, [d, l]]) => ({ k, l, s: pace * d })), main = times.find(x => x.k === '10');
  const fc = 220 - b.age, seuil = a.seuil;
  const [td, tl] = DISTS[a.dist], tpace = a.target / td;
  const marks = a.dist === 'marathon' ? [5, 10, 15, 20, 25, 30, 35, 40, 42.195] : a.dist === 'semi' ? [1, 2, 3, 4, 5, 10, 15, 20, 21.0975] : a.dist === '5' ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const big = new Set(a.dist === '10' ? [5, 10] : a.dist === '5' ? [5] : [10, 21.0975, 42.195]);
  const pd = Math.max(0.4, Number(a.pdist) || 10), ps = parseT(a.ptime) || 3058;
  const pred = Object.entries(DISTS).map(([k, [d, l]]) => ({ k, l, d, s: ps * Math.pow(d / pd, 1.06) }));
  const vma = a.vma, kmh = v => v, rows = [240, 270, 300, 330, 360, 390, 420]; if (!rows.includes(Math.round(pace / 5) * 5)) rows.push(Math.round(pace / 5) * 5); rows.sort((x, y) => x - y);
  const marks2 = [['6:00 · débutant', 360], ['5:00 · 10 km en 50 min', 300], ...(window.PROFILE && window.PROFILE.goal() ? [[window.PROFILE.goalTxt() + ' · ton objectif', window.PROFILE.goal()]] : []), ['4:16 · marathon en 3 h', 256]];
  const maxT = times.at(-1).s;
  return `<p class="lede">Allure ou vitesse : tape l'une, l'autre suit. Tes temps sur 5 km, 10 km, semi et marathon, et tes zones d'entraînement.</p>
  <div class="tool-grid">
    <div class="tcard">
      <div class="eyebrow">Unité</div>${seg('aunit', a.unit, [['km', 'km'], ['mile', 'mile']])}
      <div class="eyebrow" style="margin-top:14px">Allure</div>${stepper('apace', show(pace), ' ' + ul)}
      <div class="swap" aria-hidden="true">⇅</div>
      <div class="eyebrow">Vitesse</div>${stepper('aspd', fr(spd / U, 1), mi ? ' mph' : ' km/h')}
      <div class="eyebrow" style="margin-top:14px">Repères</div>
      <div class="pills">${marks2.map(([l, p]) => `<button class="${pace === p ? 'sel' : ''}" data-t="apreset" data-v="${p}">${l}</button>`).join('')}</div>
      <p class="hint">Sur tapis : règle la vitesse, l'allure suit. Mets 1 % de pente pour retrouver l'effort de la course dehors.</p>
    </div>
    <div class="tcard hero-al">
      <div class="eyebrow dot">À ${show(pace)} ${ul}, soit ${fr(spd, 1)} km/h</div>
      <div class="bignum mono">${mmss(main.s)}<small class="on10">sur 10 km</small></div>
      <p class="small">${mmss(pace * 1.609344)} au mile. Tiens cette allure : voici tes temps d'arrivée.</p>
      ${times.map((x, i) => `<div class="tbar"><span>${x.l}</span><div><i ${aw('al-t' + i, Math.max(6, x.s / maxT * 100))}></i></div><b>${mmss(x.s)}</b></div>`).join('')}
      <div class="ticks">${Array.from({ length: 18 }, (_, i) => `<i class="${i / 17 <= (420 - pace) / 180 ? 'on' : ''}"></i>`).join('')}</div>
    </div>
  </div>
  <h2 class="h2t">Tes zones d'entraînement</h2><p class="sub2">D'après ton âge (fréquence cardiaque max estimée : <b>${fc} bpm</b>) et ton allure seuil, celle que tu tiens environ une heure à fond.</p>
  <div class="duo"><div><div class="tiny">Âge</div>${stepper('aage', b.age, ' ans', false)}</div><div><div class="tiny">Allure seuil</div>${stepper('aseuil', show(seuil), '', false)}</div></div>
  <div class="zones">${ZONES.map(([z, n, d, lo, hi, k, col], i) => `<div class="zrow" style="--zc:${col}"><span class="zb">${z}</span><div class="zt"><b>${n}</b><small>${d}</small></div><div class="zfill" ${aw('al-z' + i, 40 + i * 12)}></div><span class="bpm">${Math.round(fc * lo)}–${Math.round(fc * hi)} <small>bpm</small></span><span class="zp">${show(seuil * k)} <small>${ul}</small></span></div>`).join('')}</div>
  <h2 class="h2t">Viser un temps</h2><p class="sub2">Choisis la distance et le temps visé : voici l'allure à tenir, et tes temps de passage.</p>
  ${seg('adist', a.dist, Object.entries(DISTS).map(([k, v]) => [k, v[1]]))}<div style="margin-top:8px">${stepper('atarget', mmss(a.target), ' visé', true)}</div>
  <div class="target"><div class="tbig"><small>Allure à tenir</small><b>${show(tpace)}</b><span>${ul} · ${fr(3600 / tpace, 1)} km/h</span></div>
    <div class="splits">${marks.map(k => `<div class="${big.has(k) ? 'hl' : ''}"><small>${k === 21.0975 ? 'Semi' : k === 42.195 ? 'Arrivée' : fr(k, k % 1 ? 1 : 0) + ' km'}</small><b>${mmss(tpace * k)}</b></div>`).join('')}</div></div>
  <h2 class="h2t">Prédire mes temps</h2><p class="sub2">D'après une course que tu as faite (formule de Riegel, valable si tu es entraîné pour la distance). Par défaut : ton record 10 km Strava.</p>
  <div class="row" style="gap:8px;align-items:end"><label class="lbl" style="width:110px">Distance<div class="unit"><input inputmode="decimal" data-tin="pdist" value="${esc(a.pdist)}"><span>km</span></div></label>
    <div class="pills">${Object.entries(DISTS).map(([k, [d, l]]) => `<button class="${Math.abs(pd - d) < .01 ? 'sel' : ''}" data-t="apd" data-v="${d}">${l}</button>`).join('')}</div>
    <label class="lbl" style="width:130px">Ton temps<input data-tin="ptime" value="${esc(a.ptime)}" placeholder="h:mm:ss"></label></div>
  <div class="pred">${pred.map(x => `<div class="${Math.abs(x.d - pd) < .01 ? 'hl' : ''}">${Math.abs(x.d - pd) < .01 ? '<em>ta course</em>' : ''}<small>${x.l}</small><b>${mmss(x.s)}</b><span>${mmss(x.s / x.d)} /km</span></div>`).join('')}</div>
  <h2 class="h2t">Mon fractionné</h2><p class="sub2">Ta VMA (vitesse maximale aérobie) : les allures de tes séances de fractionné. Pas de VMA ? Fais le <b>test de 6 minutes</b> : cours le plus loin possible pendant 6 minutes ; la distance en km × 10 donne ta VMA.</p>
  ${stepper('avma', fr(vma, 1), ' km/h de VMA', false)}
  <div class="goal3">
    <div class="gcard z-f"><small>Court · 100 % VMA</small><b>10 × 30 s / 30 s</b><div class="gnum">${Math.round(vma * 1000 / 3600 * 30)} m en 30 s</div><p>Récup 30 s en trottinant.</p></div>
    <div class="gcard z-h"><small>Moyen · 95 % VMA</small><b>8 × 400 m</b><div class="gnum">${mmss(400 / (vma * .95 / 3.6))} le 400 m</div><p>Récup 1 min 30.</p></div>
    <div class="gcard z-e"><small>Long · 90 % VMA</small><b>5 × 1 000 m</b><div class="gnum">${mmss(1000 / (vma * .9 / 3.6))} le 1 000 m</div><p>Récup 2 min.</p></div>
  </div>
  <h2 class="h2t">Tableau des allures</h2>
  <div class="scroll"><table class="ptable"><thead><tr><th>/km</th><th>km/h</th><th>5 km</th><th>10 km</th><th>Semi</th><th>Marathon</th></tr></thead><tbody>${rows.map(p => `<tr class="${p === Math.round(pace / 5) * 5 ? 'hl' : ''}"><td>${mmss(p)}</td><td>${fr(3600 / p, 1)}</td><td>${mmss(p * 5)}</td><td>${mmss(p * 10)}</td><td>${mmss(p * 21.0975)}</td><td>${mmss(p * 42.195)}</td></tr>`).join('')}</tbody></table></div>`;
}

/* ================= vue Outils ================= */
VIEWS.tools = () => {
  const tabs = [['cm', 'Charge max'], ['cal', 'Calories'], ['al', 'Allures'], ['chrono', 'Chronos'], ['nutri', 'Nutrition'], ['coach', 'Coach']];
  const X = window.TOOLS2 || {};
  const body = toolSub === 'cm' ? vCharge() : toolSub === 'cal' ? vCalories() : toolSub === 'al' ? vAllures() : toolSub === 'chrono' ? X.chrono() : toolSub === 'nutri' ? X.nutri() : C().coach();
  const titles = { cm: 'Charge max', cal: 'Calories', al: 'Allures', chrono: 'Chronos', nutri: 'Nutrition', coach: 'Coach' };
  return `<div class="tool t-${toolSub}"><div class="kicker">Outils</div><h1>${titles[toolSub]}</h1><div class="seg tabs4 scrollseg" style="margin:14px 0">${tabs.map(([k, l]) => `<button class="${toolSub === k ? 'sel' : ''}" data-t="tsub" data-v="${k}">${l}</button>`).join('')}</div>${body}</div>`;
};
AFTER.tools = runAnims;
VIEWS.toolsGoto = k => { toolSub = k; };

/* ---------- événements des outils ---------- */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-t]'); if (!btn || !window.CARNET) return;
  const S = C().S(); T(); const cm = S.tools.cm, c = S.tools.cal, a = S.tools.al, d = +btn.dataset.d || 0, v = btn.dataset.v;
  switch (btn.dataset.t) {
    case 'tsub': toolSub = v; C().render(); window.scrollTo(0, 0); return;
    case 'cmw': cm.w = clamp(cm.w + d * 2.5, 2.5, 500); cm.ex = ''; break;
    case 'cmr': cm.r = +v; cm.ex = ''; break;
    case 'csex': c.sex = v; break;
    case 'cneat': c.neat = v; break;
    case 'csess': c.sess = clamp(c.sess + d, 0, 14); break;
    case 'cmin': c.min = clamp(c.min + d * 5, 10, 240); break;
    case 'cint': c.int = v; break;
    case 'cgoal': c.goal = v; break;
    case 'cmeals': c.meals = clamp(c.meals + d, 1, 7); break;
    case 'gome': C().go('me'); return;
    case 'aunit': a.unit = v; break;
    case 'apace': a.pace = clamp(a.pace + d * 5, 150, 600); break;
    case 'aspd': { const s = clamp(Math.round((3600 / a.pace + d * .1) * 10) / 10, 6, 24); a.pace = Math.round(3600 / s); break; }
    case 'apreset': a.pace = +v; break;
    case 'aage': { const B = S.body; const age = clamp(C().body().age + d, 10, 90); B.birth = new Date().getFullYear() - age; break; }
    case 'aseuil': a.seuil = clamp(a.seuil + d * 5, 150, 600); break;
    case 'adist': { a.dist = v; const dft = { '5': 1350, '10': 2700, semi: 6300, marathon: 14400 }; a.target = dft[v]; break; }
    case 'atarget': { const st = { '5': 15, '10': 30, semi: 60, marathon: 120 }[a.dist]; a.target = clamp(a.target + d * st, 600, 30000); break; }
    case 'apd': a.pdist = +v; break;
    case 'avma': a.vma = clamp(Math.round((a.vma + d * .5) * 10) / 10, 8, 25); break;
    default: return;
  }
  C().save(); C().render();
});
document.addEventListener('change', e => {
  const t = e.target; if (!window.CARNET) return;
  if (t.dataset.t === 'cmex') { const S = C().S(), R = C().REC().get(t.value); S.tools.cm.ex = t.value; if (R) { S.tools.cm.w = R.kg; S.tools.cm.r = Math.min(12, Math.max(1, R.r || 1)); } C().save(); C().render(); }
  else if (t.dataset.tin) { const S = C().S(), k = t.dataset.tin; if (k === 'bf') S.tools.cal.bf = Math.min(60, Math.max(0, parseFloat(String(t.value).replace(',', '.')) || 0)) || ''; else if (k === 'pdist') S.tools.al.pdist = parseFloat(String(t.value).replace(',', '.')) || 10; else if (k === 'ptime') S.tools.al.ptime = t.value.trim(); C().save(); C().render(); }
});
}
window.calSummary = () => { try { const S = window.CARNET.S(); const c = { sex: 'h', neat: 'moments', sess: 6, min: 75, int: 'moy', goal: 'maintien', meals: 3, bf: '', ...(S.tools && S.tools.cal) }; const b = window.CARNET.body(); const w = b.w, bmr = 10 * w + 6.25 * b.h - 5 * b.age + (c.sex === 'h' ? 5 : -161), nf = { assis: .15, moments: .3, souvent: .45, actif: .6 }[c.neat], met = { leg: 4, moy: 6, int: 8 }[c.int], tdee = bmr * (1 + nf) + c.sess * c.min / 60 * met * w / 7, g = { perte: -.2, maintien: 0, prise: .1 }[c.goal]; return { kcal: Math.round(tdee * (1 + g)), p: Math.round(1.8 * w) }; } catch (e) { return { kcal: 0, p: 0 }; } };
