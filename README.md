# Maison Mestier · Le Trait

Site de présentation Maison Mestier. Le parcours présente huit ateliers, trois études de création et une maquette de stand à manipuler. Le projet Vercel du site complet est `maison-mestier`.

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

Le premier écran, l’entrée dans le stand et son dernier plan occupent un seul cadre au défilement. Les rendus portrait et paysage partagent une trajectoire de caméra. Les contours SVG proviennent de la projection de la scène Blender aux deux extrémités. Le script `art/sequence/traversee.py` construit les deux cadrages. Le traitement utilise Blender, FFmpeg et Python avec NumPy, SciPy et Pillow. Les films H.264 et leurs images fixes se trouvent dans `public/sequence/`.

Les huit fiches métiers sont accessibles depuis le même sommaire. Le bureau de correspondance s’ouvre aussi depuis chacune d’elles. La page numérique présente des prototypes de boutique, de site vitrine et d’application. Les images de papeterie des ateliers Visibilité et Intendance sont modélisées dans `art/portique/carnets.py`.

## Références

Le carnet `/reperages/` documente les références du parcours, dont Lusion v3, Hearst Exhibit et Siena Film Foundation. Les déplacements du relevé suivent les recommandations de [GSAP](https://github.com/greensock/gsap-skills/tree/main/skills/gsap-performance). Le pictogramme d’interface de l’atelier numérique vient de [Lucide](https://github.com/lucide-icons/lucide), avec leur licence dans `public/licences/lucide.txt`.

Les textes des ateliers et le monogramme proviennent du [dossier de marque](https://www.notion.so/40bf46178928814f8801f51e1aa5c5ed) et des [pages ateliers](https://www.notion.so/41af46178928812496cece45434d7041). Hanken Grotesk prolonge la famille [HK Grotesk repérée sur Awwwards](https://www.awwwards.com/inspiration/hk-grotesk-regular). Hanken Grotesk et Instrument Serif sont auto-hébergées, avec leurs licences OFL dans `public/licences/pavillon/`.
