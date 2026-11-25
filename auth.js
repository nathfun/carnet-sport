'use strict';
/* Écran de connexion / inscription, création du compte de Nathan (migration) et premiers réglages. */
{
const C = () => window.CARNET, SY = () => window.SYNC;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let mode = null, invite = null, inviter = null, claimable = null, busy = false, err = '';
try { const q = new URLSearchParams(location.search).get('invite'); if (q) { sessionStorage.setItem('carnet-invite', q); history.replaceState(null, '', location.pathname); } invite = sessionStorage.getItem('carnet-invite'); } catch (e) { }

/* ---------- programme débutant ---------- */
const X = (id, n, sets, reps, rest) => ({ id, n, sets, reps, rest, q: n + ' technique' });
const beginner = () => [
  { id: 'fbA', name: 'Corps entier A', sub: 'Machines guidées, idéal pour débuter', ex: [X('presse', 'Presse à cuisses', 3, '10-12', 120), X('mchest', 'Chest press assis (machine)', 3, '10-12', 90), X('tirvert', 'Tirage vertical poulie prise large', 3, '10-12', 90), X('legcurlass', 'Leg curl assis', 3, '12', 75), X('mshoul', 'Développé épaules (machine)', 2, '12', 75), X('crmach', 'Crunch machine', 3, '15', 60)] },
  { id: 'fbB', name: 'Corps entier B', sub: 'Machines guidées, idéal pour débuter', ex: [X('legext', 'Leg extension', 3, '12', 75), X('mhip', 'Hip thrust (machine)', 3, '12', 90), X('rowp', 'Rowing assis poulie prise serrée', 3, '10-12', 90), X('mlat', 'Élévations latérales (machine)', 2, '12-15', 60), X('abduct', 'Abducteurs (machine)', 3, '15', 60), X('planche', 'Planche (secondes)', 3, '30', 60)] },
];

/* ---------- quand afficher quoi ---------- */
const needAuth = () => window.SYNC && !SY().on() && !SY().cfg().local;
const needSetup = () => window.SYNC && SY().on() && C() && !(C().S().set || {}).sports;
addEventListener('online', () => { if (window.CARNET && needAuth()) { err = ''; C().render(); } });
addEventListener('offline', () => { if (window.CARNET && needAuth()) C().render(); });
window.AUTH = {
  gate: () => needAuth() || needSetup(),
  html: () => needAuth() ? authHtml() : setupHtml(),
  after: () => { if (needAuth() && claimable === null) checkStatus(); },
};
async function checkStatus() {
  try {
    const rr = await fetch(SY().base() + '/auth/status', { cache: 'no-store' });
    if (!rr.ok) { setTimeout(checkStatus, 15000); return; }
    const r = await rr.json(); claimable = !!r.claimable;
    if (invite) { const i = await fetch(SY().base() + '/invite/' + encodeURIComponent(invite), { cache: 'no-store' }); const j = await i.json().catch(() => ({})); inviter = j.ok ? j.by : ''; if (!j.ok) { invite = null; sessionStorage.removeItem('carnet-invite'); } }
  } catch (e) { setTimeout(checkStatus, 15000); return; }
  if (needAuth()) C().render();
}

function authHtml() {
  const old = SY().cfg().key, m = mode || (old && claimable !== false ? 'claim' : invite ? 'register' : 'login');
  const head = `<div class="au-logo">Carnet <b>sport</b></div>`;
  const msg = !navigator.onLine ? '<p class="au-err">📵 Pas de réseau. La toute première connexion sur cet appareil a besoin d\'internet (wifi ou 4G). Ensuite, l\'app marche hors ligne, même à la salle.</p>' : err ? `<p class="au-err">${esc(err)}</p>` : SY().cfg().expired ? '<p class="au-err">Ta session a expiré : reconnecte-toi.</p>' : '';
  if (m === 'claim') return `<div class="au">${head}<div class="au-card"><h1>Nouveau : les comptes</h1>
    <p class="small">L'app passe en comptes personnels pour que ta famille et tes amis aient chacun le leur. Crée le tien : <b>toutes tes données actuelles y seront rangées</b>, et tu seras l'administrateur.</p>${msg}
    <label>Prénom<input id="au-name" value="Nathan" autocomplete="given-name"></label>
    <label>Pseudo (pour te connecter)<input id="au-u" value="nathan" autocapitalize="off" autocomplete="username"></label>
    <label>Mot de passe (6 caractères minimum)<input id="au-p" type="password" autocomplete="new-password"></label>
    <button class="p wide" data-au="claim" ${busy ? 'disabled' : ''}>${busy ? 'Création…' : 'Créer mon compte'}</button>
    <p class="tiny">Une copie de tes données d'avant reste sur le serveur, au cas où.</p>
    <button class="link" data-au="mode" data-v="login">J'ai déjà créé mon compte sur un autre appareil</button></div></div>`;
  if (m === 'register') return `<div class="au">${head}<div class="au-card"><h1>Créer mon compte</h1>
    ${inviter ? `<p class="small">Invité par <b>${esc(inviter)}</b> 👋</p>` : invite ? '' : '<p class="small">Pour créer un compte, il te faut un <b>lien d\'invitation</b> envoyé par un ami qui a déjà l\'app.</p>'}${msg}
    ${invite ? `<label>Prénom<input id="au-name" autocomplete="given-name"></label>
    <label>Pseudo (pour te connecter, sans espace)<input id="au-u" autocapitalize="off" autocomplete="username" placeholder="ex. sophie.b"></label>
    <label>Mot de passe (6 caractères minimum)<input id="au-p" type="password" autocomplete="new-password"></label>
    <label>Confirme le mot de passe<input id="au-p2" type="password" autocomplete="new-password"></label>
    <button class="p wide" data-au="register" ${busy ? 'disabled' : ''}>${busy ? 'Création…' : 'Créer mon compte'}</button>` : ''}
    <button class="link" data-au="mode" data-v="login">J'ai déjà un compte</button></div>${local()}</div>`;
  return `<div class="au">${head}<div class="au-card"><h1>Connexion</h1>${msg}
    <label>Pseudo<input id="au-u" autocapitalize="off" autocomplete="username"></label>
    <label>Mot de passe<input id="au-p" type="password" autocomplete="current-password"></label>
    <button class="p wide" data-au="login" ${busy ? 'disabled' : ''}>${busy ? 'Connexion…' : 'Me connecter'}</button>
    <p class="tiny">Mot de passe oublié ? Demande à Nathan de le réinitialiser.</p>
    ${old && claimable !== false ? '<button class="link" data-au="mode" data-v="claim">Créer mon compte (première fois)</button>' : `<button class="link" data-au="mode" data-v="register">Créer un compte</button>`}</div>${local()}</div>`;
}
const local = () => `<button class="link au-local" data-au="local">Continuer sans compte (tout reste sur cet appareil)</button>`;

function setupHtml() {
  const S = C().S(), u = (SY().cfg().user || {}), sp = S.set._draftSports || ['gym', 'run'], mine = u.admin || (S.log || []).length, b = mine ? C().body() : { h: '', w: '' };
  return `<div class="au"><div class="au-card wide"><div class="kicker">Bienvenue</div><h1>Salut ${esc(u.name || '')} !</h1><p class="small">Trois réglages et c'est parti. Tout se modifie ensuite dans Moi → Réglages.</p>
    <div class="sec">Tes sports</div><div class="au-sports">${[['gym', '🏋️', 'Muscu'], ['run', '🏃', 'Course'], ['bike', '🚴', 'Vélo']].map(([k, i, l]) => `<button class="${sp.includes(k) ? 'sel' : ''}" data-au="sport" data-v="${k}"><span>${i}</span>${l}</button>`).join('')}</div>
    ${sp.includes('gym') ? `<div class="sec">Ton programme de muscu</div><div class="au-prog">${[['beg', 'Débutant', '2 séances « corps entier » sur machines guidées'], ['nathan', 'Programme de Nathan', '4 séances machines (pecs, dos) + séance records'], ['none', 'Je crée le mien', 'Tu pars de zéro dans Séances']].map(([k, t, d], i) => `<label><input type="radio" name="au-prog" value="${k}" ${i === 0 ? 'checked' : ''}><span><b>${t}</b><small>${d}</small></span></label>`).join('')}</div>` : ''}
    <div class="sec">Toi</div><div class="trio"><label>Année de naissance<input id="au-by" inputmode="numeric" value="${mine ? S.body.birth || '' : ''}"></label><label>Taille (cm)<input id="au-h" inputmode="numeric" value="${b.h}"></label><label>Poids (kg)<input id="au-w" inputmode="decimal" value="${b.w}"></label></div>
    ${sp.includes('run') ? `<label style="margin-top:10px">Objectif d'allure en course (facultatif)<input id="au-goal" placeholder="ex. 5:30 (min/km)"></label>` : ''}
    <label style="margin-top:10px">Tes objectifs en une phrase (facultatif, pour les conseils)<input id="au-obj" placeholder="ex. me remettre en forme, perdre 5 kg"></label>
    <button class="p wide" style="margin-top:14px" data-au="setup">C'est parti</button></div></div>`;
}

/* ---------- actions ---------- */
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-au]'); if (!b || !window.CARNET) return;
  const a = b.dataset.au, v = id => ((document.getElementById(id) || {}).value || '').trim();
  if (a === 'mode') { mode = b.dataset.v; err = ''; C().render(); return; }
  if (a === 'local') { SY().setLocal(true); const S = C().S(); if (!S.set.sports) S.set.sports = ['gym', 'run', 'bike']; C().save(); C().render(); return; }
  if (a === 'sport') { const S = C().S(), sp = new Set(S.set._draftSports || ['gym', 'run']); sp.has(b.dataset.v) ? sp.delete(b.dataset.v) : sp.add(b.dataset.v); S.set._draftSports = [...sp]; C().render(); return; }
  if (a === 'setup') return setup();
  if (busy) return;
  const body = { u: v('au-u'), pass: (document.getElementById('au-p') || {}).value || '', name: v('au-name') };
  if (a === 'register' && body.pass !== ((document.getElementById('au-p2') || {}).value || '')) { err = 'Les deux mots de passe ne sont pas identiques.'; C().render(); return; }
  busy = true; err = ''; C().render();
  try {
    const path = a === 'claim' ? '/auth/claim' : a === 'register' ? '/auth/register' : '/auth/login';
    if (a === 'claim') body.key = SY().cfg().key; if (a === 'register') body.invite = invite;
    const r = await fetch(SY().base() + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Erreur ' + r.status);
    if (a === 'register') { sessionStorage.removeItem('carnet-invite'); invite = null; }
    await SY().signIn({ ...j, claimed: a === 'claim' });
    const S = C().S();
    if (j.user.admin && !S.set.sports) { S.set.sports = ['gym', 'run', 'bike']; S.set.goalPace = S.set.goalPace || 270; S.set.zones = S.set.zones || { hr: [130, 162, 178, 194], pace: [393, 339, 304, 285, 268] }; S.set.obj = S.set.obj || "Être sec et musclé pour l'été, courir à 4:30/km, vélo de route (fan de Pogačar)."; S.set.gym = S.set.gym || 'On Air Bordeaux Bastide'; C().save(); }
    busy = false; C().render();
    await SY().run({ loud: true });
    C().render();
  } catch (x) { busy = false; err = x.message === 'Failed to fetch' ? 'Pas de connexion internet : la connexion demande du réseau la première fois.' : x.message; C().render(); }
});
function setup() {
  const S = C().S(), v = id => ((document.getElementById(id) || {}).value || '').trim(), sp = S.set._draftSports || ['gym', 'run'];
  if (!sp.length) { C().toast('Choisis au moins un sport'); return; }
  const prog = (document.querySelector('input[name=au-prog]:checked') || {}).value;
  if (sp.includes('gym')) {
    if (prog === 'beg') { S.program = beginner(); S.set.prSession = false; }
    else if (prog === 'none') { S.program = []; S.set.prSession = false; }
    else { S.program = [...C().defaultProgram(), C().prSession()]; S.set.prSession = true; }
  } else if (!(SY().cfg().user || {}).admin) { S.program = beginner(); S.set.prSession = false; }
  S.plans = []; S.set.sports = sp; delete S.set._draftSports;
  const by = parseInt(v('au-by')), h = parseInt(v('au-h')), w = parseFloat(v('au-w').replace(',', '.'));
  if (by > 1920 && by < 2020) S.body.birth = by; if (h > 120 && h < 230) S.body.h = h;
  if (w > 30 && w < 250 && Math.abs(w - C().body().w) > .01) S.body.weights = [...(S.body.weights || []), { t: Date.now(), kg: w }];
  const g = v('au-goal').match(/^(\d{1,2})[:'h.,](\d{2})$/); if (g) S.set.goalPace = +g[1] * 60 + +g[2];
  if (v('au-obj')) S.set.obj = v('au-obj').slice(0, 200);
  C().save(); C().go('guide'); C().toast('Ton profil est prêt 💪');
}
}
