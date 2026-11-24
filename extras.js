'use strict';
/* Surcharge progressive, stagnation, semaine de décharge, notifications (in-app + système), rappels .ics. */
{
const C = () => window.CARNET;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const r25 = v => Math.round(v / 2.5) * 2.5;
const num = v => parseFloat(String(v ?? '').replace(',', '.')) || 0;
const gymLog = () => C().S().log.filter(l => l.kind !== 'run' && l.kind !== 'bike');
const topReps = reps => { const m = String(reps).match(/(\d+)\s*$/); return m ? +m[1] : 0; };

/* ---------- 1. surcharge progressive ---------- */
window.PROG = {
  // la dernière fois, toutes les séries de travail au haut de la fourchette → +2,5 kg (isolation légère : +1 kg)
  suggest(ex) {
    const top = topReps(ex.reps); if (!top) return null;
    const L = gymLog(); for (let i = L.length - 1; i >= 0; i--) { const e = (L[i].ex || []).find(x => x.id === ex.id); if (!e) continue;
      const w = e.sets.filter(s => s.t !== 'e' && num(s.kg) > 0); if (!w.length) return null;
      const kg = Math.max(...w.map(s => num(s.kg))); const all = w.filter(s => num(s.kg) === kg).every(s => (+s.r || 0) >= top) && w.length >= Math.min(2, +ex.sets || 2);
      if (!all) return null; const step = kg < 15 ? 1 : 2.5;
      return { kg: Math.round((kg + step) * 10) / 10, from: kg, msg: `Tu as atteint ${top} reps ou plus sur toutes tes séries à ${String(kg).replace('.', ',')} kg : on monte à ${String(Math.round((kg + step) * 10) / 10).replace('.', ',')} kg aujourd'hui.` }; }
    return null;
  },
  /* ---------- 2. stagnation : pas de progrès sur 3 séances ---------- */
  stagnant(id) {
    const h = gymLog().filter(s => (s.ex || []).some(e => e.id === id)).map(s => { const w = s.ex.find(e => e.id === id).sets.filter(x => x.t !== 'e'); return Math.max(0, ...w.map(x => num(x.kg) * (1 + Math.min(+x.r || 1, 12) / 30))); });
    if (h.length < 4) return null;
    const last3 = h.slice(-3), before = Math.max(...h.slice(0, -3));
    if (Math.max(...last3) > before * 1.005) return null;
    const m = C().metaOf(id), alt = (window.LIBRARY || []).filter(e => e.id !== id && e.m === m.m && (e.eq === 'M' || e.eq === 'S' || e.eq === 'P') && e.sets >= 3).slice(0, 2);
    return { alt, msg: `Pas de progrès depuis 3 séances. Deux pistes : baisse de 10 % et remonte en 2 semaines, ou change de variante${alt.length ? ' (' + alt.map(a => a.n).join(', ') + ')' : ''}.` };
  },
  stagnantList() { const ids = [...new Set(gymLog().slice(-12).flatMap(s => (s.ex || []).map(e => e.id)))]; return ids.map(id => ({ id, s: this.stagnant(id) })).filter(x => x.s); }
};

/* ---------- 3. semaine de décharge ---------- */
window.DELOAD = {
  cfg() { const S = C().S(); S.deload = { every: 7, from: S.deload?.from || Date.now(), on: false, until: 0, ...S.deload }; return S.deload; },
  week() { const d = this.cfg(); return Math.floor((Date.now() - d.from) / (7 * 864e5)) % d.every + 1; },
  due() { const d = this.cfg(); return this.week() === d.every && !this.active(); },
  active() { const d = this.cfg(); return d.on && Date.now() < d.until; },
  start() { const d = this.cfg(); d.on = true; const t = new Date(); t.setHours(0, 0, 0, 0); t.setDate(t.getDate() - ((t.getDay() + 6) % 7) + 7); d.until = t.getTime(); C().save(); },
  stop() { const d = this.cfg(); d.on = false; d.from = Date.now(); C().save(); },
  apply(sets) { return sets.slice(0, Math.max(2, sets.length - 1)).map(s => ({ ...s, kg: s.kg === '' ? '' : r25(num(s.kg) * .6), deload: true })); }
};

/* ---------- notifications ---------- */
const inbox = () => { const S = C().S(); S.inbox = S.inbox || []; return S.inbox; };
window.notify = (icon, title, body, opts = {}) => {
  const S = C().S(), item = { t: Date.now(), i: icon, title, body, read: false, act: opts.act || '' };
  inbox().unshift(item); S.inbox = inbox().slice(0, 60); C().save();
  if (!opts.silent) banner(item);
  if (opts.sys !== false && 'Notification' in window && Notification.permission === 'granted' && navigator.serviceWorker) navigator.serviceWorker.ready.then(r => r.showNotification(title, { body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: opts.tag || String(item.t) })).catch(() => { });
  const b = document.getElementById('bellN'); if (b) { b.textContent = unread(); b.hidden = !unread(); }
};
const unread = () => inbox().filter(n => !n.read).length;
function banner(n) {
  const o = document.createElement('div'); o.className = 'nbanner'; o.innerHTML = `<span class="nb-i">${n.i}</span><div><b>${esc(n.title)}</b><small>${esc(n.body)}</small></div>`;
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('show'));
  const close = () => { o.classList.remove('show'); setTimeout(() => o.remove(), 300); };
  o.addEventListener('click', () => { close(); window.openInbox(); }); setTimeout(close, 4500);
}
window.bellHtml = () => `<button class="bell" data-ex="inbox" aria-label="Notifications"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 3a6 6 0 0 0-6 6v3.6L4.3 15.4A1 1 0 0 0 5.2 17h13.6a1 1 0 0 0 .9-1.6L18 12.6V9a6 6 0 0 0-6-6Zm0 19a3 3 0 0 0 2.8-2H9.2A3 3 0 0 0 12 22Z" fill="currentColor"/></svg><span id="bellN" ${unread() ? '' : 'hidden'}>${unread()}</span></button>`;
window.openInbox = () => {
  const L = inbox();
  C().sheet(`<h2>Notifications</h2>${L.length ? L.map(n => `<div class="nitem ${n.read ? '' : 'new'}"><span class="nb-i">${n.i}</span><div><b>${esc(n.title)}</b><small>${esc(n.body)}</small><em>${new Date(n.t).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</em></div></div>`).join('') : '<p class="tiny">Rien pour l\'instant. Tes rappels, records, badges et idées de repas arriveront ici.</p>'}
    <button class="ghost wide" style="margin-top:10px" data-close>Fermer</button>`);
  for (const n of L) n.read = true; C().save(); const b = document.getElementById('bellN'); if (b) b.hidden = true;
};
// rappels quand l'app s'ouvre : séance du jour, flamme en danger, décharge
window.dailyChecks = () => {
  const S = C().S(), key = new Date().toDateString(); S.seen = S.seen || {};
  const once = (k, fn) => { if (S.seen[k] === key) return; S.seen[k] = key; fn(); C().save(); };
  const h = new Date().getHours(), today = (window.VIEWS.plannedToday ? window.VIEWS.plannedToday() : []).filter(p => p.kind === 'muscu');
  if (today.length && !S.draft) once('today', () => { const s = S.program.find(x => x.id === today[0].sid); if (s) window.notify('💪', `C'est jour de ${s.name}`, h < 12 ? "Ta séance est prévue aujourd'hui. Prépare ton sac !" : 'Ta séance t\'attend. Allez, on y va !', { act: 'program' }); });
  const day = new Date().getDay(), wk = window.weekCountNow ? window.weekCountNow() : 1;
  if ((day === 5 || day === 6 || day === 0) && wk < (S.set.goal || 1)) once('flame', () => window.notify('🔥', 'Ta flamme est en danger', `Encore ${(S.set.goal || 1) - wk} séance${(S.set.goal || 1) - wk > 1 ? 's' : ''} avant dimanche pour la garder.`));
  if (window.DELOAD.due()) once('deload', () => window.notify('🧘', 'Semaine de décharge conseillée', 'Ça fait ' + window.DELOAD.cfg().every + " semaines d'affilée. Une semaine plus légère et tu repars plus fort."));
};
window.askNotif = async () => {
  if (!('Notification' in window)) { C().toast("Ajoute l'app à l'écran d'accueil (iOS 16.4 ou plus) pour les notifications"); return; }
  const p = await Notification.requestPermission(); C().toast(p === 'granted' ? 'Notifications activées' : 'Notifications refusées dans les réglages');
  if (p === 'granted') window.notify('✅', 'Notifications activées', "Tu recevras tes records, badges et idées de repas pendant que l'app est ouverte.");
  C().render();
};

/* ---------- rappels dans le calendrier iPhone (.ics) ---------- */
window.exportIcs = () => {
  const S = C().S(), DAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'], H = { matin: [8, 0], midi: [12, 15], apm: [17, 0], soir: [19, 0] };
  const pad = n => String(n).padStart(2, '0'), stamp = d => d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00';
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Carnet sport//FR', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Carnet sport'];
  for (const p of S.plans || []) {
    const name = p.kind === 'muscu' ? (S.program.find(x => x.id === p.sid)?.name || 'Séance') : (p.name || (p.kind === 'run' ? 'Course à pied' : 'Vélo'));
    const [hh, mm] = H[p.moment] || [17, 0], d = p.repeat === 'week' ? new Date() : new Date(p.date + 'T00:00');
    if (p.repeat === 'week') { const target = p.days[0]; d.setDate(d.getDate() + ((target - d.getDay() + 7) % 7)); }
    d.setHours(hh, mm, 0, 0); const e = new Date(d.getTime() + 75 * 60e3);
    lines.push('BEGIN:VEVENT', 'UID:' + p.id + '@carnet-sport', 'DTSTAMP:' + stamp(new Date()), 'DTSTART;TZID=Europe/Paris:' + stamp(d), 'DTEND;TZID=Europe/Paris:' + stamp(e), 'SUMMARY:' + (p.kind === 'muscu' ? '💪 ' : p.kind === 'run' ? '🏃 ' : '🚴 ') + name.replace(/[,;]/g, ' '));
    if (p.repeat === 'week') lines.push('RRULE:FREQ=WEEKLY;BYDAY=' + p.days.map(x => DAY[x]).join(','));
    lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + name.replace(/[,;]/g, ' ') + ' dans 30 min', 'TRIGGER:-PT30M', 'END:VALARM', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' }), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'carnet-sport-seances.ics'; document.body.appendChild(a); a.click(); a.remove();
  C().toast('Ouvre le fichier puis « Tout ajouter »');
};

document.addEventListener('click', e => {
  const b = e.target.closest('[data-ex]'); if (!b || !window.CARNET) return;
  switch (b.dataset.ex) {
    case 'inbox': window.openInbox(); return;
    case 'notif': window.askNotif(); return;
    case 'ics': window.exportIcs(); return;
    case 'deloadon': window.DELOAD.start(); C().toast('Semaine de décharge : charges à 60 %, une série en moins'); break;
    case 'deloadoff': window.DELOAD.stop(); break;
    case 'deloadevery': { const d = window.DELOAD.cfg(); d.every = +b.dataset.v; C().save(); break; }
    default: return;
  }
  C().render();
});
}
