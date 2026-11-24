'use strict';
/* Détail d'une activité Strava, façon Strava : carte, temps intermédiaires, graphiques interactifs,
   meilleurs efforts, zones de fréquence cardiaque et d'allure. Données chargées depuis ton serveur
   puis gardées sur l'appareil (consultables hors ligne). */
{
const C = () => window.CARNET;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fr = (n, d = 0) => Number(n).toLocaleString('fr-FR', { maximumFractionDigits: d, minimumFractionDigits: d });
const mmss = s => { s = Math.round(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const hms = s => { s = Math.round(s); return s >= 3600 ? Math.floor(s / 3600) + ':' + String(Math.floor(s % 3600 / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0') : mmss(s); };
// Zones de ton compte Strava (récupérées le 24/11/2026) : modifiables dans S.set.zones
const ZDEF = { hr: [130, 162, 178, 194], pace: [393, 339, 304, 285, 268] };
const HRZ = [['Z1', 'Récupération', '#9ca3af'], ['Z2', 'Endurance', '#60a5fa'], ['Z3', 'Tempo', '#22c55e'], ['Z4', 'Seuil', '#f59e0b'], ['Z5', 'Anaérobie', '#ef4444']];
const PZ = [['Z1', 'Récupération', '#9ca3af'], ['Z2', 'Endurance', '#60a5fa'], ['Z3', 'Tempo', '#22c55e'], ['Z4', 'Seuil', '#f59e0b'], ['Z5', 'VO2 max', '#f97316'], ['Z6', 'Anaérobie', '#ef4444']];
const zones = () => window.PROFILE ? window.PROFILE.zones() : ZDEF;
const mem = new Map();
const CK = id => location.origin + '/__act/' + id;

async function load(id) {
  if (mem.has(id)) return mem.get(id);
  let d = null;
  try { const c = await caches.open('carnet-acts'), r = await c.match(CK(id)); if (r) d = await r.json(); } catch (e) { }
  if (!d && window.SYNC && window.SYNC.on() && navigator.onLine) {
    d = await window.SYNC.get('/strava/act/' + id);
    try { const c = await caches.open('carnet-acts'); await c.put(CK(id), new Response(JSON.stringify(d), { headers: { 'Content-Type': 'application/json' } })); } catch (e) { }
  }
  if (d) mem.set(id, d);
  return d;
}

/* ---------- carte (tuiles OpenStreetMap + tracé) ---------- */
function mapSvg(d) {
  const ll = d.s.ll; if (!ll || ll.length < 2) return '';
  const W = 900, H = 420, pad = 36;
  const px = (lat, lon, z) => { const s = 256 * 2 ** z, r = lat * Math.PI / 180; return [(lon + 180) / 360 * s, (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * s]; };
  const la = ll.map(p => p[0]), lo = ll.map(p => p[1]);
  const bb = [Math.min(...la), Math.max(...la), Math.min(...lo), Math.max(...lo)];
  let z = 17; for (; z > 3; z--) { const a = px(bb[1], bb[2], z), b = px(bb[0], bb[3], z); if (b[0] - a[0] <= W - 2 * pad && b[1] - a[1] <= H - 2 * pad) break; }
  const a = px(bb[1], bb[2], z), b = px(bb[0], bb[3], z), cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2, x0 = cx - W / 2, y0 = cy - H / 2;
  const tiles = []; const n = 2 ** z;
  for (let tx = Math.floor(x0 / 256); tx <= Math.floor((x0 + W) / 256); tx++) for (let ty = Math.floor(y0 / 256); ty <= Math.floor((y0 + H) / 256); ty++) {
    if (ty < 0 || ty >= n) continue; const wx = ((tx % n) + n) % n;
    tiles.push(`<image href="https://tile.openstreetmap.org/${z}/${wx}/${ty}.png" x="${tx * 256 - x0}" y="${ty * 256 - y0}" width="256" height="256"/>`);
  }
  const P = ll.map(p => { const q = px(p[0], p[1], z); return [q[0] - x0, q[1] - y0]; });
  window.__mapPts = P;
  const path = P.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ',' + q[1].toFixed(1)).join('');
  const step = d.run ? 1000 : 10000, marks = []; let next = step;
  if (d.s.d.length === P.length) for (let i = 0; i < P.length; i++) if (d.s.d[i] >= next) { marks.push([P[i], next / 1000]); next += step; }
  return `<div class="amap"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Carte du parcours">
    <rect width="${W}" height="${H}" fill="#e8eaed"/>${tiles.join('')}
    <path d="${path}" fill="none" stroke="#fff" stroke-width="7" stroke-linejoin="round" stroke-linecap="round" opacity=".9"/>
    <path d="${path}" fill="none" stroke="#fc4c02" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
    ${marks.length <= 45 ? marks.map(([q, k]) => `<g transform="translate(${q[0]},${q[1]})"><circle r="9" fill="#fff" stroke="#111" stroke-width="1.5"/><text y="3.5" text-anchor="middle" font-size="10" font-weight="700" fill="#111">${k}</text></g>`).join('') : ''}
    <circle cx="${P[0][0]}" cy="${P[0][1]}" r="8" fill="#16a34a" stroke="#fff" stroke-width="3"/>
    <circle cx="${P.at(-1)[0]}" cy="${P.at(-1)[1]}" r="8" fill="#111" stroke="#fff" stroke-width="3"/>
    <circle id="mapdot" r="8" fill="#fc4c02" stroke="#fff" stroke-width="3" style="display:none"/>
  </svg><small class="osm">© contributeurs OpenStreetMap</small></div>`;
}

/* ---------- graphiques interactifs ---------- */
const CH = {};
const smooth = (a, k = 3) => a.map((v, i) => { if (v == null) return null; let s = 0, n = 0; for (let j = Math.max(0, i - k); j <= Math.min(a.length - 1, i + k); j++) if (a[j] != null) { s += a[j]; n++; } return s / n; });
const pct = (a, p) => { const b = a.filter(x => x != null).sort((x, y) => x - y); return b.length ? b[Math.min(b.length - 1, Math.floor(p * b.length))] : 0; };
function chart(key, d, Y, o) {
  const X = d.s.d.map(x => x / 1000), W = 900, H = o.h || 230, L = 54, R = 14, T = 14, B = 28, w = W - L - R, h = H - T - B;
  let lo = o.lo != null ? o.lo : pct(Y, .02), hi = o.hi != null ? o.hi : pct(Y, .98); if (hi - lo < 1) { hi += 1; lo -= 1; }
  const xmax = X.at(-1) || 1, sx = x => L + x / xmax * w, sy = v => o.invert ? T + (Math.min(Math.max(v, lo), hi) - lo) / (hi - lo) * h : T + h - (Math.min(Math.max(v, lo), hi) - lo) / (hi - lo) * h;
  let path = '', pen = false; Y.forEach((v, i) => { if (v == null) { pen = false; return; } path += (pen ? 'L' : 'M') + sx(X[i]).toFixed(1) + ',' + sy(v).toFixed(1); pen = true; });
  let alt = '';
  if (o.alt && o.alt.length === X.length) { const amin = Math.min(...o.alt), amax = Math.max(...o.alt) + 1, ay = v => T + h - (v - amin) / (amax - amin) * h * .55; alt = `<path d="M${L},${T + h}${o.alt.map((v, i) => 'L' + sx(X[i]).toFixed(1) + ',' + ay(v).toFixed(1)).join('')}L${L + w},${T + h}Z" fill="currentColor" opacity=".09"/>`; }
  const bands = (o.bands || []).map(([a, b, col]) => { const y1 = sy(Math.min(b, hi)), y2 = sy(Math.max(a, lo)); return Math.abs(y2 - y1) > 0.5 && b > lo && a < hi ? `<rect x="${L}" y="${Math.min(y1, y2)}" width="${w}" height="${Math.abs(y2 - y1)}" fill="${col}" opacity=".10"/>` : ''; }).join('');
  const ticks = [0, .25, .5, .75, 1].map(f => lo + (hi - lo) * f);
  const xt = []; const xs = xmax > 30 ? 10 : xmax > 12 ? 2 : 1; for (let k = 0; k <= xmax; k += xs) xt.push(k);
  CH[key] = { X, Y, o, L, w, xmax, sx, sy, d };
  return `<div class="achart" data-ch="${key}"><svg viewBox="0 0 ${W} ${H}">${bands}${alt}
    ${ticks.map(v => `<line x1="${L}" x2="${L + w}" y1="${sy(v)}" y2="${sy(v)}" stroke="currentColor" opacity=".08"/><text x="${L - 8}" y="${sy(v) + 4}" text-anchor="end" font-size="12" fill="currentColor" opacity=".6">${o.fmt(v)}</text>`).join('')}
    ${o.ref != null && o.ref > lo && o.ref < hi ? `<line x1="${L}" x2="${L + w}" y1="${sy(o.ref)}" y2="${sy(o.ref)}" stroke="#16a34a" stroke-width="1.5" stroke-dasharray="5 4"/><text x="${L + w - 4}" y="${sy(o.ref) - 5}" text-anchor="end" font-size="11" fill="#16a34a" font-weight="700">${esc(o.refLbl)}</text>` : ''}
    ${o.avg != null ? `<line x1="${L}" x2="${L + w}" y1="${sy(o.avg)}" y2="${sy(o.avg)}" stroke="${o.color}" stroke-width="1" stroke-dasharray="2 3" opacity=".7"/>` : ''}
    <path d="${path}" fill="none" stroke="${o.color}" stroke-width="2" stroke-linejoin="round"/>
    ${xt.map(k => `<text x="${sx(k)}" y="${H - 8}" text-anchor="middle" font-size="12" fill="currentColor" opacity=".6">${k} km</text>`).join('')}
    <g class="ch-hover" style="display:none"><line class="ch-x" y1="${T}" y2="${T + h}" stroke="currentColor" opacity=".5"/><circle class="ch-dot" r="5" fill="${o.color}" stroke="#fff" stroke-width="2"/></g>
    <rect class="ch-hit" x="${L}" y="${T}" width="${w}" height="${h}" fill="transparent"/></svg><div class="ch-tip" hidden></div></div>`;
}
function bindCharts() {
  for (const el of document.querySelectorAll('.achart')) {
    const c = CH[el.dataset.ch]; if (!c) continue;
    const svg = el.querySelector('svg'), g = svg.querySelector('.ch-hover'), tip = el.querySelector('.ch-tip');
    const move = ev => {
      const p = ev.touches ? ev.touches[0] : ev, r = svg.getBoundingClientRect(), vx = (p.clientX - r.left) / r.width * 900;
      const km = Math.max(0, Math.min(c.xmax, (vx - c.L) / c.w * c.xmax)); let i = 0, best = Infinity; for (let j = 0; j < c.X.length; j++) { const dd = Math.abs(c.X[j] - km); if (dd < best) { best = dd; i = j; } }
      const v = c.Y[i]; g.style.display = ''; g.querySelector('.ch-x').setAttribute('x1', c.sx(c.X[i])); g.querySelector('.ch-x').setAttribute('x2', c.sx(c.X[i]));
      const dot = g.querySelector('.ch-dot'); if (v != null) { dot.style.display = ''; dot.setAttribute('cx', c.sx(c.X[i])); dot.setAttribute('cy', c.sy(v)); } else dot.style.display = 'none';
      const s = c.d.s, t = s.t[i] || 0;
      tip.hidden = false; tip.innerHTML = `<b>${fr(c.X[i], 2)} km</b> · ${hms(t)}<br>${c.o.name} : <b>${v == null ? '—' : c.o.fmt(v)}</b>${s.alt.length ? '<br>Altitude : ' + Math.round(s.alt[i]) + ' m' : ''}${s.hr.length && c.o.name !== 'FC' ? '<br>FC : ' + s.hr[i] + ' bpm' : ''}`;
      const left = (c.sx(c.X[i]) / 900) * r.width; tip.style.left = Math.min(r.width - 150, Math.max(0, left + 12)) + 'px';
      const md = document.getElementById('mapdot'), P = window.__mapPts; if (md && P && P[i]) { md.style.display = ''; md.setAttribute('cx', P[i][0]); md.setAttribute('cy', P[i][1]); }
    };
    const out = () => { g.style.display = 'none'; tip.hidden = true; const md = document.getElementById('mapdot'); if (md) md.style.display = 'none'; };
    svg.addEventListener('mousemove', move); svg.addEventListener('touchmove', move, { passive: true }); svg.addEventListener('touchstart', move, { passive: true });
    svg.addEventListener('mouseleave', out); svg.addEventListener('touchend', () => setTimeout(out, 1500));
  }
}

/* ---------- zones ---------- */
function zoneTimes(d, val, bounds, n) {
  const t = d.s.t, out = Array(n).fill(0);
  for (let i = 1; i < t.length; i++) { const v = val(i); if (v == null) continue; const dt = Math.min(30, t[i] - t[i - 1]); let z = bounds.findIndex(b => v <= b); if (z < 0) z = n - 1; out[z] += dt; }
  return out;
}
function zoneBlock(title, note, Z, times, labels) {
  const tot = times.reduce((a, b) => a + b, 0) || 1, mx = Math.max(...times) || 1;
  return `<section class="tcard"><h2 class="h2s">${title}</h2><div class="hzbars">${Z.map(([k, l, col], i) => `<div class="hzb"><span class="hzk" style="background:${col}">${k}</span><span class="hzl"><b>${l}</b><small>${labels[i]}</small></span><i><b style="width:${times[i] / mx * 100}%;background:${col}"></b></i><em>${Math.round(times[i] / tot * 100)} %<small>${hms(times[i])}</small></em></div>`).join('')}</div><p class="tiny">${note}</p></section>`;
}

/* ---------- page ---------- */
function render(l, d) {
  const run = d.run, Z = zones(), s = d.s;
  const pace = s.v.length ? smooth(s.v.map(v => v > (run ? 1.2 : 2) ? 1000 / v : null), 4) : [];
  const spd = s.v.length ? smooth(s.v.map(v => v > 0.5 ? v * 3.6 : null), 3) : [];
  const avgP = d.moving / (d.dist / 1000), avgV = d.dist / d.moving * 3.6;
  const k = [['Distance', fr(d.dist / 1000, 2) + ' km'], ['Temps de déplacement', hms(d.moving)], run ? ['Allure moy.', mmss(avgP) + ' /km'] : ['Vitesse moy.', fr(avgV, 1) + ' km/h'], ['Dénivelé +', Math.round(d.elev) + ' m'],
    d.hrAvg && ['FC moy.', Math.round(d.hrAvg) + ' bpm'], d.hrMax && ['FC max', Math.round(d.hrMax) + ' bpm'], d.cad && ['Cadence', d.cad + (run ? ' pas/min' : ' tr/min')], !run && d.vMax && ['Vitesse max', fr(d.vMax * 3.6, 1) + ' km/h'], d.watts && ['Puissance moy.', Math.round(d.watts) + ' W'], d.cal && ['Calories', Math.round(d.cal) + ' kcal'], ['Temps écoulé', hms(d.elapsed)]].filter(Boolean);
  // temps intermédiaires
  const sp = d.splits || [], spv = sp.map(x => x.km / x.sec), vmx = Math.max(...spv, 0.0001), fast = spv.indexOf(Math.max(...spv)), slow = spv.indexOf(Math.min(...spv));
  const splitsHtml = sp.length ? `<section class="tcard"><h2 class="h2s">Temps intermédiaires</h2><table class="ksplits"><thead><tr><th>${run ? 'Km' : 'Tronçon'}</th><th>${run ? 'Allure' : 'Vitesse'}</th><th></th><th>Dén.</th>${sp.some(x => x.hr) ? '<th>FC</th>' : ''}</tr></thead><tbody>
    ${sp.map((x, i) => { const v = spv[i]; return `<tr class="${i === fast ? 'fast' : i === slow && sp.length > 2 ? 'slow' : ''}"><td>${run ? (x.km < 0.97 ? fr(x.km, 2) : i + 1) : fr(sp.slice(0, i + 1).reduce((a, y) => a + y.km, 0), 0) + ' km'}</td><td><b>${run ? mmss(x.sec / x.km) : fr(v * 3600, 1)}</b>${run ? ' <small>/km</small>' : ' <small>km/h</small>'}</td><td class="sbar"><i style="width:${Math.max(8, v / vmx * 100)}%"></i></td><td>${x.elev > 0 ? '+' : ''}${x.elev} m</td>${sp.some(y => y.hr) ? `<td>${x.hr || '—'}</td>` : ''}</tr>`; }).join('')}</tbody></table>
    <p class="tiny">${run ? `Plus rapide : km ${fast + 1} en ${mmss(sp[fast].sec / sp[fast].km)}/km. ` : ''}La barre est d'autant plus longue que tu vas vite.${run && sp.length > 3 ? ' ' + splitVerdict(sp) : ''}</p></section>` : '';
  const eff = (d.efforts || []).filter(e => e.sec);
  const effHtml = eff.length ? `<section class="tcard"><h2 class="h2s">Meilleurs efforts</h2><table class="efforts">${eff.map(e => `<tr><td>${esc(e.name.replace('1/2 mile', '½ mile'))}</td><td><b>${hms(e.sec)}</b></td><td class="mute">${mmss(e.sec / (e.dist / 1000))}/km</td><td>${e.pr === 1 ? '<span class="prb gold">🏆 Record</span>' : e.pr === 2 ? '<span class="prb">2ᵉ temps</span>' : e.pr === 3 ? '<span class="prb">3ᵉ temps</span>' : ''}</td></tr>`).join('')}</table><p class="tiny">Calculés par Strava sur cette sortie. « Record » = ton meilleur temps de tous les temps sur la distance.</p></section>` : '';
  const hrT = s.hr.length ? zoneTimes(d, i => s.hr[i], Z.hr, 5) : null;
  const hrL = [`≤ ${Z.hr[0]}`, `${Z.hr[0] + 1}–${Z.hr[1]}`, `${Z.hr[1] + 1}–${Z.hr[2]}`, `${Z.hr[2] + 1}–${Z.hr[3]}`, `> ${Z.hr[3]}`];
  const pT = run && s.v.length && Z.pace ? zoneTimes(d, i => s.v[i] > 1.2 ? -1000 / s.v[i] : null, Z.pace.map(x => -x), 6) : null;
  // pour l'allure, plus petit = plus rapide : on compare sur -allure
  const pL = !Z.pace ? [] : [`> ${mmss(Z.pace[0])}`, `${mmss(Z.pace[1])}–${mmss(Z.pace[0])}`, `${mmss(Z.pace[2])}–${mmss(Z.pace[1])}`, `${mmss(Z.pace[3])}–${mmss(Z.pace[2])}`, `${mmss(Z.pace[4])}–${mmss(Z.pace[3])}`, `< ${mmss(Z.pace[4])}`];
  const charts = `${pace.length ? `<section class="tcard"><div class="between"><h2 class="h2s">${run ? 'Allure' : 'Vitesse'}</h2><small class="mute">Survole le graphique : le point bouge aussi sur la carte</small></div>
      ${run ? chart('pace', d, pace, { name: 'Allure', fmt: v => mmss(v) + '/km', invert: true, color: '#2563eb', alt: s.alt, ref: window.PROFILE.goal(), refLbl: 'objectif ' + window.PROFILE.goalTxt(), avg: avgP, lo: Math.min(pct(pace, .02), (window.PROFILE.goal() || 999) - 15), hi: pct(pace, .97) + 10 }) : chart('spd', d, spd, { name: 'Vitesse', fmt: v => fr(v, 0) + ' km/h', color: '#2563eb', alt: s.alt, avg: avgV, lo: 0 })}
      <p class="tiny">Plus la courbe est haute, plus tu vas vite. Le pointillé bleu, c'est ta moyenne${run && window.PROFILE.goal() ? ', le vert ton objectif' : ''}. Le relief gris, c'est l'altitude.</p></section>` : ''}
    ${s.hr.length ? `<section class="tcard"><h2 class="h2s">Fréquence cardiaque</h2>${chart('hr', d, smooth(s.hr, 2), { name: 'FC', fmt: v => Math.round(v) + ' bpm', color: '#dc2626', avg: d.hrAvg, lo: Math.min(pct(s.hr, .01), Z.hr[0]) - 5, hi: Math.max(pct(s.hr, .995), Z.hr[2]) + 5, bands: [[0, Z.hr[0], HRZ[0][2]], [Z.hr[0], Z.hr[1], HRZ[1][2]], [Z.hr[1], Z.hr[2], HRZ[2][2]], [Z.hr[2], Z.hr[3], HRZ[3][2]], [Z.hr[3], 250, HRZ[4][2]]] })}<p class="tiny">Les bandes de couleur sont tes zones de Z1 (gris) à Z5 (rouge).</p></section>` : ''}
    ${s.alt.length && !pace.length ? `<section class="tcard"><h2 class="h2s">Altitude</h2>${chart('alt', d, s.alt, { name: 'Altitude', fmt: v => Math.round(v) + ' m', color: '#6b7280' })}</section>` : ''}`;
  const zonesHtml = (hrT ? zoneBlock('Zones de fréquence cardiaque', (Z.src === 'strava' ? 'Zones de ton compte Strava, calculées sur ta FC max estimée selon ton âge.' : `Zones calculées sur ta FC max (${window.PROFILE.fcmax()} bpm, modifiable dans Réglages).`) + ' Pour progresser : beaucoup de Z2, un peu de Z4-Z5.', HRZ, hrT, hrL) : '')
    + (pT ? zoneBlock("Zones d'allure", 'Zones de ton compte Strava. Strava les mesure en allure ajustée à la pente, ici c\'est l\'allure réelle.', PZ, pT, pL) : '');
  return `<div class="kpis act">${k.map(([a, b]) => `<div><small>${a}</small><b>${b}</b></div>`).join('')}</div>
    ${mapSvg(d)}
    <div class="actgrid"><div>${splitsHtml}</div><div>${effHtml}${zonesHtml}</div></div>
    ${charts}`;
}
function splitVerdict(sp) {
  const n = sp.filter(x => x.km > .95), h = Math.floor(n.length / 2); if (n.length < 4) return '';
  const p = a => a.reduce((s, x) => s + x.sec, 0) / a.reduce((s, x) => s + x.km, 0), a = p(n.slice(0, h)), b = p(n.slice(h)), dd = Math.round(a - b);
  return dd > 3 ? `Négative split : 2ᵉ moitié plus rapide de ${dd} s/km, bien géré !` : dd < -8 ? `Tu as ralenti de ${-dd} s/km en 2ᵉ moitié : pars un peu moins vite la prochaine fois.` : 'Allure régulière du début à la fin.';
}

window.ACT = {
  shell: l => `<div id="actbox" data-act-id="${esc(String(l.id).replace('strava_', ''))}"><div class="tcard"><p class="small">Chargement des détails depuis Strava…</p></div></div>`,
  async fill() {
    const box = document.getElementById('actbox'); if (!box) return;
    const id = box.dataset.actId, l = C().S().log.find(x => x.id === 'strava_' + id);
    try {
      const d = await load(id); if (!box.isConnected) return;
      if (!d) { box.innerHTML = `<div class="tcard"><p class="small">${window.SYNC && window.SYNC.on() ? 'Détails indisponibles hors connexion. Reviens avec du réseau : ils seront ensuite gardés sur l\'appareil.' : 'Active la synchro et connecte Strava (Moi → Réglages) pour voir la carte, les temps intermédiaires et les zones.'}</p></div>`; return; }
      box.innerHTML = render(l, d); bindCharts();
      if (window.__anaPrompt && d.splits && d.splits.length && !window.__anaPrompt.includes('Temps intermédiaires')) {
        const sp = d.splits.map((x, i) => (d.run ? 'km ' + (i + 1) + ' ' + mmss(x.sec / x.km) : fr(x.km, 0) + ' km à ' + fr(x.km / x.sec * 3600, 1) + ' km/h') + (x.hr ? ' (' + x.hr + ' bpm)' : '') + (x.elev ? ' ' + (x.elev > 0 ? '+' : '') + x.elev + ' m' : '')).join(', ');
        window.__anaPrompt = window.__anaPrompt.replace('\nMes sorties précédentes', `\nTemps intermédiaires : ${sp}.${d.hrMax ? ' FC max ' + d.hrMax + ' bpm.' : ''}${d.cad ? ' Cadence ' + d.cad + '.' : ''} Mes zones FC : Z1 ≤${zones().hr[0]}, Z2 ≤${zones().hr[1]}, Z3 ≤${zones().hr[2]}, Z4 ≤${zones().hr[3]}, Z5 au-delà.\nMes sorties précédentes`);
      }
    } catch (e) { box.innerHTML = `<div class="tcard"><p class="small">Impossible de charger les détails de cette sortie pour l'instant (${esc(e.message)}). Vérifie que Strava est bien connecté dans Moi → Réglages.</p></div>`; }
  },
  load,
};
}
