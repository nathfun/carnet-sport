# Carnet sport

App de muscu perso qui marche **sans réseau** (PWA) : séances guidées, chrono total + repos, charges et historique, programme modifiable, flamme hebdo et paliers, photos/vidéos d'exercices, raccourcis Spotify et Strava, coach Claude quand il y a du réseau.

Toutes les données restent sur le téléphone (localStorage + IndexedDB). Pense à exporter de temps en temps (Réglages → Exporter).

Après une modification de l'app, change `VERSION` dans `sw.js` pour que les téléphones récupèrent la nouvelle version.
