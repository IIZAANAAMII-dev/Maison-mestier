# Maison Mestier · Le Trait

Site de présentation Maison Mestier. Six familles de métiers s’explorent en faisant tourner une galerie à 360°, puis le montage d’un stand se découvre en 3D. Le projet Vercel du site complet est `maison-mestier`.

## Développement

Node.js 22 ou ultérieur.

```sh
npm ci
npm run dev
npm run typecheck
npm run build
```

Next.js exporte les pages statiques dans `out/`. La variable facultative `NEXT_PUBLIC_BASE_PATH` permet un montage sous préfixe. Le formulaire conserve la sélection d’ateliers dans la session et prépare un message dans la messagerie du visiteur. L’adresse peut être configurée via `NEXT_PUBLIC_CONTACT_EMAIL`.

## Le Trait

La scène source se trouve dans `art/trace/le-trait.blend`. Le générateur `art/trace/trace.py` documente les commandes Blender de construction, de rendu et d’export de la maquette glTF. `art/trace/edition.py` compose les ombres et les fonds puis encode les deux films. Les quatre tirages, les montages pour ordinateur et téléphone et la maquette de visite sont dans `public/trace/`.

À la première visite, une lumière traverse le papier rouge et révèle le M ivoire. Le monogramme réagit au pointeur puis s’ouvre sur l’accueil. Le lien « Revoir l’introduction » en pied de page rejoue la séquence. La préférence de mouvement réduit donne directement accès au site.

La Rotonde place les cadres, le sol et les supports dans le même espace CSS 3D. Elle utilise les photographies de démonstration générées dans `public/metiers/`, avec des cadrages portrait sur téléphone. Le glissement horizontal, le trackpad, les flèches et le cadran font tourner les métiers. Un défilement vertical poursuit la visite.

Au défilement, la vue se redresse jusqu’à projeter le sol de face. Le même dessin SVG glisse ensuite de cette projection vers la planche de la méthode. ScrollTrigger suit le défilement natif dans les deux sens. Les mesures de projection sont reprises au redimensionnement. En mouvement réduit, la Rotonde et la planche se lisent dans leur ordre naturel.

Le défilement, les trois boutons de plan et la lecture guidée passent de la maquette Blender au montage, puis à un travelling sous le portique. `art/portique/traversee.py` part de la scène montée pour rendre la visite à hauteur d’œil. Les films paysage et portrait et les images de raccord sont dans `public/portique/`. Le chargement suit la position du visiteur. Les images fixes prennent le relais lorsque la vidéo tarde ou que l’économie de données est active.

La galerie horizontale projette les tirages et leurs relevés sur une pellicule courbe en Canvas 2D. Le défilement natif gère le tactile et le trackpad. Les commandes, le glissement à la souris et le clavier donnent accès aux trois études. Les dessins et les textures se chargent à proximité de la galerie.

## Références

Dans la [capture de l’arrivée sur Lusion](https://www.landing.love/sites/lusion/), la barre pivote vers 2,8 s et la lettre découvre le premier plan vers 4,2 s. Maison Mestier reprend le principe du raccord en ouvrant le papier rouge à travers son monogramme.

Les références de la Rotonde et les minutages de Lusion, Illoca et Siena Film Foundation figurent à `/reperages/`. L’éclairage de la maquette Three.js suit les [guides de matériaux et lumière](https://github.com/CloudAI-X/threejs-skills/tree/0e181866f095b5f06d005133876e926515390d95/skills). Le défilement et la gestion du cycle de vie des animations s’appuient sur les [guides officiels GSAP](https://github.com/greensock/gsap-skills/tree/aed9cfd3277740755f6bfc1155c7aa645403b760/skills).

Les textes des ateliers et le monogramme proviennent du [dossier de marque](https://www.notion.so/40bf46178928814f8801f51e1aa5c5ed) et des [pages ateliers](https://www.notion.so/41af46178928812496cece45434d7041). Hanken Grotesk prolonge la famille [HK Grotesk repérée sur Awwwards](https://www.awwwards.com/inspiration/hk-grotesk-regular). Hanken Grotesk et Instrument Serif sont auto-hébergées, avec leurs licences OFL dans `public/licences/pavillon/`.
