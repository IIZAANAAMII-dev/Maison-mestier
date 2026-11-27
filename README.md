# Maison Mestier · Le Trait

Site de présentation Maison Mestier. Une sculpture de métal laqué se déplie en stand d’exposition, puis trois études de création se parcourent sur une pellicule horizontale. Le projet Vercel du site complet est `maison-mestier`.

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

À la première visite, le poinçon de laiton pivote puis son empreinte ouvre le premier écran en trois secondes environ. Le modèle Blender et sa source se trouvent dans `art/empreinte/`. Le lien « Revoir l’introduction » en pied de page rejoue la séquence. Le défilement, les trois boutons d’étape et la lecture guidée conduisent la même séquence. Les images fixes prennent le relais en mode économie de données. La préférence de mouvement réduit donne directement accès à l’offre, aux trois études et aux ateliers. Les visuels des offres Événements et Identités sont des illustrations originales.

La galerie horizontale projette les tirages et leurs relevés sur une pellicule courbe en Canvas 2D. Le défilement natif gère le tactile et le trackpad. Les commandes, le glissement à la souris et le clavier donnent accès aux trois études. Les dessins et les textures se chargent à proximité de la galerie.

## Références

Dans la [capture de l’arrivée sur Lusion](https://www.landing.love/sites/lusion/), la barre pivote vers 2,8 s et la lettre découvre le premier plan vers 4,2 s. Maison Mestier reprend ce raccord avec le poinçon, son empreinte et le ruban vermillon du premier écran.

Les minutages analysés et les liens vers les films de Lusion et Siena Film Foundation figurent à `/reperages/`. L’éclairage de la maquette Three.js suit les [guides de matériaux et lumière](https://github.com/CloudAI-X/threejs-skills/tree/0e181866f095b5f06d005133876e926515390d95/skills). Le défilement et la gestion du cycle de vie des animations s’appuient sur les [guides officiels GSAP](https://github.com/greensock/gsap-skills/tree/aed9cfd3277740755f6bfc1155c7aa645403b760/skills).

Les textes des ateliers et le monogramme proviennent du [dossier de marque](https://www.notion.so/40bf46178928814f8801f51e1aa5c5ed) et des [pages ateliers](https://www.notion.so/41af46178928812496cece45434d7041). Junicode et Geist sont auto-hébergées avec leurs licences dans `public/licences/pavillon/`.
