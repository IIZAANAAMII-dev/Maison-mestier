# Maison Mestier · L’atelier en lumière

**[Entrer dans la visite sur GitHub Pages](https://iizaanaamii-dev.github.io/Maison-mestier/atelier-en-lumiere/)**

[Voir les cinq transitions en portrait](https://iizaanaamii-dev.github.io/Maison-mestier/atelier-en-lumiere/film/raccords-mobile.mp4) · [Voir le plan du cachet](https://iizaanaamii-dev.github.io/Maison-mestier/atelier-en-lumiere/film/ouverture-mobile.mp4)

Un cachet imprime la cire. Sous un oculus, un ruban de papier vergé découvre son revers de laiton puis devient l’entrée d’un stand. Quatre tableaux racontent comment cette maison de communication du Sud de la France accompagne un projet, de l’invitation à la relance après le salon.

[![Vue de la visite sur ordinateur](docs/captures/accueil-bureau.webp)](https://iizaanaamii-dev.github.io/Maison-mestier/atelier-en-lumiere/)

## Entrées dans la visite

- L’introduction se joue à la première arrivée. Le défilement et les quatre repères pilotent la suite. Le bouton « Revoir l’intro » permet de retrouver le plan du cachet. [Rejoindre le portique](https://iizaanaamii-dev.github.io/Maison-mestier/atelier-en-lumiere/#tableau-portique)
- Les huit métiers et les trois recherches s’ouvrent en dossiers. Chaque dossier a aussi sa page complète et son adresse partageable. [Feuilleter les ateliers](https://iizaanaamii-dev.github.io/Maison-mestier/atelier-en-lumiere/#ateliers)
- La table lumineuse superpose un relevé des contours au rendu éclairé. À l’établi, on peut manipuler le pli, le sceau, la trame et le rideau de scène, puis déplacer la lumière pour examiner le grain. [Table lumineuse](https://iizaanaamii-dev.github.io/Maison-mestier/atelier-en-lumiere/#recherches) · [Établi](https://iizaanaamii-dev.github.io/Maison-mestier/atelier-en-lumiere/#matiere)
- Le carnet suit un exemple de lancement de produit sur un salon. La correspondance prépare un brouillon que le visiteur peut copier ou ouvrir dans sa messagerie. [Carnet de conduite](https://iizaanaamii-dev.github.io/Maison-mestier/atelier-en-lumiere/#methode)

La direction artistique reprend les planches Notion, les références Awwwards et les matériaux photogrammétriques de la scène. La recette décrit les parcours vérifiés et le matériel de test. [Direction artistique](docs/direction-artistique.md) · [Recette et captures](docs/recette.md)

## Développer et exporter

Depuis la racine du dépôt, avec Node.js 22 ou ultérieur et npm.

```sh
npm ci
npm run dev
```

Le serveur de développement s’ouvre sur <http://localhost:3000>. Next.js produit des pages HTML statiques. Three.js et React Three Fiber dessinent les volumes de la visite. GSAP et ScrollTrigger synchronisent les poses, les changements de chapitre et l’ouverture des feuillets. Les visiteurs peuvent choisir la vue fixe. La préférence de mouvement réduit, l’économie de données et l’absence de WebGL donnent accès aux tirages.

```sh
npm run typecheck
NEXT_PUBLIC_BASE_PATH=/Maison-mestier/atelier-en-lumiere npm run build
```

L’export se trouve dans `out/`. Pour un domaine à la racine, la commande est `npm run build`. L’aperçu GitHub Pages occupe le répertoire `atelier-en-lumiere/` sur la branche `gh-pages`. Son [relevé de version](https://iizaanaamii-dev.github.io/Maison-mestier/atelier-en-lumiere/version.json) donne le commit source.

Les textes des ateliers sont dans [lib/ateliers.json](lib/ateliers.json). Les modèles de la visite, le film et les relevés de la table ont leurs propres sources. [Visite 3D](components/visit/scene) · [Scène et encodage du prologue](art) · [Génération des relevés](scripts/graver-les-etudes.mjs)

Le monogramme du cachet est une étude. Quand la Maison aura confirmé son adresse de réception, définir `NEXT_PUBLIC_CONTACT_EMAIL` au moment de la compilation pour la renseigner dans les brouillons.
