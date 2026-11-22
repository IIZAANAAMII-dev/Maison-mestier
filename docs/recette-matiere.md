# Recette — La matière en mouvement

Révision de la direction de Maison Mestier, le 22 novembre 2026. Cette note distingue les comportements observés dans le navigateur des vérifications de code.

## Direction et contenu

- Nouvelle page d’accueil : photographie architecturale, « Vos idées, en grand. », manifeste, étude de matière en trois mouvements, huit ateliers, rail de trois études, méthode et correspondance.
- Palette papier, encre, laiton et rouge cachet ; typographies locales Bodoni Moda, Instrument Sans et IBM Plex Mono.
- Les huit ateliers gardent leur ordre et leur contenu validé dans `lib/ateliers.json`. Les trois recherches restent explicitement des études de création.
- Le menu, les fiches, le contact et les pages internes partagent la même navigation et les mêmes règles de mouvement.

## Vérifications effectuées dans le navigateur

| Parcours | Résultat observé |
| --- | --- |
| Accueil à 1363 × 936 | Entrée du titre, image plein cadre, contraste et liens de navigation contrôlés visuellement. |
| Manifeste | Espacement entre les mots corrigé ; texte lisible avant et après sa révélation. |
| Sculpture | Les commandes des trois mouvements changent la progression et la pose du rendu de secours ; vérification des états initial, ouvert et final. |
| Menu | Ouverture et fermeture animées, navigation vers le contact, absence de superposition de dialogues. |
| Fiche d’atelier | Ouverture depuis l’index, contenu défilable, lien vers la page complète, contexte d’atelier transmis au contact. |
| Contact | Validation du formulaire, préparation d’un brouillon, copie et retour de confirmation testés avec des données fictives. Aucun message envoyé. |
| Arrivée directe depuis Digital | Le lien `?atelier=digital#contact` ouvre le formulaire avec Digital sélectionné. Un défaut de styles invisibles lors du rejeu des effets React a été corrigé dans le hook de dialogue. |
| Clavier | Échap ferme le dialogue ; le focus revient au déclencheur et le défilement de la page est restauré. |
| Rail des études | Commande suivante jusqu’à la troisième étude, butée finale et désactivation du bouton suivant vérifiées. |
| Largeurs 390 et 320 px | Contrôle par iframe de largeur réelle, sans débordement horizontal ; menu, fiches et contact lisibles. Les champs de contact sont à 16 px sur mobile. |

Le contrôle responsive utilise un navigateur de bureau et des cadres de largeur fixe. Il ne remplace pas un essai sur un iPhone ou un appareil Android physique.

## Animation et ressources

Le défilement reste natif. Une timeline GSAP et ScrollTrigger pilotent ensemble les textes et la progression de la sculpture. La géométrie et ses poses sont partagées entre la scène Three.js et l’export Blender ; ce dernier produit 25 images WebP en 1280 × 900 pour les navigateurs sans WebGL.

Les éléments lourds sont chargés près de leur section. La scène et la séquence cessent leurs boucles de dessin hors champ et dans un onglet masqué. La séquence charge au maximum trois images simultanément, privilégie les poses proches et conserve une image déjà disponible pendant les chargements. Les images voisines sont interpolées sans mise à jour React à chaque frame.

La préférence de mouvement réduit supprime les animations de parcours et propose les trois poses par activation explicite. L’économie de données conserve une image fixe jusqu’à l’activation de l’étude. Le curseur enrichi est réservé aux pointeurs fins ; le curseur natif reste disponible.

Les dialogues utilisent `showModal()`, le confinement natif du focus, une timeline réversible et un compteur partagé de verrouillage du scroll. Les animations sont nettoyées au démontage.

Le rejeu des effets en React Strict Mode remet les styles du dialogue dans un état visible et restaure son verrou si le panneau est toujours ouvert. Un ancien événement de fermeture ne peut plus interrompre un panneau déjà rouvert.

## Limites précises

- Le navigateur de contrôle ne dispose pas de WebGL. Le rendu animé de secours a donc été vérifié visuellement et par ses attributs de progression. La géométrie de la version 3D a été contrôlée, mais son éclairage GPU, ses variantes de matière et sa cadence doivent encore être observés sur un appareil avec WebGL actif.
- Les données fictives du formulaire servent uniquement au contrôle local. Le formulaire prépare et copie un brouillon ; il n’existe pas de service d’envoi configuré. `NEXT_PUBLIC_CONTACT_EMAIL` pourra être défini lorsque le destinataire sera validé.
- Les captures et storyboards historiques conservés dans le dépôt documentent des directions antérieures. Le carnet les présente comme archives.
- Aucune note Lighthouse, récompense Awwwards ni cadence minimale n’est annoncée sans mesure correspondante.

## Construction et publication

```sh
npm run typecheck
NEXT_PUBLIC_BASE_PATH=/Maison-mestier/atelier-en-lumiere npm run build -- --webpack
```

L’export statique est publié dans `atelier-en-lumiere/` sur la branche `gh-pages`, avec une révision `version.json`. La branche source de cette refonte est `feat/maison-mestier-choregraphie`.

Résultat de la vérification finale avant publication :

- TypeScript : sortie 0.
- Build optimisé Webpack et génération des 16 entrées statiques : sortie 0.
- 17 fichiers HTML exportés, incluant les variantes de la page d’erreur ; 49 cibles locales et 4 ressources de polices vérifiées, sans cible absente.
- 25 images WebP et un poster, tous décodables en 1280 × 900 ; 560 696 octets au total (environ 548 Kio).
- Images de `out/matiere/` identiques à celles de `public/matiere/`.
- Page temporaire de contrôle responsive retirée de l’export.
- `git diff --check` : aucune erreur.

Les références, leurs liens et les principes retenus figurent dans [le dossier de direction](refonte-matiere-reference.md).
