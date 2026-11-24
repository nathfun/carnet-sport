'use strict';
/* Silhouette musculaire (face + dos) dessinée à la main. bodySvg('Pecs') surligne le muscle. */
{
// formes : [muscle, vue (f/b), type, ...attributs]
const E = (m, v, cx, cy, rx, ry, rot = 0) => ({ m, v, t: 'e', cx, cy, rx, ry, rot });
const R = (m, v, x, y, w, h, r = 6) => ({ m, v, t: 'r', x, y, w, h, r });
const SHAPES = [
  // face
  E('Épaules', 'f', 29, 50, 9, 8, -20), E('Épaules', 'f', 71, 50, 9, 8, 20),
  E('Pecs', 'f', 41, 60, 11, 8.5, 8), E('Pecs', 'f', 59, 60, 11, 8.5, -8),
  E('Biceps', 'f', 23, 72, 5.5, 11, 12), E('Biceps', 'f', 77, 72, 5.5, 11, -12),
  E('Avant-bras', 'f', 18, 96, 4.8, 13, 14), E('Avant-bras', 'f', 82, 96, 4.8, 13, -14),
  R('Abdos', 'f', 42, 70, 16, 38, 7), E('Abdos', 'f', 35, 88, 4, 13, 6), E('Abdos', 'f', 65, 88, 4, 13, -6),
  E('Quadriceps', 'f', 41, 142, 9, 25, 4), E('Quadriceps', 'f', 59, 142, 9, 25, -4),
  E('Mollets', 'f', 40, 192, 5.5, 16, 2), E('Mollets', 'f', 60, 192, 5.5, 16, -2),
  // dos
  E('Dos', 'b', 50, 44, 15, 6), E('Épaules', 'b', 29, 50, 9, 8, -20), E('Épaules', 'b', 71, 50, 9, 8, 20),
  E('Dos', 'b', 39, 72, 10.5, 18, 10), E('Dos', 'b', 61, 72, 10.5, 18, -10), R('Dos', 'b', 45, 88, 10, 20, 4),
  E('Triceps', 'b', 23, 72, 5.5, 11, 12), E('Triceps', 'b', 77, 72, 5.5, 11, -12),
  E('Avant-bras', 'b', 18, 96, 4.8, 13, 14), E('Avant-bras', 'b', 82, 96, 4.8, 13, -14),
  E('Fessiers', 'b', 42, 120, 10, 9), E('Fessiers', 'b', 58, 120, 10, 9),
  E('Ischios', 'b', 41, 150, 8.5, 20, 3), E('Ischios', 'b', 59, 150, 8.5, 20, -3),
  E('Mollets', 'b', 40, 189, 6.5, 15, 2), E('Mollets', 'b', 60, 189, 6.5, 15, -2)
];
// contour du corps (même pour les deux vues)
const OUTLINE = 'M50 6c7 0 12 5 12 12s-4 12-8 14v4c8 1 17 3 22 8 4 4 5 12 7 22l7 36c1 5-1 7-4 7-2 0-4-2-5-6l-7-30-1 18c4 14 6 28 6 44 0 12-1 22-3 33l-2 20c0 4-2 6-5 6s-5-2-5-6l-1-24c-1-12-2-26-5-38h-2c-3 12-4 26-5 38l-1 24c0 4-2 6-5 6s-5-2-5-6l-2-20c-2-11-3-21-3-33 0-16 2-30 6-44l-1-18-7 30c-1 4-3 6-5 6-3 0-5-2-4-7l7-36c2-10 3-18 7-22 5-5 14-7 22-8v-4c-4-2-8-7-8-14s5-12 12-12z';
const shape = (s, hot, idx) => {
  const cls = `mz ${hot ? 'hot' : ''}`, st = hot ? `style="animation-delay:${idx * 60}ms"` : '';
  return s.t === 'e' ? `<ellipse class="${cls}" ${st} data-muscle="${s.m}" cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}" transform="rotate(${s.rot} ${s.cx} ${s.cy})"/>` : `<rect class="${cls}" ${st} data-muscle="${s.m}" x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="${s.r}"/>`;
};
const fig = (v, muscles, dx) => `<g transform="translate(${dx} 0)"><path class="mbody" d="${OUTLINE}"/>${SHAPES.filter(s => s.v === v).map((s, i) => shape(s, muscles.includes(s.m), i)).join('')}</g>`;
window.bodySvg = (muscle, opts = {}) => {
  const ms = Array.isArray(muscle) ? muscle : [muscle];
  const backFirst = ['Dos', 'Triceps', 'Fessiers', 'Ischios'].some(m => ms.includes(m));
  const views = opts.one ? [backFirst ? 'b' : 'f'] : ['f', 'b'];
  const W = views.length * 104;
  return `<svg class="bodysvg ${opts.cls || ''}" viewBox="0 0 ${W} 222" role="img" aria-label="Muscle travaillé : ${ms.join(', ')}">${views.map((v, i) => fig(v, ms, i * 104 + 2)).join('')}</svg>`;
};
window.BODY_MUSCLES = [...new Set(SHAPES.map(s => s.m))];
}
