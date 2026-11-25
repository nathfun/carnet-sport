'use strict';
/* Fin de repos signalée par une notification quand l'app est en arrière-plan (Insta, écran verrouillé…).
   Le serveur programme l'alerte : il faut du réseau au moment où le repos démarre ET à la fin. */
{
const C = () => window.CARNET, SY = () => window.SYNC;
const LS = 'carnet-push';
const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
const enabled = () => { try { return localStorage.getItem(LS) === '1' && Notification.permission === 'granted'; } catch (_) { return false; } };
const u8 = s => { const p = '='.repeat((4 - s.length % 4) % 4), b = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(b, c => c.charCodeAt(0)); };

async function enable() {
  if (!SY().on()) throw new Error('Il faut être connecté à ton compte.');
  if (!supported()) throw new Error(isIOS() ? 'Ajoute d\'abord l\'app à l\'écran d\'accueil (Partager → Sur l\'écran d\'accueil), puis active ici. iOS 16.4 minimum.' : 'Ton navigateur ne gère pas les notifications.');
  if (isIOS() && !standalone()) throw new Error('Ouvre l\'app depuis l\'écran d\'accueil pour activer les notifications (pas depuis Safari).');
  const perm = await Notification.requestPermission(); if (perm !== 'granted') throw new Error('Notifications refusées. Tu peux les autoriser dans Réglages de l\'iPhone → Notifications → Carnet sport.');
  const reg = await navigator.serviceWorker.ready, { key } = await SY().get('/push/key');
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: u8(key) });
  await SY().post('/push/sub', { sub: sub.toJSON() });
  localStorage.setItem(LS, '1');
}
async function disable() {
  localStorage.removeItem(LS);
  try { const reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription(); if (sub) { await SY().post('/push/unsub', { endpoint: sub.endpoint }); await sub.unsubscribe(); } } catch (_) { }
}
async function setMsg(m) { try { const c = await caches.open('carnet-push'); await c.put('/__push_msg', new Response(JSON.stringify(m), { headers: { 'Content-Type': 'application/json' } })); } catch (_) { } }

/* suivi du repos (appelé chaque seconde par le chrono du mode salle) */
let lastSig = '', scheduled = false, cancelledEnd = false;
function watch(D) {
  if (!enabled() || !SY().on()) return;
  const r = D && D.rest, sig = r ? r.since + ':' + r.target : '';
  if (sig !== lastSig) {
    lastSig = sig; cancelledEnd = false;
    if (r) {
      const end = r.since + r.target * 1000;
      if (end - Date.now() > 6000 && navigator.onLine) {
        const cur = D.ex && D.ex[D.cur], nextSet = cur ? (cur.sets || []).findIndex(s => !s.ok) : -1;
        setMsg({ title: '⏱️ Repos terminé', body: cur ? `${cur.n}${nextSet >= 0 ? ' · série ' + (nextSet + 1) : ''} : c'est reparti !` : "C'est reparti !" });
        SY().post('/push/schedule', { at: end }).then(() => { scheduled = true; }).catch(() => { });
      }
    } else if (scheduled) { scheduled = false; SY().post('/push/cancel', {}).catch(() => { }); }
    return;
  }
  // l'app est à l'écran à la fin du repos : le ding suffit, on annule la notification
  if (r && scheduled && !cancelledEnd && document.visibilityState === 'visible' && r.since + r.target * 1000 - Date.now() < 3000) { cancelledEnd = true; scheduled = false; SY().post('/push/cancel', {}).catch(() => { }); }
}

function html() {
  if (!SY().on()) return '';
  const on = enabled();
  return `<div class="sec">Fin de repos hors de l'app</div>
  <p class="tiny">Une notification quand ton repos est fini, même si tu es sur une autre app ou écran verrouillé. ${isIOS() ? 'Sur iPhone : l\'app doit être sur l\'écran d\'accueil (iOS 16.4 minimum). ' : ''}Il faut du réseau (4G ou wifi) : sans réseau, seul le ding dans l'app fonctionne.</p>
  <div class="row"><button class="${on ? '' : 'p'} grow" data-push="${on ? 'off' : 'on'}">${on ? '🔕 Désactiver' : '🔔 Activer les notifications de repos'}</button>${on ? '<button class="grow" data-push="test">Tester</button>' : ''}</div>`;
}
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-push]'); if (!b || !window.CARNET) return;
  try {
    if (b.dataset.push === 'on') { b.disabled = true; await enable(); C().toast('Notifications de repos activées 🔔'); C().render(); }
    else if (b.dataset.push === 'off') { await disable(); C().toast('Notifications de repos désactivées'); C().render(); }
    else { await setMsg({ title: '🔔 Test réussi', body: 'Tu seras prévenu à la fin de tes repos.' }); const r = await SY().post('/push/test', {}); C().toast(r.sent ? 'Notification envoyée : elle arrive dans quelques secondes' : 'Aucun appareil abonné : désactive puis réactive'); }
  } catch (x) { b.disabled = false; C().toast(x.message === 'Failed to fetch' ? 'Pas de réseau' : x.message); }
});
window.PUSH = { watch, html, enabled };
}
