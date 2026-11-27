# Maison Mestier · Le pavillon

Le site de présentation réunit la visite du pavillon, huit ateliers, trois études de création, un laboratoire 3D et la correspondance. Le projet Vercel est `maison-mestier`.

## Lancer le site

Node.js 22 ou ultérieur.

```sh
npm ci
npm run dev
npm run typecheck
npm run build
```

Next.js exporte les pages statiques dans `out/`. La variable facultative `NEXT_PUBLIC_BASE_PATH` permet de monter le site sous un préfixe. Le formulaire prépare un courriel dans la messagerie du visiteur et conserve son brouillon et sa sélection d’ateliers dans la session. L’adresse par défaut est `discutons@maisonmestier.fr`. Elle peut être remplacée avec `NEXT_PUBLIC_CONTACT_EMAIL`.

## Scène et mouvement

La source éditable du pavillon et son générateur se trouvent dans `art/pavillon/`. Les caméras, le plissé du voile, l’ossature de laiton et les matériaux font partie de la scène. Les tirages et travellings pour le navigateur sont dans `public/pavillon/`. Le laboratoire importe la maquette glTF à la demande, calcule une image lors d’un changement de vue et propose trois tirages lorsque WebGL est indisponible.

Le défilement est natif. Le premier travelling suit le mouvement de la page. À la section suivante, un cadre portrait s’ouvre sur l’intérieur du pavillon. La pellicule des études accepte le balayage, les flèches et le clavier. La préférence de mouvement réduit conserve une lecture directe de toutes les sections.

Les timelines utilisent une portée GSAP locale, une configuration par préférence de mouvement et un nettoyage à la sortie. Les principes de mise en œuvre viennent des [skills officiels de GreenSock](https://github.com/greensock/gsap-skills/tree/aed9cfd3277740755f6bfc1155c7aa645403b760/skills). Les réglages de rugosité, de métal et de lumière du laboratoire suivent les [guides Three.js sur les matériaux et l’éclairage](https://github.com/CloudAI-X/threejs-skills/tree/0e181866f095b5f06d005133876e926515390d95/skills). Les références de mouvement et leur interprétation sont consultables à `/reperages/`.

Les textes des ateliers et le monogramme reprennent le [dossier de marque](https://www.notion.so/40bf46178928814f8801f51e1aa5c5ed) et les [pages ateliers](https://www.notion.so/41af46178928812496cece45434d7041). Junicode et Geist sont auto-hébergées. Leurs licences se trouvent dans `public/licences/pavillon/`.
