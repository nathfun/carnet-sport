'use strict';
/* Mes modèles : cartes compactes + éditeur d'un modèle à la fois. */
{
const C = () => window.CARNET;
const VIEWS = window.VIEWS = window.VIEWS || {};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let edit = null; // id du modèle ouvert
const est = s => { let sec = 0, n = 0; for (const e of s.ex) { n += +e.sets || 0; sec += (+e.sets || 0) * (45 + (+e.rest || 60)); } return { n, min: Math.round(sec / 60) }; };
const muscles = s => [...new Set(s.ex.map(e => C().metaOf(e.id).m).filter(Boolean))];
const restL = s => s >= 60 ? Math.floor(s / 60) + ' min' + (s % 60 ? ' ' + s % 60 : '') : s + ' s';

function list() {
  const P = C().S().program;
  return `<p class="sub2">${P.length} modèles. Touche-en un pour le modifier, ou crée-en un nouveau.</p>
  <div class="mgrid2">${P.map(s => { const e = est(s), ms = muscles(s); return `<button class="mcard" data-md="open" data-v="${esc(s.id)}">
    <div class="mc-body">${window.bodySvg(ms.length ? ms : ['Pecs'], { cls: 'mini-body' })}</div>
    <div class="mc-t"><b>${esc(s.name)}</b><small>${s.ex.length} exercices · ≈ ${e.min} min</small><div class="mc-m">${ms.slice(0, 4).map(m => `<span>${esc(m)}</span>`).join('')}</div></div></button>`; }).join('')}
    <button class="mcard add" data-md="new"><span>+</span><b>Nouveau modèle</b></button></div>
  <button class="ghost wide" style="margin-top:14px" data-act="preset">Revenir au programme de base</button>`;
}
function editor(s) {
  const e = est(s), si = C().S().program.indexOf(s);
  return `<button class="link" data-md="back">← Tous mes modèles</button>
  <div class="tcard med-head"><input class="title-in" value="${esc(s.name)}" data-mf="name" aria-label="Nom du modèle">
    <input class="sub-in" value="${esc(s.sub || '')}" data-mf="sub" placeholder="Description (facultatif)" aria-label="Description">
    <div class="chipsrow" style="margin-top:8px"><span class="chip2">${s.ex.length} exercices</span><span class="chip2">${e.n} séries</span><span class="chip2">≈ ${e.min} min</span>${s.kind === 'pr' ? '<span class="chip2">Séance PR</span>' : ''}</div></div>
  <div class="medlist">${s.ex.map((x, i) => { const m = C().metaOf(x.id); return `<button class="merow" data-md="ex" data-i="${i}"><div class="mer-b">${window.bodySvg(m.m || 'Pecs', { one: true })}</div><div class="mer-t"><b>${esc(x.n)}</b><small>${x.sets} × ${esc(x.reps)} · repos ${restL(+x.rest)}</small></div><span class="mer-go">›</span></button>`; }).join('') || '<p class="tiny">Aucun exercice. Ajoute le premier.</p>'}</div>
  <button class="p wide" style="margin-top:10px" data-act="paddex" data-si="${si}">+ Ajouter un exercice</button>
  <div class="row" style="margin-top:10px"><button class="grow" data-md="plan">Planifier</button><button class="grow" data-act="start" data-sid="${esc(s.id)}">Lancer maintenant</button></div>
  <div class="row" style="margin-top:8px"><button class="sm ghost grow" data-md="dup">Dupliquer</button><button class="sm ghost grow" data-md="del">Supprimer ce modèle</button></div>`;
}
function exSheet(s, i) {
  const x = s.ex[i], m = C().metaOf(x.id);
  C().sheet(`<div class="between"><h2 style="font-size:22px">${esc(x.n)}</h2></div><p class="tiny">${esc([m.m, (window.EQUIP || {})[m.eq]].filter(Boolean).join(' · '))}</p>
    <div class="trio3" style="margin-top:12px">
      <div><div class="tiny">Séries</div><div class="stepper"><button class="sbtn" data-mx="sets" data-d="-1">−</button><div class="sval" id="mxs">${x.sets}</div><button class="sbtn" data-mx="sets" data-d="1">+</button></div></div>
      <div><div class="tiny">Répétitions</div><input id="mxr" value="${esc(x.reps)}" style="text-align:center;font-weight:900;font-size:19px;min-height:54px"></div>
      <div><div class="tiny">Repos</div><div class="stepper"><button class="sbtn" data-mx="rest" data-d="-1">−</button><div class="sval" id="mxt">${x.rest} s</div><button class="sbtn" data-mx="rest" data-d="1">+</button></div></div></div>
    <label class="lbl">Guide / consignes<textarea rows="2" data-guide="${esc(x.id)}" placeholder="${esc(m.tip || 'Ex. siège cran 4')}">${esc(C().S().guides[x.id] || '')}</textarea></label>
    <div class="media" data-media="${esc(x.id)}"></div>
    <div class="row"><label class="btn sm">Ajouter photo, GIF ou vidéo<input type="file" accept="image/*,video/*" multiple hidden data-add="${esc(x.id)}"></label></div>
    <div class="row" style="margin-top:12px"><button class="sm grow" data-mx="up" ${i ? '' : 'disabled'}>Monter</button><button class="sm grow" data-mx="down" ${i < s.ex.length - 1 ? '' : 'disabled'}>Descendre</button><button class="sm ghost grow" data-mx="rm">Retirer</button></div>
    <button class="p wide" style="margin-top:12px" data-mx="ok">OK</button>`);
  window.__mx = { sid: s.id, i };
  window.CARNET_fillMedia && window.CARNET_fillMedia(x.id);
}
VIEWS.models = () => { const s = edit && C().S().program.find(p => p.id === edit); return s ? editor(s) : list(); };
VIEWS.modelsOpen = id => { edit = id; };

document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-md],[data-mx]'); if (!b || !window.CARNET) return;
  const S = C().S();
  if (b.dataset.mx) {
    const st = window.__mx, s = S.program.find(p => p.id === st.sid), x = s && s.ex[st.i]; if (!x) return;
    const d = +b.dataset.d || 0;
    switch (b.dataset.mx) {
      case 'sets': x.sets = Math.max(1, Math.min(12, (+x.sets || 3) + d)); document.getElementById('mxs').textContent = x.sets; C().save(); return;
      case 'rest': x.rest = Math.max(15, Math.min(600, (+x.rest || 60) + d * 15)); document.getElementById('mxt').textContent = x.rest + ' s'; C().save(); return;
      case 'up': case 'down': { const j = st.i + (b.dataset.mx === 'up' ? -1 : 1); [s.ex[st.i], s.ex[j]] = [s.ex[j], s.ex[st.i]]; break; }
      case 'rm': if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Sûr ?'; return; } s.ex.splice(st.i, 1); break;
      case 'ok': { const r = document.getElementById('mxr'); if (r && r.value.trim()) x.reps = r.value.trim(); break; }
    }
    C().closeSheet(); C().save(); C().render(); return;
  }
  const s = edit && S.program.find(p => p.id === edit);
  switch (b.dataset.md) {
    case 'open': edit = b.dataset.v; window.scrollTo(0, 0); break;
    case 'back': edit = null; break;
    case 'new': { const id = 's_' + Date.now().toString(36); S.program.push({ id, name: 'Nouvelle séance', sub: '', ex: [] }); edit = id; break; }
    case 'ex': exSheet(s, +b.dataset.i); return;
    case 'dup': { const id = 's_' + Date.now().toString(36); S.program.push({ ...JSON.parse(JSON.stringify(s)), id, name: s.name + ' (copie)', kind: '' }); edit = id; C().toast('Modèle dupliqué'); break; }
    case 'del': if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Toucher encore pour supprimer'; return; } S.program = S.program.filter(p => p.id !== edit); S.plans = (S.plans || []).filter(p => p.sid !== edit); edit = null; break;
    case 'plan': C().planNew(edit); return;
    default: return;
  }
  C().save(); C().render();
});
document.addEventListener('input', ev => {
  const t = ev.target; if (!t.dataset.mf || !window.CARNET) return;
  const s = C().S().program.find(p => p.id === edit); if (s) { s[t.dataset.mf] = t.value; C().save(); }
});
}
