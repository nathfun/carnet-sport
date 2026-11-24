'use strict';
/* Import de sorties enregistrées par une montre ou une appli : .gpx, .tcx, .fit.
   Le fichier est lu sur l'appareil ; l'app en tire la même analyse qu'une sortie Strava
   (carte, temps au km, meilleurs efforts, courbes, zones). Le détail reste privé. */
{
const C = () => window.CARNET;
const FIT_EPOCH = 631065600;
const rad = x => x * Math.PI / 180;
const hav = (a, b) => { const R = 6371008.8, dLa = rad(b[0] - a[0]), dLo = rad(b[1] - a[1]), h = Math.sin(dLa / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };

/* ---------- GPX et TCX (XML) ---------- */
const kids = (el, name) => [...el.getElementsByTagName('*')].filter(x => x.localName === name);
const kid = (el, name) => kids(el, name)[0];
const txt = (el, name) => { const k = el && kid(el, name); return k ? k.textContent.trim() : ''; };
function parseGPX(doc) {
  const pts = kids(doc, 'trkpt').concat(kids(doc, 'rtept')).map(p => ({ t: Date.parse(txt(p, 'time')), lat: +p.getAttribute('lat'), lon: +p.getAttribute('lon'), ele: parseFloat(txt(p, 'ele')), hr: parseInt(txt(p, 'hr')), cad: parseInt(txt(p, 'cad')) }));
  const trk = kid(doc, 'trk'), name = (trk && txt(trk, 'name')) || txt(kid(doc, 'metadata') || doc, 'name');
  return { pts, name, type: trk ? txt(trk, 'type') : '' };
}
function parseTCX(doc) {
  const act = kid(doc, 'Activity'), pts = kids(doc, 'Trackpoint').map(p => { const pos = kid(p, 'Position'), hr = kid(p, 'HeartRateBpm'); return { t: Date.parse(txt(p, 'Time')), lat: pos ? +txt(pos, 'LatitudeDegrees') : NaN, lon: pos ? +txt(pos, 'LongitudeDegrees') : NaN, ele: parseFloat(txt(p, 'AltitudeMeters')), dist: parseFloat(txt(p, 'DistanceMeters')), hr: hr ? parseInt(txt(hr, 'Value')) : NaN, cad: parseInt(txt(p, 'Cadence') || txt(p, 'RunCadence')) }; });
  return { pts, name: act ? txt(act, 'Notes') : '', type: act ? act.getAttribute('Sport') || '' : '' };
}

/* ---------- FIT (binaire Garmin) ---------- */
function parseFIT(buf) {
  const dv = new DataView(buf), hs = dv.getUint8(0), size = dv.getUint32(4, true);
  if (String.fromCharCode(dv.getUint8(8), dv.getUint8(9), dv.getUint8(10), dv.getUint8(11)) !== '.FIT') throw new Error('Fichier FIT invalide');
  const defs = {}, pts = [], end = Math.min(buf.byteLength, hs + size); let i = hs, lastTs = 0, sport = '', sess = {};
  const read = (o, bt, sz, le) => {
    const base = bt & 0x1f;
    if (sz === 1) { const v = base === 1 ? dv.getInt8(o) : dv.getUint8(o); return (base === 1 ? v === 0x7f : v === 0xff) ? null : v; }
    if (sz === 2) { const v = base === 3 ? dv.getInt16(o, le) : dv.getUint16(o, le); return (base === 3 ? v === 0x7fff : v === 0xffff) ? null : v; }
    if (sz === 4) { if (base === 8) { const v = dv.getFloat32(o, le); return isFinite(v) ? v : null; } const v = base === 5 ? dv.getInt32(o, le) : dv.getUint32(o, le); return (base === 5 ? v === 0x7fffffff : v === 0xffffffff) ? null : v; }
    return null;
  };
  while (i < end) {
    const h = dv.getUint8(i++);
    if (h & 0x80) { // en-tête compressé (horodatage)
      const lt = (h >> 5) & 3, off = h & 0x1f, d = defs[lt]; if (!d) break;
      let ts = (lastTs & ~0x1f) + off; if (off < (lastTs & 0x1f)) ts += 0x20; lastTs = ts;
      const rec = { 253: ts }; let o = i; for (const f of d.f) { rec[f[0]] = read(o, f[2], f[1], d.le); o += f[1]; } i += d.len;
      handle(d.g, rec); continue;
    }
    const lt = h & 0x0f;
    if (h & 0x40) { // définition
      const le = dv.getUint8(i + 1) === 0, g = dv.getUint16(i + 2, le), nf = dv.getUint8(i + 4); let o = i + 5; const f = []; let len = 0;
      for (let k = 0; k < nf; k++) { f.push([dv.getUint8(o), dv.getUint8(o + 1), dv.getUint8(o + 2)]); len += dv.getUint8(o + 1); o += 3; }
      if (h & 0x20) { const nd = dv.getUint8(o); o++; for (let k = 0; k < nd; k++) { len += dv.getUint8(o + 1); o += 3; } }
      defs[lt] = { le, g, f, len }; i = o; continue;
    }
    const d = defs[lt]; if (!d) break;
    const rec = {}; let o = i; for (const f of d.f) { rec[f[0]] = f[1] <= 4 ? read(o, f[2], f[1], d.le) : null; o += f[1]; } i += d.len;
    if (rec[253] != null) lastTs = rec[253];
    handle(d.g, rec);
  }
  function handle(g, r) {
    if (g === 20) {
      const sc = 180 / 2 ** 31;
      pts.push({ t: (r[253] + FIT_EPOCH) * 1000, lat: r[0] != null ? r[0] * sc : NaN, lon: r[1] != null ? r[1] * sc : NaN, ele: r[78] != null ? r[78] / 5 - 500 : r[2] != null ? r[2] / 5 - 500 : NaN, hr: r[3] ?? NaN, cad: r[4] ?? NaN, dist: r[5] != null ? r[5] / 100 : NaN });
    } else if (g === 18) { if (r[5] != null) sport = r[5]; sess = { asc: r[22], hrAvg: r[16], hrMax: r[17], cal: r[11] }; }
    else if (g === 12 && r[0] != null && !sport) sport = r[0];
  }
  return { pts, name: '', type: sport === 1 ? 'running' : sport === 2 ? 'cycling' : '', sess };
}

/* ---------- du tracé à l'analyse ---------- */
function build(raw, fileName) {
  const P = raw.pts.filter(p => isFinite(p.t)).sort((a, b) => a.t - b.t);
  if (P.length < 10) throw new Error('Pas assez de points GPS dans ce fichier.');
  // distance cumulée
  let D = 0; for (let k = 0; k < P.length; k++) { const p = P[k];
    if (isFinite(p.dist)) D = Math.max(D, p.dist); else if (k && isFinite(p.lat) && isFinite(P[k - 1].lat)) D += hav([P[k - 1].lat, P[k - 1].lon], [p.lat, p.lon]);
    p.d = D; }
  const t0 = P[0].t, T = P.map(p => Math.round((p.t - t0) / 1000)), Dm = P.map(p => p.d), n = P.length;
  if (Dm[n - 1] < 200) throw new Error('Trop peu de distance dans ce fichier.');
  const V = P.map((_, k) => { const a = Math.max(0, k - 3), b = Math.min(n - 1, k + 3); return T[b] > T[a] ? (Dm[b] - Dm[a]) / (T[b] - T[a]) : 0; });
  const avgV = Dm[n - 1] / Math.max(1, T[n - 1]);
  const ty = (raw.type || '').toLowerCase(), run = /run|course|^1$|walk|hik/.test(ty) ? true : /cycl|bik|ride|vélo|velo|^2$/.test(ty) ? false : avgV * 3.6 < 15;
  const thr = run ? 0.8 : 1.5; let moving = 0; const MV = T.map((t, k) => { const ok = k && V[k] > thr && T[k] - T[k - 1] < 60; if (ok) moving += T[k] - T[k - 1]; return ok; });
  // dénivelé (altitude lissée)
  const E = P.map(p => p.ele), hasE = E.filter(isFinite).length > n / 2, Es = hasE ? E.map((_, k) => { let s = 0, c = 0; for (let j = Math.max(0, k - 4); j <= Math.min(n - 1, k + 4); j++) if (isFinite(E[j])) { s += E[j]; c++; } return c ? s / c : 0; }) : [];
  let gain = 0; for (let k = 1; k < Es.length; k++) if (Es[k] > Es[k - 1]) gain += Es[k] - Es[k - 1];
  if (raw.sess && raw.sess.asc) gain = raw.sess.asc;
  const HR = P.map(p => isFinite(p.hr) && p.hr > 30 ? p.hr : null), hasHR = HR.filter(x => x).length > n / 3;
  let hs = 0, hn = 0, hmax = 0; if (hasHR) for (let k = 1; k < n; k++) if (HR[k]) { const dt = Math.min(30, T[k] - T[k - 1]); hs += HR[k] * dt; hn += dt; hmax = Math.max(hmax, HR[k]); }
  const CAD = P.map(p => isFinite(p.cad) ? p.cad : null), hasCad = CAD.filter(x => x).length > n / 3, cadAvg = hasCad ? Math.round(CAD.filter(x => x).reduce((a, b) => a + b, 0) / CAD.filter(x => x).length * (run && CAD.filter(x => x).every(x => x < 120) ? 2 : 1)) : null;
  // temps au km (course) ou par 5 km (vélo)
  const step = run ? 1000 : 5000, splits = []; let i0 = 0, mov = 0, s1 = 0, s2 = 0, next = step;
  for (let k = 1; k < n; k++) { const dt = T[k] - T[k - 1]; if (MV[k]) mov += dt; if (HR[k]) { s1 += HR[k] * Math.min(30, dt); s2 += Math.min(30, dt); }
    if (Dm[k] >= next || k === n - 1) { splits.push({ km: Math.round(Dm[k] - Dm[i0]) / 1000, sec: Math.max(1, mov), elev: hasE ? Math.round(Es[k] - Es[i0]) : 0, hr: s2 ? Math.round(s1 / s2) : null }); i0 = k; mov = 0; s1 = 0; s2 = 0; next += step; } }
  // meilleurs efforts (course)
  const efforts = [];
  if (run) for (const [name, dist] of [['400m', 400], ['1/2 mile', 805], ['1K', 1000], ['1 mile', 1609], ['5K', 5000], ['10K', 10000], ['Semi-marathon', 21097]]) {
    if (Dm[n - 1] < dist) continue; let best = Infinity, j = 0;
    for (let k = 0; k < n; k++) { while (j < n && Dm[j] - Dm[k] < dist) j++; if (j >= n) break; const ex = Dm[j] - Dm[k], tt = (T[j] - T[k]) * dist / ex; if (tt < best) best = tt; }
    if (isFinite(best)) efforts.push({ name, sec: Math.round(best), dist, pr: 0 });
  }
  // échantillonnage (900 points)
  const keep = Math.max(1, Math.ceil(n / 900)), idx = []; for (let k = 0; k < n; k += keep) idx.push(k); if (idx.at(-1) !== n - 1) idx.push(n - 1);
  const hasLL = P.filter(p => isFinite(p.lat)).length > n / 2;
  const start = t0, elapsed = T[n - 1], mv = Math.max(moving, Math.round(elapsed * .5));
  const detail = { id: '', run, name: '', type: run ? 'Run' : 'Ride', start, dist: Math.round(Dm[n - 1]), moving: mv, elapsed, elev: Math.round(gain), hrAvg: hn ? Math.round(hs / hn) : null, hrMax: hmax || null, cad: cadAvg, cal: raw.sess && raw.sess.cal || null, vMax: Math.max(...V), watts: null, desc: '', splits: splits.filter(x => x.km > 0.05), efforts,
    s: { t: idx.map(k => T[k]), d: idx.map(k => Math.round(Dm[k])), v: idx.map(k => Math.round(V[k] * 100) / 100), hr: hasHR ? idx.map(k => HR[k] || HR[Math.max(0, k - 1)] || 0) : [], alt: hasE ? idx.map(k => Math.round(Es[k] * 10) / 10) : [], cad: [], ll: hasLL ? idx.map(k => [Math.round(P[k].lat * 1e5) / 1e5, Math.round(P[k].lon * 1e5) / 1e5]) : [] } };
  const hour = new Date(start).getHours(), when = hour < 12 ? 'le matin' : hour < 18 ? "l'après-midi" : 'en soirée';
  const name = (raw.name || '').trim() || (run ? 'Course à pied ' : 'Sortie vélo ') + when;
  return { detail, name };
}

/* ---------- import ---------- */
async function importFiles(files) {
  const S = C().S(); let ok = 0, dup = 0; const errs = [];
  for (const f of files) {
    try {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      let raw;
      if (ext === 'fit') raw = parseFIT(await f.arrayBuffer());
      else { const doc = new DOMParser().parseFromString(await f.text(), 'application/xml'); if (doc.getElementsByTagName('parsererror').length) throw new Error('Fichier illisible'); raw = ext === 'tcx' || kid(doc, 'TrainingCenterDatabase') ? parseTCX(doc) : parseGPX(doc); }
      const { detail: d, name } = build(raw, f.name);
      if (S.log.some(l => (l.kind === 'run' || l.kind === 'bike') && Math.abs(l.start - d.start) < 120e3)) { dup++; continue; }
      const id = 'imp_' + Math.round(d.start / 1000).toString(36) + Math.round(d.dist).toString(36); d.id = id; d.name = name;
      const km = Math.round(d.dist / 10) / 100, kind = d.run ? 'run' : 'bike';
      const e = { id, kind, name, start: d.start, end: d.start + d.elapsed * 1000, km, sec: d.moving, elev: d.elev, ex: [], vol: 0, src: 'file' };
      if (d.hrAvg) e.hr = d.hrAvg; if (d.run) e.pace = Math.round(d.moving / km); else e.kmh = Math.round(km / (d.moving / 3600) * 10) / 10;
      await C().media.ready(); await C().media.tx(st => st.add({ ex: 'act:' + id, blob: new Blob([JSON.stringify(d)], { type: 'application/json' }), type: 'application/json', t: Date.now() }));
      S.log.push(e); ok++;
    } catch (x) { errs.push(f.name + ' : ' + x.message); }
  }
  S.log.sort((a, b) => a.start - b.start); C().refreshRec && C().refreshRec(); C().save(); C().closeSheet(); C().render();
  C().toast([ok ? `${ok} sortie${ok > 1 ? 's' : ''} importée${ok > 1 ? 's' : ''} ✓` : '', dup ? `${dup} déjà présente${dup > 1 ? 's' : ''}` : '', errs.length ? `${errs.length} fichier${errs.length > 1 ? 's' : ''} illisible${errs.length > 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ') || 'Rien à importer');
  if (errs.length) console.warn(errs);
  try { const fresh = C().checkBadges ? C().checkBadges() : []; if (fresh.length) window.showBadge(fresh); } catch (_) { }
}
async function detailOf(id) {
  await C().media.ready(); const L = await C().media.list('act:' + id); if (!L.length) return null;
  return JSON.parse(await L[0].blob.text());
}
document.addEventListener('change', e => { const t = e.target; if (!t.dataset || !t.dataset.imp || !t.files.length || !window.CARNET) return; importFiles([...t.files]); t.value = ''; });
window.FILEIMP = { importFiles, detailOf, parseFIT, parseGPX, parseTCX, build };
}
