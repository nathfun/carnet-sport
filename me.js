'use strict';
/* Onglet Moi : mon corps, apparence, réglages. */
{
const C = () => window.CARNET;
const VIEWS = window.VIEWS = window.VIEWS || {}, AFTER = window.AFTER = window.AFTER || {};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fr = (v, d = 0) => Number(v).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
const dFr = t => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
let meSub = 'corps', range = 'mois';
const MEAS = [['bras', 'Tour de bras'], ['taille', 'Tour de taille'], ['cuisses', 'Tour de cuisses'], ['poitrine', 'Tour de poitrine']];
const THEMES = [['chrono', 'Le Chrono', 'Clair, net, graphique'], ['aurore', "L'Aurore", 'Dégradés rose et violet'], ['terre', 'La Salle', 'Blanc et rouge, noir en mode sombre'], ['profondeurs', 'Les Profondeurs', 'Sombre, profond, calme']];

function weightChart(ws) {
  const now = Date.now(), from = range === 'mois' ? now - 31 * 864e5 : range === 'annee' ? now - 366 * 864e5 : 0;
  const pts = ws.filter(w => w.t >= from);
  if (pts.length < 2) return `<div class="wchart empty">${pts.length ? 'Encore une pesée pour voir la courbe' : 'Pas de pesée sur cette période'}</div>`;
  const W = 600, H = 190, px = 30, py = 22, t0 = pts[0].t, t1 = pts.at(-1).t, mn = Math.min(...pts.map(p => p.kg)) - .4, mx = Math.max(...pts.map(p => p.kg)) + .4;
  const x = t => px + (t1 === t0 ? .5 : (t - t0) / (t1 - t0)) * (W - 2 * px), y = v => H - py - (v - mn) / (mx - mn) * (H - 2 * py);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + x(p.t).toFixed(1) + ',' + y(p.kg).toFixed(1)).join('');
  const area = d + `L${x(t1).toFixed(1)},${H - py}L${x(t0).toFixed(1)},${H - py}Z`;
  const last = pts.at(-1);
  return `<svg class="wchart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Courbe de poids"><defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--acc)" stop-opacity=".25"/><stop offset="1" stop-color="var(--acc)" stop-opacity="0"/></linearGradient></defs>
    ${[0, .5, 1].map(k => `<line x1="${px}" x2="${W - px}" y1="${py + k * (H - 2 * py)}" y2="${py + k * (H - 2 * py)}" stroke="currentColor" opacity=".08"/>`).join('')}
    <path d="${area}" fill="url(#wg)"/><path class="draw" d="${d}" fill="none" stroke="var(--acc)" stroke-width="3" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
    ${pts.map(p => `<circle cx="${x(p.t)}" cy="${y(p.kg)}" r="4" fill="var(--card)" stroke="var(--acc)" stroke-width="2" vector-effect="non-scaling-stroke"/>`).join('')}
    <text x="${px}" y="14" font-size="13" fill="currentColor" opacity=".55">${fr(mx - .4, 1)} kg</text><text x="${px}" y="${H - 4}" font-size="13" fill="currentColor" opacity=".55">${fr(mn + .4, 1)} kg</text></svg>
    <p class="tiny">Dernière pesée : ${fr(last.kg, 1)} kg le ${dFr(last.t)}</p>`;
}
function vCorps() {
  const S = C().S(), B = C().body(), ws = [...(S.body.weights || [])].sort((a, b) => a.t - b.t), last = ws.at(-1);
  const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0);
  const firstM = ws.find(w => w.t >= month.getTime()), first = ws[0];
  const delta = (a, b) => a && b && a !== b ? `${b.kg - a.kg >= 0 ? '+' : '−'}${fr(Math.abs(b.kg - a.kg), 1)} kg` : '';
  const ms = S.body.meas || [], lastM = k => { for (let i = ms.length - 1; i >= 0; i--) if (ms[i][k]) return ms[i]; return null; };
  const imc = last ? last.kg / Math.pow(B.h / 100, 2) : 0;
  return `<p class="sub2">Tout reste sur ton téléphone. Ton poids sert au calcul des calories et des records en « × ton poids ».</p><button class="p wide" data-m="newmeas">+ Nouvelle mesure</button>
  <div class="corps-grid">
    <div class="tcard"><div class="eyebrow">Poids</div>
      ${last ? `<div class="bignum">${fr(last.kg, 1)}<small>kg</small></div><p class="tiny">Pesée du ${dFr(last.t)}</p>
      <div class="chipsrow">${firstM && firstM !== last ? `<span class="okchip">${delta(firstM, last)} depuis le 1er ${month.toLocaleDateString('fr-FR', { month: 'long' })}</span>` : ''}${first && first !== last ? `<span class="chip2">${delta(first, last)} depuis le début</span>` : ''}</div>
      <div class="seg" style="margin:12px 0 6px">${[['mois', 'Mois'], ['annee', 'Année'], ['tout', 'Tout']].map(([k, l]) => `<button class="${range === k ? 'sel' : ''}" data-m="range" data-v="${k}">${l}</button>`).join('')}</div>${weightChart(ws)}`
      : `<p class="tiny">Aucune pesée pour l'instant.</p><button data-m="newmeas">+ Noter mon poids</button>`}
    </div>
    <div class="side2">
      <div class="tcard"><div class="eyebrow">Taille</div><div class="row"><div class="unit" style="width:130px"><input inputmode="numeric" data-b="h" value="${esc(B.h)}" aria-label="Taille"><span>cm</span></div></div>${imc ? `<p class="tiny">IMC ${fr(imc, 1)}</p>` : ''}</div>
      <div class="tcard"><div class="eyebrow">Âge</div><div class="row"><div class="unit" style="width:130px"><input inputmode="numeric" data-b="birth" value="${esc(S.body.birth)}" aria-label="Année de naissance"><span>naissance</span></div></div><p class="tiny">${B.age} ans</p></div>
    </div>
  </div>
  <div class="tcard"><div class="eyebrow">Mensurations</div><p class="tiny">Mètre ruban, le matin, au même endroit.</p>
    <div class="meas4">${MEAS.map(([k, l]) => { const m = lastM(k); return `<div class="mini"><small>${l}</small><b>${m ? fr(m[k], 1) + ' cm' : '—'}</b>${m ? `<span class="tiny">${dFr(m.t)}</span>` : ''}</div>`; }).join('')}</div></div>
  <div class="tcard"><div class="between"><div class="eyebrow" style="margin:0">Photos avant / après</div><label class="btn sm">+ Photo<input type="file" accept="image/*" hidden data-bodyph="1"></label></div>
    <p class="tiny">Une photo par mois, même endroit, même lumière, même tenue. Elles restent sur ton téléphone.</p><div id="bphotos"><p class="tiny">Chargement…</p></div></div>
  ${ws.length ? `<details class="tcard"><summary>Toutes mes mesures</summary>${[...ws].reverse().map(w => `<div class="between small" style="padding:6px 0;border-top:1px solid var(--line)"><span>${dFr(w.t)}</span><b>${fr(w.kg, 1)} kg</b><button class="sm ghost" data-m="delw" data-t2="${w.t}">Retirer</button></div>`).join('')}</details>` : ''}`;
}
function measSheet() {
  const today = new Date().toISOString().slice(0, 10), B = C().body();
  C().sheet(`<h2>Nouvelle mesure</h2><label class="lbl">Date<input type="date" id="md" value="${today}"></label>
    <label class="lbl">Poids<div class="unit"><input inputmode="decimal" id="mw" value="${B.w ? fr(B.w, 1) : ''}"><span>kg</span></div></label>
    <div class="trio">${MEAS.map(([k, l]) => `<label class="lbl">${l.replace('Tour de ', '')}<div class="unit"><input inputmode="decimal" id="m_${k}"><span>cm</span></div></label>`).join('')}</div>
    <button class="p wide" style="margin-top:14px" data-m="savemeas">Enregistrer</button><button class="ghost wide" style="margin-top:8px" data-close>Fermer</button>`);
}
function vApparence() {
  const st = C().S().set;
  return `<p class="sub2">L'allure de ton app. Le choix est gardé sur ce téléphone et dans tes exports.</p>
  <div class="themes">${THEMES.map(([k, n, d]) => `<button class="thcard th-${k} ${st.theme === k ? 'sel' : ''}" data-m="theme" data-v="${k}"><div class="thprev"><i></i><i></i><em></em><b></b><b></b><b></b></div><strong>${n}</strong>${k === 'chrono' ? '<span class="def">Par défaut</span>' : ''}<small>${d}</small></button>`).join('')}</div>
  <div class="tcard"><h3>Jour et nuit</h3><label class="checkrow"><input type="checkbox" data-m="auto" ${st.autoNight ? 'checked' : ''}> Suivre le mode sombre de l'iPhone</label>
    <p class="tiny">Quand l'iPhone passe en sombre, l'app passe au thème de nuit choisi dessous.</p>
    <div class="pills">${[['same', 'Mon thème, en nuit'], ['profondeurs', 'Les Profondeurs']].map(([k, l]) => `<button class="${(st.night || 'same') === k ? 'sel' : ''}" data-m="night" data-v="${k}">${l}</button>`).join('')}</div></div>
  <div class="tcard"><h3>Mode salle</h3><div class="pills">${[['theme', 'Aux couleurs du thème'], ['dark', 'Sombre classique']].map(([k, l]) => `<button class="${(st.gym || 'dark') === k ? 'sel' : ''}" data-m="gym" data-v="${k}">${l}</button>`).join('')}</div>
    <p class="tiny">Pour l'écran pendant la séance. « Sombre classique » garde le noir, plus lisible et plus économe en batterie.</p></div>`;
}
VIEWS.me = () => {
  const tabs = [['corps', 'Mon corps'], ['apparence', 'Apparence'], ['reglages', 'Réglages']];
  const body = meSub === 'corps' ? vCorps() : meSub === 'apparence' ? vApparence() : C().settingsHtml();
  return `<div class="kicker">Mon espace</div><h1>${{ corps: 'Mon corps', apparence: 'Apparence', reglages: 'Réglages' }[meSub]}</h1><div class="seg" style="margin:14px 0">${tabs.map(([k, l]) => `<button class="${meSub === k ? 'sel' : ''}" data-m="sub" data-v="${k}">${l}</button>`).join('')}</div>${body}`;
};
VIEWS.meGoto = k => { meSub = k; };

/* thème appliqué à la racine */
window.applyTheme = () => {
  const st = (window.CARNET && C().S().set) || {}, dark = st.autoNight && matchMedia('(prefers-color-scheme: dark)').matches;
  const th = dark ? (st.night && st.night !== 'same' ? st.night : (st.theme || 'chrono')) : (st.theme || 'chrono');
  document.documentElement.dataset.th = th; document.documentElement.dataset.night = dark && th !== 'profondeurs' ? '1' : '';
  document.documentElement.dataset.gym = st.gym || 'dark';
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#ededef';
};
try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => window.applyTheme()); } catch (e) { }

document.addEventListener('click', e => {
  const b = e.target.closest('[data-m]'); if (!b || !window.CARNET) return;
  const S = C().S(), v = b.dataset.v;
  switch (b.dataset.m) {
    case 'sub': meSub = v; break;
    case 'range': range = v; break;
    case 'newmeas': measSheet(); return;
    case 'savemeas': {
      const t = new Date($v('md') + 'T08:00').getTime() || Date.now(), kg = num($v('mw'));
      if (kg) { S.body.weights = (S.body.weights || []).filter(w => new Date(w.t).toDateString() !== new Date(t).toDateString()); S.body.weights.push({ t, kg }); S.body.weights.sort((a, b) => a.t - b.t); }
      const m = { t }; let any = false; for (const [k] of MEAS) { const x = num($v('m_' + k)); if (x) { m[k] = x; any = true; } }
      if (any) { S.body.meas = S.body.meas || []; S.body.meas.push(m); }
      if (!kg && !any) { C().toast('Entre au moins une valeur'); return; }
      C().closeSheet(); C().toast('Mesure enregistrée'); break;
    }
    case 'delw': S.body.weights = (S.body.weights || []).filter(w => w.t !== +b.dataset.t2); break;
    case 'theme': S.set.theme = v; break;
    case 'night': S.set.night = v; break;
    case 'gym': S.set.gym = v; break;
    default: return;
  }
  C().save(); window.applyTheme(); C().render();
});
document.addEventListener('change', e => {
  const t = e.target; if (!window.CARNET) return;
  if (t.dataset.b) { const S = C().S(), n = parseInt(t.value); if (t.dataset.b === 'h' && n > 100 && n < 250) S.body.h = n; if (t.dataset.b === 'birth' && n > 1920 && n < new Date().getFullYear() - 5) S.body.birth = n; C().save(); C().render(); }
  if (t.dataset.m === 'auto') { C().S().set.autoNight = t.checked; C().save(); window.applyTheme(); C().render(); }
});
const $v = id => (document.getElementById(id) || {}).value || '';
const num = v => parseFloat(String(v || '').replace(',', '.')) || 0;
let cmpI = null;
AFTER.me = async () => {
  const box = document.getElementById('bphotos'); if (!box || !C().media) return;
  await C().media.ready(); const L = (await C().media.list('body')).sort((a, b) => (a.t || a.k) - (b.t || b.k));
  if (!L.length) { box.innerHTML = '<p class="tiny">Pas encore de photo. Ajoute ta première : elle servira de point de départ.</p>'; return; }
  const url = m => { const u = URL.createObjectURL(m.blob); return u; }, d = m => new Date(m.t || Date.now()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' });
  const a = L[0], b = L[cmpI !== null && L[cmpI] ? cmpI : L.length - 1];
  box.innerHTML = (L.length > 1 ? `<div class="bacmp" style="--x:50%"><img src="${url(b)}" alt="Après"><div class="ba-before"><img src="${url(a)}" alt="Avant"></div><span class="ba-l">${d(a)}</span><span class="ba-r">${d(b)}</span><i class="ba-h"></i><input type="range" min="0" max="100" value="50" aria-label="Comparer avant et après" data-bacmp="1"></div>` : '')
    + `<div class="bph">${L.map((x, i) => `<figure class="${x === b ? 'sel' : ''}"><img src="${url(x)}" alt="Photo du ${d(x)}" data-bpsel="${i}"><figcaption>${d(x)}</figcaption><button data-bpdel="${x.k}" aria-label="Supprimer">✕</button></figure>`).join('')}</div>`;
};
document.addEventListener('input', e => { if (e.target.dataset.bacmp) e.target.parentElement.style.setProperty('--x', e.target.value + '%'); });
document.addEventListener('change', async e => { const t = e.target; if (!t.dataset.bodyph || !t.files[0] || !window.CARNET) return; await C().media.ready(); await C().media.tx(st => st.add({ ex: 'body', blob: t.files[0], type: t.files[0].type, t: Date.now() })); C().toast('Photo ajoutée'); cmpI = null; C().render(); });
document.addEventListener('click', async e => { const s = e.target.closest('[data-bpsel]'), d = e.target.closest('[data-bpdel]'); if (s) { cmpI = +s.dataset.bpsel; AFTER.me(); } if (d) { if (!d.dataset.sure) { d.dataset.sure = 1; d.textContent = 'Sûr ?'; return; } await C().media.tx(st => st.delete(+d.dataset.bpdel)); cmpI = null; AFTER.me(); } });
}
