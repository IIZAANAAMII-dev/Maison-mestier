# Maison Mestier · La matière en mouvement

**[Voir le site en ligne](https://iizaanaamii-dev.github.io/Maison-mestier/atelier-en-lumiere/)** · [Références et direction de mouvement](docs/refonte-matiere-reference.md) · [Recette de la refonte](docs/recette-matiere.md)

Une expérience éditoriale pour une maison de communication 360 : une même direction de création relie l’identité, le site, le stand et l’événement. La refonte associe architecture imaginaire, grandes compositions typographiques et sculpture de papier au revers de laiton. Les textes, la matière et les transitions partagent une progression commune, sur un défilement natif.

## Le parcours

- **« Vos idées, en grand. »** L’accueil s’ouvre sur une architecture en plein écran. L’image, les deux lignes du titre et l’invitation à entrer composent une même ouverture GSAP.
- **Le manifeste.** « Une même idée. Toutes ses dimensions. » Une respiration ivoire présente la Maison avant l’expérience de matière.
- **La feuille devient espace.** Une sculpture originale évolue en trois mouvements : L’intuition, La transformation, La rencontre. La progression du volume et celle des textes suivent le même défilement. Les trois commandes permettent de rejoindre directement une étape.
- **Les huit ateliers.** Stands & Salons, Événement, Identité, Digital, Visibilité, Éphémère, Contenu et L’Intendance. Chaque entrée possède un aperçu au survol et au focus, un dossier en modale et une page complète avec son URL propre. Les descriptions viennent de `lib/ateliers.json`.
- **Les études de création.** Le portique, L’empreinte et L’entracte se parcourent dans un rail horizontal, au toucher, par glissement à la souris ou avec les boutons précédent et suivant. Chaque étude ouvre son dossier et conserve une page détaillée.
- **La méthode.** Écouter, Donner forme, Faire vivre : trois gestes reliés par une ligne, du premier échange au suivi du projet.
- **La correspondance.** Le footer « La suite commence par une idée. » conduit au contact et conserve un accès direct aux huit métiers.

La navigation fixe, le menu plein écran Nuit, les dossiers et le contact partagent le même vocabulaire de mouvement. Les dialogues natifs gèrent le focus, Échap et le retour au déclencheur ; leur fermeture inverse la timeline d’ouverture. Le curseur accompagne discrètement la souris, nomme certaines actions et anime légèrement les boutons magnétiques. Il laisse le pointeur système visible et se désactive sur écran tactile, dans les formulaires, dans les modales et en mouvement réduit.

Les images d’architecture et les trois dossiers sont des **études de création**. Ils ne représentent pas des réalisations clientes. Les références clients restent présentées en rendez-vous.

## La sculpture et ses modes de rendu

La géométrie est définie dans `components/matiere/paper-geometry.ts`. La scène Three.js et les rendus de secours utilisent cette même géométrie et la même progression.

| Situation | Comportement |
| --- | --- |
| WebGL disponible | Scène chargée dynamiquement à proximité de la section. La caméra et les feuilles suivent la progression ; le pointeur apporte une variation légère. Les commandes Papier, Laiton, Encre et Pause sont disponibles. |
| WebGL indisponible ou contexte perdu | Séquence Canvas 2D de 25 images WebP rendues à l’avance avec Blender, en 1 280 × 900. Les images voisines sont interpolées ; une image déjà chargée reste affichée pendant les chargements. |
| Préférence de mouvement réduit | Trois poses fixes de la séquence, choisies par les commandes d’étape. Les mouvements de parcours sont supprimés. |
| Économie de données (`saveData`) | Le poster reste affiché. La commande « Explorer la matière » permet d’activer explicitement l’expérience. |

La séquence charge d’abord sa première image, puis au maximum trois images en parallèle lorsque la section approche. Le rendu s’interrompt hors champ et lorsque l’onglet est masqué. Le cadrage mobile est recomposé autour de la sculpture ; le cyclorama se prolonge dans les espaces du cadre vertical. Les variantes de matière et l’animation libre appartiennent à la scène WebGL ; la séquence montre le papier ivoire au revers de laiton.

## Développer et exporter

**Node.js 22 ou ultérieur** est requis. Le site utilise Next.js, React, TypeScript, GSAP avec ScrollTrigger et Three.js. Les polices Bodoni Moda, Instrument Sans et IBM Plex Mono sont auto-hébergées. Les contenus et les liens restent en HTML ; la 3D est chargée côté client.

```sh
npm ci
npm run dev
```

`npm run dev` passe par `scripts/dev.mjs`, qui lance Next.js avec Webpack par défaut. Ce wrapper accepte aussi les arguments de prévisualisation `--host` et `--strictPort`, en les adaptant aux arguments de Next.js. Le défilement du site reste natif.

```sh
npm run typecheck
NEXT_PUBLIC_BASE_PATH=/Maison-mestier/atelier-en-lumiere npm run build -- --webpack
```

L’export statique est écrit dans `out/`. Pour GitHub Pages, ce dossier est publié sur la branche `gh-pages`, dans `atelier-en-lumiere/`. L’adresse publique reste inchangée. La [révision publiée](https://iizaanaamii-dev.github.io/Maison-mestier/atelier-en-lumiere/version.json) identifie le commit source associé au déploiement.

Les liens et les chemins d’assets passent par les helpers `path()` et `atelierPath()` de `lib/maison.ts` afin de respecter `NEXT_PUBLIC_BASE_PATH`. Les pages ateliers et recherches conservent leurs slugs et leurs liens directs.

## Repères dans le code

| Fichier ou dossier | Responsabilité |
| --- | --- |
| `components/matiere/MaisonHome.tsx` et `home.css` | Accueil, partition GSAP, progression de la sculpture, index des ateliers, rail et dossiers. |
| `components/matiere/PaperScene.tsx` | Rendu Three.js, lumière, matériaux, caméra et gestion du contexte WebGL. |
| `components/matiere/paper-geometry.ts` | Géométrie des feuilles et positions partagées avec les rendus de secours. |
| `components/matiere/PaperSequence.tsx` | Chargement progressif, interpolation Canvas 2D et cadrage des images de secours. |
| `components/matiere/MaisonShell.tsx` et `shell.css` | Navigation, menu, footer, contact et curseur. |
| `components/matiere/usePaperDialog.ts` | Dialogues natifs, timeline réversible, focus et verrou de défilement partagé. |
| `components/matiere/InteriorMotion.tsx` et `interiors.css` | Mise en mouvement et raccord visuel des pages intérieures. |
| `app/ateliers/[slug]/page.tsx` et `app/recherches/[slug]/page.tsx` | Pages détaillées, métadonnées, chapitres et liens entre dossiers. |
| `lib/ateliers.json` et `lib/maison.ts` | Contenus des huit métiers, études de création et helpers de chemins. |
| `art/render-paper-export.mjs` | Export de la géométrie et des poses Three.js vers les données de rendu. |
| `art/render-paper-fallback.py` | Reconstruction et rendu de la séquence dans Blender. |
| `public/matiere/poster.webp` et `public/matiere/frames/` | Poster et 25 images de secours. |

## Le contact

Le contact prépare un **brouillon à copier**, conservé dans la session de l’onglet. Il n’envoie aucun message et n’affiche pas de confirmation d’envoi. Un dossier atelier transmet son contexte au formulaire via l’événement `mestier:contact` ; une arrivée directe avec `?atelier=<slug>#contact` ouvre aussi le bon atelier.

Lorsque l’adresse de réception est validée, définir `NEXT_PUBLIC_CONTACT_EMAIL` au moment du build pour ajouter l’action « Ouvrir ma messagerie ». L’utilisateur relit et envoie lui-même le message depuis son application de messagerie.

## Vérification et références

Le build de production a réussi. Le rendu de secours, notamment son cadrage et les raccords de couleur sur mobile, a été contrôlé dans le navigateur. **Le rendu WebGL temps réel n’a pas été vérifié visuellement dans cet environnement : aucun GPU/WebGL utilisable n’était disponible pour ce contrôle.** Ses matières, sa réponse au pointeur et sa fluidité doivent encore être examinées sur un appareil compatible.

Le [compte rendu de recette](docs/recette-matiere.md) précise les parcours contrôlés et les limites de validation. Les références Awwwards, les skills GitHub consultés et leur traduction dans la refonte sont documentés dans [Références et direction de mouvement](docs/refonte-matiere-reference.md). Le projet ne revendique aucune récompense Awwwards.

## Archives de création

Le [carnet de repérages](https://iizaanaamii-dev.github.io/Maison-mestier/atelier-en-lumiere/reperages/) présente la partition actuelle et ses références. Il conserve aussi un ancien storyboard, explicitement identifié comme archive. Les autres documents de traversée décrivent des éditions précédentes et ne constituent pas la spécification de ce parcours. Les anciens composants restent disponibles dans l’historique et les répertoires de recherche ; l’accueil actuel utilise `components/matiere/`.
