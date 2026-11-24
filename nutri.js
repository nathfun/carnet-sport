'use strict';
/* Zoom nutrition : fiche aliment par portion, bon / à surveiller, comparateur, aliments perso.
   Valeurs moyennes pour 100 g, indicatives (ordre de grandeur des tables de composition). */
{
const C = () => window.CARNET;
const T2 = window.TOOLS2 = window.TOOLS2 || {};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fr = (v, d = 0) => Number(v).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
const fn = v => fr(v, v < 10 && v % 1 ? 1 : 0);
// nom|catégorie|portion g|portion|kcal|prot|gluc|sucres|lip|AGS|fibres|sel|Ca|Fe|Mg|K|vitC|vitD|B12
const RAW = `Œuf entier cuit|Œufs et laitiers|50|1 œuf|145|12.5|0.7|0.3|10|2.8|0|0.35|50|1.8|11|130|0|1.9|1.1
Blanc de poulet cuit|Viandes|120|1 filet|150|31|0|0|2.5|0.7|0|0.18|10|0.6|30|330|0|0.1|0.3
Escalope de dinde cuite|Viandes|120|1 escalope|135|30|0|0|1.5|0.5|0|0.15|10|0.8|30|330|0|0.1|0.4
Steak haché 5 % cuit|Viandes|100|1 steak|170|27|0|0|7|3|0|0.2|10|2.8|22|350|0|0.1|2.5
Entrecôte de bœuf|Viandes|150|1 pièce|220|26|0|0|13|5.5|0|0.15|8|2.5|22|330|0|0.1|2
Filet mignon de porc cuit|Viandes|120|1 portion|160|28|0|0|5|1.8|0|0.15|8|1|28|420|0|0.5|0.7
Jambon blanc|Charcuterie|45|1 tranche|115|20|1|0.8|3.5|1.2|0|1.9|8|0.8|20|300|0|0.3|0.4
Saucisson sec|Charcuterie|30|5 tranches|420|26|2|1|35|13|0|4.3|15|1.5|20|350|0|0.5|1.5
Lardons|Charcuterie|50|1 portion|270|15|0.5|0.5|23|8.5|0|2.3|8|0.6|15|280|0|0.6|0.7
Saumon cuit|Poissons|120|1 pavé|200|23|0|0|12|2.3|0|0.15|10|0.4|30|400|0|9|3
Thon au naturel|Poissons|100|1 petite boîte|115|26|0|0|1|0.3|0|0.8|12|1.2|28|250|0|2|2.5
Sardines à l'huile|Poissons|85|1 boîte|210|24|0|0|13|2.8|0|0.8|300|2.3|35|370|0|5|9
Cabillaud cuit|Poissons|120|1 filet|100|23|0|0|0.8|0.2|0|0.25|15|0.3|30|350|0|1|1
Crevettes cuites|Poissons|100|1 portion|100|21|0|0|1.3|0.3|0|1.5|60|0.6|35|200|0|0|1.5
Tofu nature|Végétal|100|1 portion|125|13|1.5|0.6|7.5|1.2|1|0.02|350|2.5|60|150|0|0|0
Houmous|Végétal|50|2 c. à soupe|300|7|12|1|25|3|5|1|40|2|50|230|0|0|0
Lentilles cuites|Féculents|200|1 assiette|115|9|16|0.5|0.5|0.1|8|0.01|20|2.5|35|300|1|0|0
Pois chiches cuits|Féculents|150|1 portion|140|8|17|1|2.5|0.3|7|0.02|45|2.2|40|250|1|0|0
Haricots rouges cuits|Féculents|150|1 portion|115|8|14|0.5|0.5|0.1|8|0.01|30|2|40|350|1|0|0
Riz blanc cuit|Féculents|180|1 assiette|130|2.7|28|0.1|0.3|0.1|0.4|0|4|0.2|12|35|0|0|0
Riz complet cuit|Féculents|180|1 assiette|125|2.8|25|0.3|1|0.2|1.6|0|8|0.5|45|80|0|0|0
Pâtes cuites|Féculents|200|1 assiette|150|5.5|29|0.6|0.9|0.2|1.8|0|8|0.5|20|50|0|0|0
Pâtes complètes cuites|Féculents|200|1 assiette|140|5.8|26|0.7|1.2|0.2|4|0|15|1.2|40|100|0|0|0
Pomme de terre cuite|Féculents|200|2 moyennes|80|2|17|0.8|0.1|0|1.8|0.01|7|0.4|22|380|8|0|0
Patate douce cuite|Féculents|200|1 moyenne|85|1.6|18|6|0.1|0|2.5|0.04|30|0.6|20|300|12|0|0
Quinoa cuit|Féculents|150|1 portion|120|4.4|21|0.9|1.9|0.2|2.8|0.01|17|1.5|64|170|0|0|0
Flocons d'avoine|Céréales|50|1 bol|370|13|59|1|7|1.3|10|0.01|50|4|140|380|0|0|0
Muesli|Céréales|50|1 bol|370|9|62|20|7|1.5|7|0.1|50|3|90|400|0|0|0
Galette de riz|Céréales|10|1 galette|385|8|80|0.6|3|0.6|4|0.05|10|1.2|120|250|0|0|0
Pain complet|Pains|60|2 tranches|240|9|43|3|3|0.6|7|1.1|30|2.5|80|250|0|0|0
Baguette|Pains|60|1/4 de baguette|270|9|56|2.5|1.3|0.3|3|1.4|20|1.2|25|130|0|0|0
Pain de mie|Pains|50|2 tranches|270|8|48|5|4|0.8|3|1.2|60|1.5|25|120|0|0|0
Croissant|Viennoiseries|60|1 croissant|420|8|45|10|22|14|2|1|40|1.2|20|130|0|0|0
Lait demi-écrémé|Œufs et laitiers|250|1 verre|46|3.3|4.8|4.8|1.6|1|0|0.1|120|0|11|150|1|0|0.4
Yaourt nature|Œufs et laitiers|125|1 pot|60|4.3|5|5|1.5|1|0|0.13|150|0.1|14|190|1|0|0.3
Skyr nature|Œufs et laitiers|150|1 pot|60|10.5|3.8|3.8|0.2|0.1|0|0.1|130|0|12|160|0|0|0.4
Fromage blanc 0 %|Œufs et laitiers|100|1 portion|50|7.5|4|4|0.1|0.1|0|0.1|110|0|10|150|0|0|0.4
Emmental|Fromages|30|1 portion|380|28|0.5|0.5|29|18|0|0.5|1000|0.2|35|100|0|0.6|2.5
Comté|Fromages|30|1 portion|415|28|0.5|0.5|33|21|0|0.8|1000|0.2|35|100|0|0.4|1.6
Mozzarella|Fromages|60|1/2 boule|250|18|1|1|19|12|0|0.5|400|0.2|20|80|0|0.4|1.5
Camembert|Fromages|30|1 portion|290|20|0.5|0.5|23|15|0|1.5|350|0.2|20|150|0|0.4|1.3
Beurre|Matières grasses|10|1 noisette|745|0.7|0.6|0.6|82|54|0|0.03|20|0|2|25|0|0.9|0.2
Huile d'olive|Matières grasses|10|1 c. à soupe|900|0|0|0|100|15|0|0|1|0.5|0|1|0|0|0
Huile de colza|Matières grasses|10|1 c. à soupe|900|0|0|0|100|7.5|0|0|0|0|0|0|0|0|0
Avocat|Fruits|100|1/2 avocat|170|1.8|1|0.7|17|2.5|5|0.01|12|0.5|28|450|9|0|0
Amandes|Oléagineux|30|1 poignée|610|21|8|4|52|4|11|0.01|260|3.7|270|720|0|0|0
Noix|Oléagineux|30|1 poignée|700|15|7|2.6|65|6|6.5|0.01|90|2.7|160|440|1|0|0
Noix de cajou|Oléagineux|30|1 poignée|600|18|27|6|48|9|3.5|0.03|40|6|260|650|0|0|0
Beurre de cacahuète|Oléagineux|20|1 c. à soupe|620|25|13|6|50|9|7|0.6|45|1.8|170|650|0|0|0
Banane|Fruits|120|1 banane|90|1.1|20|15|0.3|0.1|2.6|0|6|0.3|30|360|9|0|0
Pomme|Fruits|150|1 pomme|53|0.3|11.5|10|0.2|0|2|0|5|0.1|5|110|5|0|0
Orange|Fruits|150|1 orange|45|0.9|8.5|8.5|0.2|0|2.2|0|40|0.1|11|180|50|0|0
Kiwi|Fruits|75|1 kiwi|60|1.1|11|9|0.5|0.1|3|0|35|0.3|17|310|85|0|0
Fraises|Fruits|150|1 barquette|35|0.7|6|5|0.3|0|1.8|0|15|0.4|13|160|60|0|0
Myrtilles|Fruits|100|1 portion|55|0.7|11|10|0.3|0|2.5|0|6|0.3|6|80|10|0|0
Dattes|Fruits secs|30|4 dattes|285|2.5|65|63|0.4|0.1|7|0.01|60|0.9|50|650|0|0|0
Raisins secs|Fruits secs|30|1 poignée|300|3|68|60|0.5|0.1|4|0.03|50|1.9|32|750|2|0|0
Brocoli cuit|Légumes|150|1 portion|30|2.5|3|1.5|0.4|0.1|3|0.03|45|0.7|20|200|60|0|0
Épinards cuits|Légumes|150|1 portion|25|3|1|0.5|0.4|0.1|2.5|0.1|140|2.5|70|450|10|0|0
Haricots verts cuits|Légumes|150|1 portion|30|1.9|4|1.5|0.2|0|3.5|0.01|45|0.8|20|200|8|0|0
Carotte crue|Légumes|100|1 carotte|35|0.8|6.5|5|0.2|0|2.7|0.07|30|0.2|11|280|4|0|0
Tomate|Légumes|120|1 tomate|20|0.9|3|2.6|0.2|0|1.2|0.01|9|0.2|10|240|14|0|0
Courgette cuite|Légumes|150|1 portion|20|1.2|2.5|2|0.3|0.1|1.3|0|20|0.3|20|260|10|0|0
Salade verte|Légumes|50|1 bol|15|1.2|1.5|0.8|0.2|0|1.3|0.01|35|0.8|11|250|5|0|0
Champignons de Paris|Légumes|100|1 portion|25|3|1|0.5|0.3|0|2.5|0.01|5|0.4|10|350|2|0.2|0
Petits pois cuits|Légumes|150|1 portion|75|5|9|3|0.5|0.1|6|0|25|1.4|25|250|10|0|0
Maïs doux|Légumes|100|1 portion|95|3|16|4|1.5|0.2|3|0.3|5|0.5|25|250|5|0|0
Chocolat noir 70 %|Sucré|20|2 carrés|580|8|33|28|43|26|11|0.02|70|11|200|700|0|0|0
Chocolat au lait|Sucré|20|2 carrés|540|7|56|54|31|19|2|0.2|200|1.5|60|400|0|0|0.4
Pâte à tartiner|Sucré|20|1 c. à soupe|540|6|57|56|31|10|3.5|0.1|100|2|60|400|0|0|0
Miel|Sucré|15|1 c. à soupe|320|0.4|80|80|0|0|0|0.01|5|0.4|2|50|0|0|0
Confiture|Sucré|20|1 c. à soupe|250|0.4|60|55|0.1|0|1|0|10|0.3|4|80|5|0|0
Pizza margherita|Plats|300|1/2 pizza|240|10|29|3|9|4|2|1.2|180|1.2|25|180|2|0|0.3
Burger classique|Plats|220|1 burger|250|13|24|5|11|4.5|1.5|1.2|80|2|25|250|1|0|1
Frites|Plats|130|1 portion moyenne|300|3.5|37|0.5|15|1.5|3.5|0.5|12|0.8|35|600|5|0|0
Sushis saumon|Plats|200|6 pièces|150|6|27|5|2|0.5|0.5|0.8|10|0.4|15|100|0|1.5|0.6
Kebab|Plats|350|1 sandwich|215|12|21|2|9|3.5|1.5|1.2|50|1.4|20|250|3|0|1
Lasagnes bolognaise|Plats|300|1 part|150|8|13|3|7|3|1|0.8|90|1|20|200|3|0|0.5
Whey protéine|Compléments|30|1 dose|380|78|7|5|5|3|0|0.5|450|1|150|500|0|0|1
Barre protéinée|Compléments|60|1 barre|360|33|33|5|11|6|8|0.5|150|1|60|200|0|0|0
Soda|Boissons|330|1 canette|42|0|10.6|10.6|0|0|0|0.01|2|0|1|2|0|0|0
Jus d'orange|Boissons|250|1 verre|45|0.7|10|9|0.1|0|0.3|0|10|0.1|10|180|35|0|0
Bière|Boissons|250|1 demi|43|0.4|3.5|0.2|0|0|0|0.01|5|0|8|30|0|0|0
Boisson amande|Boissons|250|1 verre|20|0.5|2.5|2.3|1.1|0.1|0.2|0.1|120|0.2|5|30|0|0.8|0.4`;
const K = ['kcal', 'p', 'g', 'su', 'l', 'ags', 'fi', 'sel', 'ca', 'fe', 'mg', 'k', 'vc', 'vd', 'b12'];
const BASE = RAW.split('\n').map((l, i) => { const a = l.split('|'); const o = { id: 'f' + i, n: a[0], cat: a[1], pg: +a[2], pl: a[3] }; K.forEach((k, j) => o[k] = +a[4 + j]); return o; });
const EMO = { 'Œufs et laitiers': '🥛', Viandes: '🍗', Charcuterie: '🥓', Poissons: '🐟', Végétal: '🌱', Féculents: '🍚', Céréales: '🥣', Pains: '🍞', Viennoiseries: '🥐', Fromages: '🧀', 'Matières grasses': '🫒', Fruits: '🍎', Oléagineux: '🥜', 'Fruits secs': '🍇', Légumes: '🥦', Sucré: '🍫', Plats: '🍕', Compléments: '💪', Boissons: '🥤', 'Mes aliments': '⭐' };
// [clé, nom, unité, repère du jour, type] ; type : g = bon à avoir, w = à surveiller
const NUT = [['p', 'Protéines', 'g', 0, 'g'], ['fi', 'Fibres', 'g', 30, 'g'], ['ca', 'Calcium', 'mg', 950, 'g'], ['fe', 'Fer', 'mg', 11, 'g'], ['mg', 'Magnésium', 'mg', 420, 'g'], ['k', 'Potassium', 'mg', 3500, 'g'], ['vc', 'Vitamine C', 'mg', 110, 'g'], ['vd', 'Vitamine D', 'µg', 15, 'g'], ['b12', 'Vitamine B12', 'µg', 4, 'g'], ['ags', 'Graisses saturées', 'g', 22, 'w'], ['su', 'Sucres', 'g', 100, 'w'], ['sel', 'Sel', 'g', 6, 'w']];
const foods = () => [...BASE, ...((C().S().foods || []).map(f => ({ ...f, cat: 'Mes aliments' })))];
const ref = () => { const s = window.calSummary ? window.calSummary() : { kcal: 2500, p: 120 }; return { kcal: s.kcal || 2500, p: s.p || 120 }; };
let q = '', cat = '', open = null, qty = 'portion', grams = 100, cmpA = null, cmpB = null, mode = 'zoom';
const amount = f => qty === 'portion' ? f.pg : qty === '100' ? 100 : grams;
function per(f, g) { const o = {}; for (const k of K) o[k] = (f[k] || 0) * g / 100; return o; }
function pct(n, v) { const r = ref(); const d = n[0] === 'p' ? r.p : n[3]; return d ? v / d * 100 : 0; }
function card(f) {
  const g = amount(f), v = per(f, g), r = ref(), good = NUT.filter(n => n[4] === 'g' && pct(n, v[n[0]]) >= 10).sort((a, b) => pct(b, v[b[0]]) - pct(a, v[a[0]])), watch = NUT.filter(n => n[4] === 'w' && pct(n, v[n[0]]) >= 12);
  const row = (n, cls) => `<div class="nrow ${cls}"><span class="ni">${cls === 'good' ? '✓' : '!'}</span><span class="nn"><b>${n[1]}</b><small>${fn(v[n[0]])} ${n[2]} · ${n[4] === 'w' ? 'de la limite du jour' : 'de ta journée'}</small></span><span class="np">${Math.round(pct(n, v[n[0]]))} %</span></div>`;
  return `<button class="link" data-nu="close">← Tous les aliments</button>
  <div class="fhead"><div class="lens"><span>${EMO[f.cat] || '🍽️'}</span></div><div><small>${esc(f.cat)}</small><h2>${esc(f.n)}</h2></div></div>
  <div class="seg" style="margin:10px 0">${[['portion', esc(f.pl) + ' (' + f.pg + ' g)'], ['100', '100 g'], ['custom', 'Autre']].map(([k, l]) => `<button class="${qty === k ? 'sel' : ''}" data-nu="qty" data-v="${k}">${l}</button>`).join('')}</div>
  ${qty === 'custom' ? `<div class="unit" style="max-width:160px"><input inputmode="numeric" data-nug="1" value="${grams}"><span>g</span></div>` : ''}
  <div class="tcard fkcal"><div><b class="num">${fr(v.kcal)}</b><small>kcal</small></div><div class="fk-p"><small>${Math.round(v.kcal / r.kcal * 100)} % de tes ${fr(r.kcal)} kcal du jour</small><div class="ch-bar"><i style="width:${Math.min(100, v.kcal / r.kcal * 100)}%"></i></div></div></div>
  <div class="fmac">${[['p', 'Protéines', '#2f6bff'], ['g', 'Glucides', '#10b981'], ['l', 'Lipides', '#f5b400']].map(([k, l, c]) => `<div><span style="--c:${c}">${fn(v[k])} g</span><small>${l}</small></div>`).join('')}</div>
  ${good.length ? `<div class="eyebrow" style="margin-top:14px">Le bon</div><div class="tcard" style="padding:4px 12px">${good.map(n => row(n, 'good')).join('')}</div>` : ''}
  ${watch.length ? `<div class="eyebrow" style="margin-top:14px">À surveiller</div><div class="tcard" style="padding:4px 12px">${watch.map(n => row(n, 'warn')).join('')}</div>` : ''}
  <details class="tcard"><summary>Toutes les valeurs (${g} g)</summary>${NUT.map(n => `<div class="between small" style="padding:5px 0;border-top:1px solid var(--line)"><span>${n[1]}</span><b>${fn(v[n[0]])} ${n[2]}</b></div>`).join('')}</details>
  <div class="row"><button class="grow" data-nu="cmpset" data-v="${f.id}">Comparer avec…</button>${f.cat === 'Mes aliments' ? `<button class="ghost" data-nu="delfood" data-v="${f.id}">Supprimer</button>` : ''}</div>`;
}
function list() {
  const all = foods(), cats = [...new Set(all.map(f => f.cat))];
  const L = all.filter(f => (!cat || f.cat === cat) && f.n.toLowerCase().includes(q.toLowerCase()));
  return `<div class="nhero"><div class="lens big"><span>🧀</span></div><div><div class="eyebrow">Zoom sur ce que tu avales</div><p class="small" style="margin:0">Le bon et le moins bon de chaque aliment, en portions réelles, rapporté à ta journée.</p></div></div>
  <input id="nq" data-nuq="1" value="${esc(q)}" placeholder="Un aliment : « skyr », « saumon », « pâtes »…" autocomplete="off" style="margin-top:12px">
  <div class="chips scrollx" style="margin-top:8px">${cats.map(c => `<button class="sm ${cat === c ? 'sel' : ''}" data-nu="cat" data-v="${esc(c)}">${EMO[c] || ''} ${esc(c)}</button>`).join('')}</div>
  <div class="tcard" id="nlist" style="padding:4px 12px">${listRows(L)}</div>
  <button class="wide" data-nu="addfood">+ Ajouter mon aliment</button>
  <p class="tiny">Valeurs moyennes indicatives pour des aliments courants. Pour un produit précis, ajoute-le avec les valeurs de son étiquette.</p>`;
}
const listRows = L => L.map(f => `<button class="frow" data-nu="open" data-v="${f.id}"><span class="fe">${EMO[f.cat] || '🍽️'}</span><span class="ft"><b>${esc(f.n)}</b><small>${esc(f.pl)} · ${fr(f.kcal * f.pg / 100)} kcal · ${fn(f.p * f.pg / 100)} g prot.</small></span><span class="mer-go">›</span></button>`).join('') || '<p class="tiny">Aucun aliment trouvé. Ajoute-le toi-même.</p>';
function compare() {
  const all = foods(), A = all.find(f => f.id === cmpA) || all[0], Bf = all.find(f => f.id === cmpB) || all[1];
  const sel = (k, cur) => `<select data-nucmp="${k}">${all.map(f => `<option value="${f.id}" ${f.id === cur.id ? 'selected' : ''}>${esc(f.n)}</option>`).join('')}</select>`;
  const rows = [['kcal', 'Calories', 'kcal', 'n'], ['p', 'Protéines', 'g', 'g'], ['g', 'Glucides', 'g', 'n'], ['l', 'Lipides', 'g', 'n'], ['fi', 'Fibres', 'g', 'g'], ['ags', 'Graisses saturées', 'g', 'w'], ['su', 'Sucres', 'g', 'w'], ['sel', 'Sel', 'g', 'w'], ['ca', 'Calcium', 'mg', 'g'], ['fe', 'Fer', 'mg', 'g'], ['mg', 'Magnésium', 'mg', 'g'], ['vc', 'Vitamine C', 'mg', 'g']];
  return `<p class="lede">Deux aliments face à face, pour 100 g. En vert, le meilleur des deux sur chaque ligne.</p>
  <div class="cmpsel"><div><span class="fe">${EMO[A.cat] || ''}</span>${sel('a', A)}</div><b>vs</b><div><span class="fe">${EMO[Bf.cat] || ''}</span>${sel('b', Bf)}</div></div>
  <div class="tcard" style="padding:6px 12px">${rows.map(([k, l, u, t]) => { const a = A[k] || 0, b = Bf[k] || 0, mx = Math.max(a, b) || 1, wa = t === 'g' ? a > b : t === 'w' ? a < b : false, wb = t === 'g' ? b > a : t === 'w' ? b < a : false; return `<div class="cmprow"><div class="cl ${wa ? 'win' : ''}"><b>${fn(a)}</b><i style="width:${a / mx * 100}%"></i></div><small>${l}<br>${u}</small><div class="cr ${wb ? 'win' : ''}"><i style="width:${b / mx * 100}%"></i><b>${fn(b)}</b></div></div>`; }).join('')}</div>`;
}
function addSheet() {
  const F = [['n', 'Nom', 'text'], ['pl', 'Portion (ex. 1 pot)', 'text'], ['pg', 'Poids de la portion (g)', 'n'], ['kcal', 'Calories (kcal / 100 g)', 'n'], ['p', 'Protéines (g / 100 g)', 'n'], ['g', 'Glucides (g / 100 g)', 'n'], ['su', 'dont sucres (g / 100 g)', 'n'], ['l', 'Lipides (g / 100 g)', 'n'], ['ags', 'dont saturés (g / 100 g)', 'n'], ['fi', 'Fibres (g / 100 g)', 'n'], ['sel', 'Sel (g / 100 g)', 'n']];
  C().sheet(`<h2>Mon aliment</h2><p class="tiny">Recopie l'étiquette (valeurs pour 100 g). Seuls le nom et les calories sont obligatoires.</p>
    <div class="nform">${F.map(([k, l, t]) => `<label class="lbl">${l}<input id="nf_${k}" ${t === 'n' ? 'inputmode="decimal"' : ''}></label>`).join('')}</div>
    <button class="p wide" style="margin-top:14px" data-nu="savefood">Enregistrer</button><button class="ghost wide" style="margin-top:8px" data-close>Fermer</button>`);
}
T2.nutri = () => `<div class="seg" style="margin-bottom:12px">${[['zoom', 'Zoom aliment'], ['cmp', 'Comparer']].map(([k, l]) => `<button class="${mode === k ? 'sel' : ''}" data-nu="mode" data-v="${k}">${l}</button>`).join('')}</div>` + (mode === 'cmp' ? compare() : open ? (foods().find(f => f.id === open) ? card(foods().find(f => f.id === open)) : list()) : list());

document.addEventListener('click', e => {
  const b = e.target.closest('[data-nu]'); if (!b || !window.CARNET) return; const v = b.dataset.v, S = C().S();
  switch (b.dataset.nu) {
    case 'mode': mode = v; break;
    case 'cat': cat = cat === v ? '' : v; break;
    case 'open': open = v; qty = 'portion'; window.scrollTo(0, 0); break;
    case 'close': open = null; break;
    case 'qty': qty = v; break;
    case 'cmpset': cmpA = v; mode = 'cmp'; break;
    case 'addfood': addSheet(); return;
    case 'savefood': { const g = id => (document.getElementById('nf_' + id) || {}).value || '', n = g('n').trim(), kc = parseFloat(g('kcal').replace(',', '.')); if (!n || !(kc >= 0)) { C().toast('Il faut au moins un nom et les calories'); return; } const f = { id: 'u' + Date.now().toString(36), n, pl: g('pl').trim() || '1 portion', pg: parseFloat(g('pg').replace(',', '.')) || 100 }; for (const k of K) f[k] = parseFloat(g(k).replace(',', '.')) || 0; S.foods = [...(S.foods || []), f]; C().save(); C().closeSheet(); open = f.id; C().toast('Aliment ajouté'); break; }
    case 'delfood': if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Sûr ?'; return; } S.foods = (S.foods || []).filter(f => f.id !== v); open = null; C().save(); break;
    default: return;
  }
  C().render();
});
document.addEventListener('input', e => {
  const t = e.target; if (!window.CARNET) return;
  if (t.dataset.nuq) { q = t.value; const L = foods().filter(f => (!cat || f.cat === cat) && f.n.toLowerCase().includes(q.toLowerCase())); const el = document.getElementById('nlist'); if (el) el.innerHTML = listRows(L); }
});
document.addEventListener('change', e => {
  const t = e.target; if (!window.CARNET) return;
  if (t.dataset.nug) { grams = Math.max(1, parseInt(t.value) || 100); C().render(); }
  if (t.dataset.nucmp) { if (t.dataset.nucmp === 'a') cmpA = t.value; else cmpB = t.value; C().render(); }
});
}
