'use strict';
/* Silhouette anatomique (face + dos). bodySvg('Pecs') surligne le muscle. Formes du côté gauche, recopiées en miroir. */
{
// base du corps : membres en traits arrondis + tronc
const LIMBS = [[29, 42, 22, 78, 12], [21, 82, 17, 110, 9.5], [43, 114, 41, 162, 16], [41, 168, 40, 206, 10.5]];
const TORSO = 'M33 37C40 34 60 34 67 37L70 47C70 62 66 82 64 100L63 112C60 118 40 118 37 112L36 100C34 82 30 62 30 47Z';
const HEAD = '<ellipse cx="50" cy="16" rx="8.5" ry="10.5"/><rect x="45.5" y="24" width="9" height="11" rx="3"/>';
const FEET = '<ellipse cx="40" cy="210" rx="5" ry="3"/><ellipse cx="60" cy="210" rx="5" ry="3"/><ellipse cx="16" cy="114" rx="3.5" ry="4.5"/><ellipse cx="84" cy="114" rx="3.5" ry="4.5"/>';
// [muscle, chemin] — côté gauche (miroir auto) ; MID = centrés, dessinés une fois
const FRONT = [
  ['Épaules', 'M31 37C23 37 18 45 19 56C24 53 29 49 34 45Z'],
  ['Pecs', 'M49 40L35 42C30 46 30 56 35 60C41 63 47 62 49 58Z'],
  ['Biceps', 'M22 58C18 64 18 73 21 80C25 77 27 69 27 61Z'],
  ['Avant-bras', 'M20 83C16 91 15 101 16 109C19 109 22 100 24 86Z'],
  ['Abdos', 'M36 64C34 74 35 88 38 100L42 98C41 88 41 76 42 66Z'],
  ['Quadriceps', 'M38 116C34 128 34 146 38 160C42 162 46 160 48 150C50 137 49 124 48 116Z'],
  ['Mollets', 'M38 170C35 180 36 194 39 204C42 204 44 194 45 184C45 177 44 172 42 168Z']
];
const FRONT_MID = [['Abdos', '<rect x="43.2" y="63" width="6.3" height="8" rx="2"/><rect x="50.5" y="63" width="6.3" height="8" rx="2"/><rect x="43.2" y="72.5" width="6.3" height="8" rx="2"/><rect x="50.5" y="72.5" width="6.3" height="8" rx="2"/><rect x="43.2" y="82" width="6.3" height="8" rx="2"/><rect x="50.5" y="82" width="6.3" height="8" rx="2"/><path d="M43.5 91.5H56.5L55 104C52 107 48 107 45 104Z"/>']];
const BACK = [
  ['Épaules', 'M31 37C23 37 18 45 19 56C24 53 29 49 34 45Z'],
  ['Dos', 'M36 47C31 58 33 75 41 88L48 85L47 60Z'],
  ['Triceps', 'M22 57C18 65 18 73 21 80C25 76 27 67 26 59Z'],
  ['Avant-bras', 'M20 83C16 91 15 101 16 109C19 109 22 100 24 86Z'],
  ['Fessiers', 'M38 105C33 112 35 125 44 127C49 127 50 117 49 108Z'],
  ['Ischios', 'M38 130C35 141 36 152 40 160C44 161 47 151 47 141C47 135 46 131 44 129Z'],
  ['Mollets', 'M37 167C33 177 35 189 40 195C44 193 46 181 45 171Z']
];
const BACK_MID = [['Dos', '<path d="M50 29L38 39L44 54L50 58L56 54L62 39Z"/><rect x="45" y="86" width="10" height="18" rx="3"/>']];
const mirror = s => `<g transform="translate(100 0) scale(-1 1)">${s}</g>`;
function view(front, ms) {
  const sh = front ? FRONT : BACK, mid = front ? FRONT_MID : BACK_MID;
  const cls = m => `mz${ms.includes(m) ? ' hot' : ''}`;
  const left = sh.map(([m, d]) => `<path class="${cls(m)}" data-muscle="${m}" d="${d}"/>`).join('');
  const base = `<g class="mbody">${HEAD}<path d="${TORSO}"/>${LIMBS.map(([x1, y1, x2, y2, w]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${w}"/><line x1="${100 - x1}" y1="${y1}" x2="${100 - x2}" y2="${y2}" stroke-width="${w}"/>`).join('')}${FEET}</g>`;
  return base + left + mirror(left) + mid.map(([m, g]) => `<g class="${cls(m)}" data-muscle="${m}">${g}</g>`).join('');
}
window.bodySvg = (muscle, opts = {}) => {
  const ms = (Array.isArray(muscle) ? muscle : [muscle]).filter(Boolean);
  const backFirst = ['Dos', 'Triceps', 'Fessiers', 'Ischios'].some(m => ms.includes(m));
  const views = opts.one ? [!backFirst] : [true, false];
  return `<svg class="bodysvg ${opts.cls || ''}" viewBox="0 0 ${views.length * 108 - 8} 216" role="img" aria-label="${ms.length ? 'Muscle travaillé : ' + ms.join(', ') : 'Silhouette'}">${views.map((f, i) => `<g transform="translate(${i * 108} 0)">${view(f, ms)}</g>`).join('')}</svg>`;
};
window.BODY_MUSCLES = ['Pecs', 'Dos', 'Épaules', 'Biceps', 'Triceps', 'Avant-bras', 'Abdos', 'Quadriceps', 'Ischios', 'Fessiers', 'Mollets'];
}
