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

Le seuil met en regard la scène Blender et son dessin, projeté depuis la même caméra. En portrait, le défilement reste libre. La commande Scène / Plan permet aussi de choisir son point de vue. Les sources et les rendus se trouvent dans `art/portique/seuil.py` et `public/seuil/`.

`art/portique/cahier.py` prépare le film de six secondes de la maquette. Sa lecture démarre à la demande et utilise les contrôles vidéo du navigateur. Les trois études exposent leurs tirages sur une table verticale sur téléphone. Chaque étude permet de choisir un détail du tirage et de lire sa légende.

Les huit fiches métiers sont accessibles depuis le même sommaire. Le bureau de correspondance s’ouvre aussi depuis chacune d’elles. La page numérique présente des prototypes de boutique, de site vitrine et d’application. Les images de papeterie des ateliers Visibilité et Intendance sont modélisées dans `art/portique/carnets.py`.

## Références

Le carnet `/reperages/` présente Paper Play de Moooi, Office Chair Finder de Vitra et Siena Film Foundation. Les déplacements du relevé suivent les recommandations de [GSAP](https://github.com/greensock/gsap-skills/tree/main/skills/gsap-performance). Les pictogrammes du registre et de l’atelier numérique viennent de [Lucide](https://github.com/lucide-icons/lucide), avec leur licence dans `public/licences/lucide.txt`.

Les textes des ateliers et le monogramme proviennent du [dossier de marque](https://www.notion.so/40bf46178928814f8801f51e1aa5c5ed) et des [pages ateliers](https://www.notion.so/41af46178928812496cece45434d7041). Hanken Grotesk prolonge la famille [HK Grotesk repérée sur Awwwards](https://www.awwwards.com/inspiration/hk-grotesk-regular). Hanken Grotesk et Instrument Serif sont auto-hébergées, avec leurs licences OFL dans `public/licences/pavillon/`.
