// Bibliothèque d'exercices : id | nom | muscle | matériel | type
// Matériel : M machine, S Smith, P poulie, H haltères, B barre, C poids du corps
// Type : s force (4×6-8), c polyarticulaire (3×8-10), i isolation (3×12-15), a abdos (3×15)
window.LIBRARY = `
mchest|Chest press assis (machine)|Pecs|M|s
minclp|Chest press inclinée (machine)|Pecs|M|c
chestp|Chest press convergente Hammer Strength|Pecs|M|c
chesti|Chest press inclinée Hammer Strength|Pecs|M|c
mdecl|Chest press déclinée (machine)|Pecs|M|c
pecdeck|Pec deck (pec fly)|Pecs|M|i
smithflat|Développé couché Smith|Pecs|S|s
inclb|Développé incliné barre ou Smith|Pecs|S|c
ecpou|Écarté poulie vis-à-vis|Pecs|P|i
ecbh|Écarté poulie bas vers haut|Pecs|P|i
echb|Écarté poulie haut vers bas|Pecs|P|i
cablepress|Développé poulie debout|Pecs|P|c
bench|Développé couché barre|Pecs|B|s
couchh|Développé couché haltères|Pecs|H|c
inclh|Développé incliné haltères 30°|Pecs|H|c
declh|Développé décliné haltères|Pecs|H|c
ecarth|Écarté haltères|Pecs|H|i
pullh|Pull-over haltère|Pecs|H|i
mdips|Dips assistés (machine)|Pecs|M|c
dips|Dips|Pecs|C|c
pompes|Pompes lestées|Pecs|C|c
pompesd|Pompes pieds surélevés|Pecs|C|c
mtract|Tractions assistées (machine)|Dos|M|c
tract|Tractions|Dos|C|s
tirhs|Tirage vertical Hammer Strength|Dos|M|c
tirvert|Tirage vertical poulie prise large|Dos|P|c
tirneu|Tirage vertical prise neutre serrée|Dos|P|c
tirsupi|Tirage vertical prise supination|Dos|P|c
mrow|Rowing machine poitrine appuyée|Dos|M|c
rowiso|Rowing Iso-Lateral Hammer Strength|Dos|M|c
rowt|T-bar row (machine)|Dos|M|c
mpullo|Pull-over (machine)|Dos|M|i
mlomb|Extension lombaire (machine)|Dos|M|i
mshrug|Shrugs Smith|Dos|S|i
rowp|Rowing assis poulie prise serrée|Dos|P|c
rowlarge|Rowing assis poulie prise large|Dos|P|c
rowunip|Rowing unilatéral poulie|Dos|P|c
pullo|Pull-over poulie haute|Dos|P|i
bratend|Tirage bras tendus poulie|Dos|P|i
facep|Face pull corde|Dos|P|i
rowb|Rowing barre buste penché|Dos|B|s
souleve|Soulevé de terre|Dos|B|s
rowuni|Rowing unilatéral haltère (/ bras)|Dos|H|c
rowinc|Rowing haltères sur banc incliné|Dos|H|c
shrug|Shrugs haltères|Dos|H|i
lomb|Extensions lombaires banc 45°|Dos|C|i
mshoul|Développé épaules (machine)|Épaules|M|c
shoulhs|Développé épaules Hammer Strength|Épaules|M|c
mlat|Élévations latérales (machine)|Épaules|M|i
oiseau|Oiseau machine (arrière d'épaules)|Épaules|M|i
smithmil|Développé militaire Smith|Épaules|S|c
latpou|Élévations latérales poulie|Épaules|P|i
frontpou|Élévations frontales poulie|Épaules|P|i
oiseaupou|Oiseau poulie croisée|Épaules|P|i
upright|Tirage menton poulie|Épaules|P|i
milit|Développé militaire haltères assis|Épaules|H|c
arnold|Développé Arnold|Épaules|H|c
lath|Élévations latérales haltères|Épaules|H|i
frontal|Élévations frontales haltères|Épaules|H|i
oiseauh|Oiseau haltères buste penché|Épaules|H|i
militb|Développé militaire barre debout|Épaules|B|s
mcurl|Curl machine (pupitre)|Biceps|M|i
curlpb|Curl poulie basse|Biceps|P|i
curlph|Curl poulie haute (biceps en croix)|Biceps|P|i
marteaucorde|Curl marteau à la corde|Biceps|P|i
curlez|Curl barre EZ|Biceps|B|c
curlb|Curl barre droite|Biceps|B|c
pupitre|Curl pupitre barre EZ|Biceps|B|i
marteau|Curl marteau|Biceps|H|i
curlh|Curl haltères alterné|Biceps|H|i
curlinc|Curl incliné haltères|Biceps|H|i
curlconc|Curl concentré|Biceps|H|i
spider|Spider curl|Biceps|H|i
mtri|Extension triceps (machine)|Triceps|M|i
mdipstri|Dips assis (machine triceps)|Triceps|M|c
couchserre|Développé couché prise serrée Smith|Triceps|S|c
tricorde|Extension triceps corde|Triceps|P|i
tribarre|Extension triceps barre à la poulie|Triceps|P|i
trioverhead|Extension triceps au-dessus de la tête (poulie)|Triceps|P|i
kickpou|Kickback poulie|Triceps|P|i
front|Barre au front EZ|Triceps|B|c
trih|Extension triceps haltère derrière la tête|Triceps|H|i
kickback|Kickback haltère|Triceps|H|i
dipsbanc|Dips entre deux bancs|Triceps|C|c
presse|Presse à cuisses|Quadriceps|M|s
hack|Hack squat (machine)|Quadriceps|M|s
pendsq|Pendulum squat|Quadriceps|M|c
vsq|V-squat (machine)|Quadriceps|M|c
legext|Leg extension|Quadriceps|M|i
smithsq|Squat Smith|Quadriceps|S|s
squat|Squat barre|Quadriceps|B|s
goblet|Goblet squat|Quadriceps|H|c
bulg|Fentes bulgares haltères (/ jambe)|Quadriceps|H|c
fentes|Fentes marchées haltères|Quadriceps|H|c
stepup|Step-up haltères|Quadriceps|H|c
legcurl|Leg curl allongé|Ischios|M|i
legcurlass|Leg curl assis|Ischios|M|i
sdtroum|Soulevé de terre roumain haltères|Ischios|H|c
sdtsmith|Soulevé de terre roumain Smith|Ischios|S|c
ghr|Glute-ham raise|Ischios|C|c
mhip|Hip thrust (machine)|Fessiers|M|c
abduct|Abducteurs (machine)|Fessiers|M|i
adduct|Adducteurs (machine)|Fessiers|M|i
mkickfess|Kickback fessier (machine)|Fessiers|M|i
kickfess|Kickback fessier poulie|Fessiers|P|i
hipthrust|Hip thrust barre|Fessiers|B|s
mollet|Mollets debout machine|Mollets|M|i
molletass|Mollets assis (machine)|Mollets|M|i
molletpresse|Mollets à la presse|Mollets|M|i
molletsmith|Mollets debout Smith|Mollets|S|i
crmach|Crunch machine|Abdos|M|a
mrot|Rotation du buste (machine)|Abdos|M|a
crpou|Crunch poulie haute à genoux|Abdos|P|a
pallof|Pallof press poulie|Abdos|P|a
bucheron|Bûcheron poulie|Abdos|P|a
leg|Relevés de jambes suspendu|Abdos|C|a
genoux|Relevés de genoux chaise romaine|Abdos|C|a
planche|Planche (secondes)|Abdos|C|a
gainlat|Gainage latéral (s / côté)|Abdos|C|a
hollow|Hollow body (secondes)|Abdos|C|a
roue|Roulette abdos|Abdos|C|a
crunch|Crunch au sol|Abdos|C|a
vups|V-ups|Abdos|C|a
twist|Russian twist avec disque|Abdos|H|a
wristcurl|Curl poignets barre|Avant-bras|B|i
farmer|Marche du fermier (secondes)|Avant-bras|H|c
hang|Suspension à la barre (secondes)|Avant-bras|C|i
`.trim().split('\n').map(l => { const [id, n, m, eq, k] = l.split('|'); const d = { s: [4, '6-8', 150], c: [3, '8-10', 120], i: [3, '12-15', 60], a: [3, '15', 45] }[k]; return { id, n, m, eq, sets: d[0], reps: d[1], rest: d[2], q: n.replace(/\(.*?\)/g, '') + ' technique' }; });
window.EQUIP = { M: 'Machine', S: 'Smith', P: 'Poulie', H: 'Haltères', B: 'Barre', C: 'Poids du corps' };
window.MUSCLES = ['Pecs', 'Dos', 'Épaules', 'Biceps', 'Triceps', 'Quadriceps', 'Ischios', 'Fessiers', 'Mollets', 'Abdos', 'Avant-bras'];
