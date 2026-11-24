// Bibliothèque d'exercices : id | nom | muscle | matériel | type | conseil
// Matériel : M machine, S Smith, P poulie, H haltères, B barre, K kettlebell, E élastique, C poids du corps
// Type : s force (4×6-8), c polyarticulaire (3×8-10), i isolation (3×12-15), a abdos (3×15), d cardio (1 × 10-20 min)
window.LIBRARY = `
mchest|Chest press assis (machine)|Pecs|M|s|Poignées à hauteur du milieu des pecs, omoplates serrées, pousse sans verrouiller les coudes.
minclp|Chest press inclinée (machine)|Pecs|M|c|Règle le siège pour que les poignées partent du haut des pecs ; garde le dos collé.
chestp|Chest press convergente Hammer Strength|Pecs|M|c|Laisse les bras se rejoindre en fin de poussée et serre les pecs une seconde.
chesti|Chest press inclinée Hammer Strength|Pecs|M|c|Épaules basses et en arrière ; descends lentement jusqu'à l'étirement des pecs.
mdecl|Chest press déclinée (machine)|Pecs|M|c|Cible le bas des pecs ; contrôle la descente sur 2 secondes.
mhsdecl|Chest press déclinée Hammer Strength|Pecs|M|c|Bras unilatéraux : travaille un côté à la fois si tu as un déséquilibre.
chestpl|Chest press prise large (machine)|Pecs|M|c|Prise large = plus de pecs, moins de triceps ; coudes à 45° du corps.
pecdeck|Pec deck (pec fly)|Pecs|M|i|Coudes légèrement fléchis et fixes ; pense à rapprocher les coudes, pas les mains.
smithflat|Développé couché Smith|Pecs|S|s|Barre au-dessus du bas des pecs ; règle les sécurités juste sous la poitrine.
inclb|Développé incliné barre ou Smith|Pecs|S|c|Banc à 30° maxi ; barre qui descend vers le haut des pecs.
smithdecl|Développé décliné Smith|Pecs|S|c|Barre vers le bas des pecs ; garde les pieds bien calés.
ecpou|Écarté poulie vis-à-vis|Pecs|P|i|Un pas en avant, buste légèrement penché ; les mains se croisent devant toi.
ecbh|Écarté poulie bas vers haut|Pecs|P|i|Poulies en bas, monte les mains vers le menton : cible le haut des pecs.
echb|Écarté poulie haut vers bas|Pecs|P|i|Poulies en haut, descends les mains vers le nombril : cible le bas des pecs.
ecpoumid|Écarté poulie unilatéral|Pecs|P|i|Un bras à la fois pour bien sentir la contraction ; buste immobile.
cablepress|Développé poulie debout|Pecs|P|c|Un pied devant, gainage serré ; pousse droit devant toi.
bench|Développé couché barre|Pecs|B|s|Toujours avec pareur ou sécurités : seul, préfère le Smith ou la machine.
couchh|Développé couché haltères|Pecs|H|c|Descends jusqu'à l'étirement, coudes à 45° ; remonte en rapprochant les haltères.
inclh|Développé incliné haltères 30°|Pecs|H|c|Banc à 30°, haltères qui descendent sur les côtés du haut des pecs.
declh|Développé décliné haltères|Pecs|H|c|Calé sur le banc décliné ; amplitude contrôlée.
ecarth|Écarté haltères|Pecs|H|i|Bras presque tendus, descends en arc jusqu'à sentir l'étirement, sans forcer l'épaule.
inclfly|Écarté incliné haltères|Pecs|H|i|Même geste que l'écarté, sur banc à 30° pour le haut des pecs.
squeezep|Squeeze press haltères|Pecs|H|i|Presse les haltères l'un contre l'autre pendant tout le mouvement.
floorpress|Floor press haltères|Pecs|H|c|Allongé au sol : les coudes touchent le sol, l'épaule est protégée.
pullh|Pull-over haltère|Pecs|H|i|Bras légèrement fléchis, descends derrière la tête sans cambrer.
landmine|Développé landmine|Pecs|B|c|Barre calée dans un coin, pousse en diagonale vers le haut.
mdips|Dips assistés (machine)|Pecs|M|c|Plus le contrepoids est lourd, plus c'est facile ; buste penché pour les pecs.
dips|Dips|Pecs|C|c|Buste penché en avant, descends jusqu'à 90° aux coudes.
pompes|Pompes lestées|Pecs|C|c|Disque sur le dos ; corps gainé en planche du début à la fin.
pompeslarg|Pompes classiques|Pecs|C|c|Mains un peu plus larges que les épaules ; poitrine jusqu'au sol.
pompesd|Pompes pieds surélevés|Pecs|C|c|Pieds sur un banc : plus dur, cible le haut des pecs.
pompesinc|Pompes inclinées (mains sur banc)|Pecs|C|c|Version plus facile, parfaite en finisher.
elasticfly|Écarté élastique|Pecs|E|i|Élastique accroché derrière toi ; contrôle le retour.
kbfloor|Floor press kettlebell|Pecs|K|c|Une kettlebell par main, coudes qui touchent le sol.
mtract|Tractions assistées (machine)|Dos|M|c|Baisse le contrepoids au fil des semaines pour aller vers les vraies tractions.
tract|Tractions|Dos|C|s|Pars bras tendus, tire les coudes vers les hanches, menton au-dessus de la barre.
tractsup|Tractions supination (chin-up)|Dos|C|s|Paumes vers toi : plus de biceps, souvent plus facile.
tractneutre|Tractions prise neutre|Dos|C|s|Paumes face à face : la prise la plus douce pour les épaules.
tirhs|Tirage vertical Hammer Strength|Dos|M|c|Tire les coudes vers le bas et l'arrière, poitrine sortie.
tirhsunil|Tirage vertical unilatéral (machine)|Dos|M|c|Un bras à la fois, légère rotation du buste vers le bras qui tire.
tirvert|Tirage vertical poulie prise large|Dos|P|c|Barre vers le haut de la poitrine, pas derrière la nuque.
tirneu|Tirage vertical prise neutre serrée|Dos|P|c|Tire vers le sternum en gardant les épaules basses.
tirsupi|Tirage vertical prise supination|Dos|P|c|Paumes vers toi, coudes le long du corps.
pullpoulie1|Tirage vertical unilatéral poulie|Dos|P|c|Poignée simple, tire le coude vers la hanche.
mrow|Rowing machine poitrine appuyée|Dos|M|c|Poitrine collée au support : pas de triche avec le bas du dos.
rowiso|Rowing Iso-Lateral Hammer Strength|Dos|M|c|Tire les coudes loin derrière toi et serre les omoplates.
rowhsbas|Rowing bas Hammer Strength|Dos|M|c|Tire vers le nombril pour cibler les grands dorsaux.
rowhshaut|Rowing haut Hammer Strength|Dos|M|c|Tire vers le haut de la poitrine, coudes ouverts : haut du dos.
rowt|T-bar row (machine)|Dos|M|c|Dos plat, poitrine sur le support si la machine en a un.
mpullo|Pull-over (machine)|Dos|M|i|Bras qui descendent en arc, sens l'étirement sous les aisselles.
mlomb|Extension lombaire (machine)|Dos|M|i|Mouvement lent, charge légère : renforce sans abîmer le dos.
mshrug|Shrugs Smith|Dos|S|i|Monte les épaules vers les oreilles, tiens 1 seconde en haut.
mshrugm|Shrugs machine|Dos|M|i|Pas de rotation des épaules, juste monter et descendre.
invrow|Rowing inversé (barre Smith)|Dos|S|c|Sous la barre, corps gainé, tire la poitrine vers la barre.
rowp|Rowing assis poulie prise serrée|Dos|P|c|Dos droit, tire vers le nombril, ne te balance pas.
rowlarge|Rowing assis poulie prise large|Dos|P|c|Coudes ouverts, tire vers le bas de la poitrine.
rowunip|Rowing unilatéral poulie|Dos|P|c|Un bras, coude qui glisse le long du corps.
rowcorde|Rowing corde vers le visage (poulie basse)|Dos|P|i|Tire la corde vers les yeux en écartant les mains.
pullo|Pull-over poulie haute|Dos|P|i|Bras presque tendus, ramène la barre vers les cuisses.
bratend|Tirage bras tendus poulie|Dos|P|i|Buste penché, bras tendus, pousse la barre vers les cuisses.
facep|Face pull corde|Dos|P|i|Corde vers le front, coudes hauts : top pour la posture.
rowb|Rowing barre buste penché|Dos|B|s|Dos plat obligatoire ; si tu fatigues du bas du dos, passe à la machine.
pendlay|Rowing Pendlay|Dos|B|s|Barre qui repart du sol à chaque rep, dos parallèle au sol.
rackpull|Rack pull|Dos|B|s|Soulevé de terre partiel depuis les genoux, dos verrouillé.
souleve|Soulevé de terre|Dos|B|s|Technique d'abord, charge ensuite ; à éviter seul si tu débutes.
shrugbar|Shrugs barre|Dos|B|i|Barre devant les cuisses, monte les épaules droit vers le haut.
rowuni|Rowing unilatéral haltère (/ bras)|Dos|H|c|Main et genou sur le banc, tire l'haltère vers la hanche.
rowinc|Rowing haltères sur banc incliné|Dos|H|c|Poitrine sur le banc à 30°, aucune triche possible.
rowseal|Rowing allongé sur banc (seal row)|Dos|H|c|À plat ventre sur un banc haut, tire les haltères vers les côtes.
shrug|Shrugs haltères|Dos|H|i|Haltères le long du corps, épaules vers les oreilles.
kbrow|Rowing kettlebell|Dos|K|c|Comme le rowing haltère, poignée plus épaisse pour la prise.
elasticrow|Tirage élastique|Dos|E|c|Élastique accroché devant toi, serre les omoplates en fin de geste.
lomb|Extensions lombaires banc 45°|Dos|C|i|Descends dos droit, remonte jusqu'à l'alignement, pas plus.
superman|Superman au sol|Dos|C|i|À plat ventre, décolle bras et jambes, tiens 2 secondes.
mshoul|Développé épaules (machine)|Épaules|M|c|Poignées à hauteur des oreilles au départ, pousse sans cambrer.
shoulhs|Développé épaules Hammer Strength|Épaules|M|c|Dos collé au dossier, trajectoire légèrement vers l'avant.
mlat|Élévations latérales (machine)|Épaules|M|i|Coudes qui montent jusqu'à hauteur d'épaule, pas plus haut.
oiseau|Oiseau machine (arrière d'épaules)|Épaules|M|i|Face au pec deck, poignées à hauteur d'épaules, ouvre les bras.
smithmil|Développé militaire Smith|Épaules|S|c|Assis sur un banc, barre qui descend devant le menton.
latpou|Élévations latérales poulie|Épaules|P|i|Poulie basse, câble devant ou derrière toi : tension tout du long.
latpouderr|Élévation latérale poulie derrière le dos|Épaules|P|i|Câble qui passe derrière toi pour plus d'étirement en bas.
frontpou|Élévations frontales poulie|Épaules|P|i|Monte jusqu'aux yeux, redescends lentement.
oiseaupou|Oiseau poulie croisée|Épaules|P|i|Câbles croisés devant toi, ouvre les bras vers l'arrière.
upright|Tirage menton poulie|Épaules|P|i|Prise large et arrêt à hauteur de poitrine pour protéger l'épaule.
extrot|Rotation externe poulie|Épaules|P|i|Coude collé au corps, tourne l'avant-bras vers l'extérieur : santé de l'épaule.
milit|Développé militaire haltères assis|Épaules|H|c|Haltères à hauteur des oreilles, pousse au-dessus de la tête.
arnold|Développé Arnold|Épaules|H|c|Paumes vers toi en bas, tourne-les vers l'avant en poussant.
lath|Élévations latérales haltères|Épaules|H|i|Légèrement penché en avant, monte les coudes, pas les mains.
seatedlat|Élévations latérales assis haltères|Épaules|H|i|Assis = impossible de tricher avec l'élan.
frontal|Élévations frontales haltères|Épaules|H|i|Alterné ou ensemble, jusqu'à hauteur des yeux.
oiseauh|Oiseau haltères buste penché|Épaules|H|i|Buste presque parallèle au sol, bras légèrement fléchis.
ytraise|Élévations en Y sur banc incliné|Épaules|H|i|À plat ventre sur banc à 30°, monte les bras en Y avec des petits poids.
militb|Développé militaire barre debout|Épaules|B|s|Fessiers et abdos serrés ; la tête passe sous la barre.
pushpress|Push press|Épaules|B|s|Petite flexion des jambes pour lancer la barre, puis bras tendus.
landpress|Développé landmine à un bras|Épaules|B|c|Pousse la barre en diagonale, très doux pour les épaules.
pikepush|Pompes piquées (pike push-up)|Épaules|C|c|Fesses en l'air, tête qui descend entre les mains.
kbpress|Développé kettlebell à un bras|Épaules|K|c|Kettlebell posée sur l'avant-bras, pousse au-dessus de la tête.
elasticlat|Élévations latérales élastique|Épaules|E|i|Pieds sur l'élastique, monte les bras sur les côtés.
pullapart|Pull-apart élastique|Épaules|E|i|Bras tendus devant toi, écarte l'élastique jusqu'à la poitrine.
mcurl|Curl machine (pupitre)|Biceps|M|i|Coudes bien calés sur le pupitre, ne décolle pas les épaules.
curlpb|Curl poulie basse|Biceps|P|i|Coudes fixes le long du corps, tension constante.
curlpouliebarre|Curl barre à la poulie basse|Biceps|P|i|Barre droite ou EZ, contrôle la descente.
curlph|Curl poulie haute (biceps en croix)|Biceps|P|i|Bras à l'horizontale, ramène les poings vers les oreilles.
curlbayes|Curl Bayesian (poulie derrière le corps)|Biceps|P|i|Dos à la poulie, bras qui part derrière toi : grand étirement.
marteaucorde|Curl marteau à la corde|Biceps|P|i|Paumes face à face, coudes collés.
curlez|Curl barre EZ|Biceps|B|c|Coudes fixes, pas d'élan avec le dos.
curlb|Curl barre droite|Biceps|B|c|Prise largeur d'épaules, monte jusqu'à la poitrine.
pupitre|Curl pupitre barre EZ|Biceps|B|i|Descends presque bras tendus, sans claquer les coudes.
curl21|Curl 21 barre EZ|Biceps|B|i|7 reps en bas, 7 en haut, 7 complètes : finisher qui brûle.
dragcurl|Drag curl barre|Biceps|B|i|La barre glisse le long du corps, coudes qui partent en arrière.
marteau|Curl marteau|Biceps|H|i|Paumes face à face, travaille aussi l'avant-bras.
curlmarteaucroise|Curl marteau croisé|Biceps|H|i|L'haltère monte vers l'épaule opposée.
curlh|Curl haltères alterné|Biceps|H|i|Tourne la paume vers le haut en montant.
curlinc|Curl incliné haltères|Biceps|H|i|Banc à 45°, bras qui pendent derrière : énorme étirement.
curlconc|Curl concentré|Biceps|H|i|Coude contre l'intérieur de la cuisse, monte lentement.
curlpupitreh|Curl pupitre haltère|Biceps|H|i|Un bras à la fois sur le pupitre.
curlzottman|Curl Zottman|Biceps|H|i|Monte paume vers le haut, redescends paume vers le bas.
spider|Spider curl|Biceps|H|i|Poitrine sur banc incliné, bras qui pendent droit vers le sol.
curlkb|Curl kettlebell|Biceps|K|i|Kettlebell tenue par la poignée, coudes fixes.
curlelastic|Curl élastique|Biceps|E|i|Pieds sur l'élastique, plus dur en haut du mouvement.
mtri|Extension triceps (machine)|Triceps|M|i|Coudes calés, tends complètement les bras.
mtrioverhead|Extension triceps au-dessus de la tête (machine)|Triceps|M|i|Long chef du triceps : descends bien derrière la tête.
mdipstri|Dips assis (machine triceps)|Triceps|M|c|Pousse vers le bas en gardant le buste droit.
couchserre|Développé couché prise serrée Smith|Triceps|S|c|Mains largeur d'épaules, coudes le long du corps.
jmpress|JM press Smith|Triceps|S|c|Hybride entre développé serré et barre au front ; charge modérée.
tricorde|Extension triceps corde|Triceps|P|i|Écarte la corde en bas, coudes immobiles.
tribarre|Extension triceps barre à la poulie|Triceps|P|i|Barre droite ou en V, poignets droits.
tripouli1|Extension triceps unilatérale poulie|Triceps|P|i|Poignée simple, un bras à la fois.
trioverhead|Extension triceps au-dessus de la tête (poulie)|Triceps|P|i|Dos à la poulie, corde derrière la tête, tends vers l'avant.
kickpou|Kickback poulie|Triceps|P|i|Buste penché, bras tendu vers l'arrière, coude fixe.
front|Barre au front EZ|Triceps|B|c|Barre vers le front ou derrière la tête, coudes fixes.
frontH|Barre au front haltères|Triceps|H|i|Paumes face à face, plus doux pour les coudes.
trih|Extension triceps haltère derrière la tête|Triceps|H|i|Un haltère à deux mains, coudes vers le plafond.
tatepress|Tate press haltères|Triceps|H|i|Coudes ouverts, haltères qui descendent vers la poitrine.
kickback|Kickback haltère|Triceps|H|i|Bras collé au corps, tends l'avant-bras vers l'arrière.
trielastic|Extension triceps élastique|Triceps|E|i|Élastique accroché en haut, comme à la poulie.
pompesdia|Pompes diamant|Triceps|C|c|Mains rapprochées sous la poitrine, coudes le long du corps.
dipsbanc|Dips entre deux bancs|Triceps|C|c|Mains sur un banc derrière toi, descends à 90°.
presse|Presse à cuisses|Quadriceps|M|s|Pieds largeur de hanches, ne décolle jamais le bas du dos du dossier.
presseunil|Presse à cuisses unilatérale|Quadriceps|M|c|Une jambe à la fois pour corriger les déséquilibres.
pressehoriz|Presse horizontale|Quadriceps|M|c|Pousse avec les talons, genoux dans l'axe des pieds.
hack|Hack squat (machine)|Quadriceps|M|s|Dos collé, descends le plus bas possible en contrôle.
pendsq|Pendulum squat|Quadriceps|M|c|Très bonne amplitude pour les quadriceps, sans charger le dos.
vsq|V-squat (machine)|Quadriceps|M|c|Épaules sous les coussins, descends sous la parallèle.
beltsq|Belt squat (machine)|Quadriceps|M|c|La charge est à la ceinture : zéro pression sur le dos.
legext|Leg extension|Quadriceps|M|i|Tiens 1 seconde jambes tendues, redescends lentement.
legextunil|Leg extension unilatéral|Quadriceps|M|i|Une jambe à la fois, même tempo.
smithsq|Squat Smith|Quadriceps|S|s|Pieds un peu en avant de la barre, sécurités réglées.
smithfentes|Fentes avant Smith|Quadriceps|S|c|Grand pas, genou arrière qui frôle le sol.
smithbulg|Fentes bulgares Smith|Quadriceps|S|c|Pied arrière sur le banc, le Smith t'aide à l'équilibre.
squat|Squat barre|Quadriceps|B|s|Seul, uniquement dans un rack avec barres de sécurité.
frontsq|Squat avant barre|Quadriceps|B|s|Barre sur l'avant des épaules, buste très droit.
goblet|Goblet squat|Quadriceps|H|c|Haltère contre la poitrine, coudes entre les genoux en bas.
bulg|Fentes bulgares haltères (/ jambe)|Quadriceps|H|c|Pied arrière sur le banc, descends droit vers le bas.
fentes|Fentes marchées haltères|Quadriceps|H|c|Grands pas, buste droit, genou avant au-dessus du pied.
fentesarr|Fentes arrière haltères|Quadriceps|H|c|Pas en arrière : plus doux pour les genoux.
stepup|Step-up haltères|Quadriceps|H|c|Monte sur le banc en poussant avec la jambe du haut.
kbgoblet|Goblet squat kettlebell|Quadriceps|K|c|Kettlebell tenue par les cornes contre la poitrine.
squatpdc|Squat au poids du corps|Quadriceps|C|c|Échauffement idéal ; fesses en arrière, talons au sol.
jumpsq|Squat sauté|Quadriceps|C|c|Explosif vers le haut, réception souple.
sissy|Sissy squat|Quadriceps|C|i|Genoux vers l'avant, buste incliné en arrière ; tiens-toi à un support.
wallsit|Chaise contre le mur (secondes)|Quadriceps|C|i|Cuisses parallèles au sol, dos collé au mur.
legcurl|Leg curl allongé|Ischios|M|i|Hanches collées au banc, ramène les talons aux fessiers.
legcurlass|Leg curl assis|Ischios|M|i|Cuisses bien bloquées, descends lentement.
legcurldebout|Leg curl debout unilatéral|Ischios|M|i|Une jambe, bassin immobile.
sdtroum|Soulevé de terre roumain haltères|Ischios|H|c|Fesses en arrière, haltères qui glissent le long des cuisses, dos plat.
sdtunil|Soulevé de terre roumain unilatéral haltère|Ischios|H|c|Sur une jambe, l'autre part en arrière ; équilibre et ischios.
sdtsmith|Soulevé de terre roumain Smith|Ischios|S|c|La barre guidée aide à garder le dos plat.
sdtroumB|Soulevé de terre roumain barre|Ischios|B|s|Descends jusqu'au milieu des tibias en gardant le dos plat.
sdtjambestend|Soulevé de terre jambes tendues|Ischios|B|c|Genoux légèrement fléchis, charge légère, gros étirement.
goodmorning|Good morning barre|Ischios|B|c|Barre sur le dos, penche le buste en poussant les fesses en arrière.
nordic|Nordic curl|Ischios|C|c|Pieds bloqués, descends le buste le plus lentement possible.
legcurlballon|Leg curl sur ballon|Ischios|C|i|Sur le dos, talons sur le ballon, ramène-le vers toi.
ghr|Glute-ham raise|Ischios|C|c|Sur le banc GHR, remonte avec les ischios.
mhip|Hip thrust (machine)|Fessiers|M|c|Monte les hanches jusqu'à l'alignement, serre fort les fessiers.
mglute|Extension de hanche (glute machine)|Fessiers|M|i|Pousse la jambe vers l'arrière sans cambrer.
abduct|Abducteurs (machine)|Fessiers|M|i|Buste un peu penché en avant pour mieux cibler les fessiers.
adduct|Adducteurs (machine)|Fessiers|M|i|Ferme les jambes lentement, contrôle le retour.
mkickfess|Kickback fessier (machine)|Fessiers|M|i|Pousse avec le talon, bassin immobile.
kickfess|Kickback fessier poulie|Fessiers|P|i|Chevillère sur la poulie basse, jambe vers l'arrière.
abductpoulie|Abduction hanche poulie|Fessiers|P|i|Debout de profil, jambe qui part sur le côté.
pullthrough|Pull-through poulie|Fessiers|P|c|Dos à la poulie, corde entre les jambes, pousse les hanches vers l'avant.
smithhip|Hip thrust Smith|Fessiers|S|c|Haut du dos sur le banc, barre sur les hanches avec une mousse.
hipthrust|Hip thrust barre|Fessiers|B|s|Menton rentré, tiens 1 seconde en haut.
glutebridgeH|Pont fessier haltère|Fessiers|H|i|Au sol, haltère sur les hanches.
fentescroise|Fentes croisées (curtsy) haltères|Fessiers|H|c|La jambe arrière se croise derrière : cible le côté des fessiers.
kbsumo|Squat sumo kettlebell|Fessiers|K|c|Pieds très écartés, pointes vers l'extérieur.
kbswing|Kettlebell swing|Ischios|K|c|Le mouvement vient des hanches, pas des bras.
glutebridge|Pont fessier au sol|Fessiers|C|i|Talons proches des fesses, monte le bassin.
elasticwalk|Marche latérale élastique|Fessiers|E|i|Élastique au-dessus des genoux, petits pas sur le côté.
mollet|Mollets debout machine|Mollets|M|i|Descends talons bas, tiens 1 seconde en haut sur la pointe.
molletass|Mollets assis (machine)|Mollets|M|i|Cible le soléaire, utile pour la course à pied.
molletpresse|Mollets à la presse|Mollets|M|i|Pointes de pieds en bas du plateau, jambes presque tendues.
donkey|Mollets donkey (machine)|Mollets|M|i|Buste penché, grande amplitude.
molletsmith|Mollets debout Smith|Mollets|S|i|Pointes de pieds sur un disque pour plus d'amplitude.
molletunil|Mollets unilatéral haltère sur marche|Mollets|H|i|Une jambe sur une marche, haltère dans la main du même côté.
molletpdc|Mollets debout au poids du corps|Mollets|C|i|Sur une marche, beaucoup de reps.
tibial|Relevés de pointes (tibias)|Mollets|C|i|Dos au mur, relève les pointes de pieds : prévient la périostite.
crmach|Crunch machine|Abdos|M|a|Enroule le buste, ne tire pas avec les bras.
mrot|Rotation du buste (machine)|Abdos|M|a|Rotation lente, bassin bloqué.
crpou|Crunch poulie haute à genoux|Abdos|P|a|Corde derrière la tête, enroule le buste vers les genoux.
pallof|Pallof press poulie|Abdos|P|a|Résiste à la rotation : bras tendus devant toi, tiens 2 secondes.
bucheron|Bûcheron poulie (haut vers bas)|Abdos|P|a|Rotation du buste en diagonale, bras presque tendus.
bucheronbh|Bûcheron poulie (bas vers haut)|Abdos|P|a|Même geste, de la hanche vers l'épaule opposée.
landminerot|Rotation landmine|Abdos|B|a|Barre tenue bras tendus, fais-la passer d'une hanche à l'autre.
twist|Russian twist avec disque|Abdos|H|a|Pieds décollés pour plus de difficulté.
suitcase|Marche valise (un haltère)|Abdos|H|a|Un haltère lourd d'un côté, marche sans te pencher.
leg|Relevés de jambes suspendu|Abdos|C|a|Enroule le bassin vers le haut, ne te balance pas.
toes|Pieds à la barre (toes to bar)|Abdos|C|a|Version avancée des relevés de jambes.
windshield|Essuie-glaces suspendu|Abdos|C|a|Jambes en l'air, bascule-les d'un côté à l'autre.
genoux|Relevés de genoux chaise romaine|Abdos|C|a|Avant-bras sur les appuis, genoux vers la poitrine.
relevesbanc|Relevés de jambes sur banc|Abdos|C|a|Allongé, jambes tendues qui montent à la verticale.
crunchdecl|Crunch banc décliné|Abdos|C|a|Pieds bloqués, enroule le buste.
crunch|Crunch au sol|Abdos|C|a|Décolle juste les omoplates, regard vers le plafond.
bicycle|Crunch vélo|Abdos|C|a|Coude vers le genou opposé, lentement.
vups|V-ups|Abdos|C|a|Mains et pieds qui se rejoignent au-dessus du ventre.
obliquesbanc|Flexions latérales banc 45°|Abdos|C|a|De profil sur le banc, remonte avec les obliques.
planche|Planche (secondes)|Abdos|C|a|Corps droit de la tête aux talons, fessiers serrés.
plancheext|Planche bras tendus avec touches d'épaules|Abdos|C|a|Touche l'épaule opposée sans bouger les hanches.
gainlat|Gainage latéral (s / côté)|Abdos|C|a|Hanches hautes, corps aligné.
hollow|Hollow body (secondes)|Abdos|C|a|Bas du dos plaqué au sol, bras et jambes décollés.
deadbug|Dead bug|Abdos|C|a|Bas du dos collé au sol, bras et jambe opposés qui s'allongent.
birddog|Bird dog|Abdos|C|a|À quatre pattes, bras et jambe opposés tendus, dos immobile.
mountain|Mountain climbers (secondes)|Abdos|C|a|Genoux vers la poitrine en rythme, hanches basses.
roue|Roulette abdos|Abdos|C|a|Commence à genoux, va aussi loin que tu peux sans creuser le dos.
wristcurl|Curl poignets barre|Avant-bras|B|i|Avant-bras sur le banc, seuls les poignets bougent.
curlinvez|Curl inversé barre EZ|Avant-bras|B|i|Paumes vers le bas : avant-bras et brachial.
reversewrist|Curl poignets inversé haltère|Avant-bras|H|i|Paume vers le bas, relève le dos de la main.
farmer|Marche du fermier (secondes)|Avant-bras|H|c|Haltères lourds, marche droit, épaules basses.
hang|Suspension à la barre (secondes)|Avant-bras|C|i|Tiens le plus longtemps possible : grip et épaules.
platepinch|Pince disques (secondes)|Avant-bras|C|i|Deux disques face lisse dehors, tenus du bout des doigts.
wristroller|Rouleau de poignet|Avant-bras|C|i|Enroule la corde jusqu'en haut puis déroule lentement.
rameur|Rameur|Cardio|M|d|Jambes, puis buste, puis bras ; retour dans l'ordre inverse.
skierg|SkiErg|Cardio|M|d|Tire avec tout le corps en fléchissant les hanches.
velosalle|Vélo d'appartement|Cardio|M|d|Bon pour l'échauffement ou une récup active.
airbike|Assault bike|Cardio|M|d|Bras et jambes ensemble ; parfait pour du fractionné court.
tapisinc|Marche rapide sur tapis incliné|Cardio|M|d|Pente 10 à 12 %, 5-6 km/h, sans te tenir aux barres.
stepper|Stepper / escalier|Cardio|M|d|Buste droit, ne t'appuie pas sur les poignées.
elliptique|Vélo elliptique|Cardio|M|d|Doux pour les articulations, bon jour de récup.
sledpush|Poussée de traîneau|Cardio|M|d|Bras tendus, petits pas rapides, corps penché.
corde|Corde à sauter|Cardio|C|d|Petits sauts sur l'avant des pieds, poignets qui tournent.
burpees|Burpees|Cardio|C|d|Squat, planche, pompe, saut : à ton rythme.
wallball|Wall balls|Cardio|C|d|Squat puis lance le médecine-ball sur la cible au mur.
`.trim().split('\n').map(l => { const [id, n, m, eq, k, tip] = l.split('|'); const d = { s: [4, '6-8', 150], c: [3, '8-10', 120], i: [3, '12-15', 60], a: [3, '15', 45], d: [1, '10-20 min', 60] }[k]; return { id, n, m, eq, k, sets: d[0], reps: d[1], rest: d[2], tip: tip || '', q: n.replace(/\(.*?\)/g, '') + ' technique' }; });
window.EQUIP = { M: 'Machine', S: 'Smith', P: 'Poulie', H: 'Haltères', B: 'Barre', K: 'Kettlebell', E: 'Élastique', C: 'Poids du corps' };
window.MUSCLES = ['Pecs', 'Dos', 'Épaules', 'Biceps', 'Triceps', 'Quadriceps', 'Ischios', 'Fessiers', 'Mollets', 'Abdos', 'Avant-bras', 'Cardio'];
