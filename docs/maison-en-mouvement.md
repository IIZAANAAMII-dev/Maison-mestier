# Maison Mestier — La Maison en mouvement

Le parcours d’accueil devient une visite spatiale continue. Le défilement natif pilote une caméra à travers cinq salles ; chaque salle propose un geste volontaire et une entrée vers les savoir-faire de la Maison.

## Parcours

| Scène | Matière / objet | Geste | Passage |
| --- | --- | --- | --- |
| Le seuil | Pli, arches articulées, papier et laiton | Déployer / replier | Travelling vers l’atelier d’impression |
| L’empreinte | Presse et feuilles imprimées | Actionner la presse | Traversée vers le théâtre |
| L’entracte | Portique, lumière, rideaux de velours déformés | Ouvrir / refermer | Passage de la scène à la matière numérique |
| La traversée | Monogramme composé de volumes instanciés | Disperser / rassembler | Entrée dans la constellation |
| La constellation | Huit portes disposées dans l’espace | Rotation et sélection d’un atelier | Fiche atelier, Maison et contact |

Le menu donne un accès direct aux cinq scènes, accompagné d’un plan en perspective. Le pied de page prolonge la visite par une porte qui s’ouvre au survol ou au focus, puis le formulaire existant. Les textes des huit ateliers et leurs routes restent issus de `lib/ateliers.json`.

## Organisation du code

- `components/experience/ExperienceHome.tsx` : progression, commandes, navigation, contenu accessible et sélection de l’atelier.
- `components/experience/WorldScene.tsx` : rendu Three.js, éclairage, chargement d’environnement, redimensionnement, visibilité et sélection par raycast.
- `components/experience/world-builder.ts` : géométries, matériaux, scènes et gestes.
- `components/experience/world-camera.ts` : trajectoire de caméra, également utilisée pour les contrôles de cadrage sans GPU.
- `components/experience/SpatialFallback.tsx` : édition légère en volumes CSS 3D pour les navigateurs sans WebGL ; les mêmes commandes restent utilisables.
- `components/galerie/MaisonChrome.tsx` : navigation, menu, pied de page et dialogue de contact.
- `public/experience/parcours-3d.svg` : storyboard annoté, généré par `art/storyboard-spatial.py` et consultable depuis les repérages.

## Choix d’usage

Le scroll n’est pas intercepté. Les cinq étapes se rejoignent par ancres. Les panneaux inactifs ne capturent pas le focus. Une pause arrête les mouvements ambiants tout en conservant les actions volontaires et la navigation. La préférence de réduction des mouvements est appliquée au chargement ; une reprise explicite reste possible.

Le moteur s’arrête hors écran et lorsque l’onglet est masqué. La définition de rendu est plafonnée, les objets numériques sont instanciés et les salles éloignées sont masquées. Le modèle de presse dispose d’un remplacement procédural en cas d’indisponibilité de son fichier. Une défaillance WebGL laisse apparaître l’édition CSS en perspective.

Les scènes sont des études de création, pas des réalisations client. Aucun prix n’est attribué au projet. Le formulaire conserve son fonctionnement de préparation d’un message : aucun envoi serveur n’est ajouté.

## Vérification

Compilation TypeScript et export statique Next.js. Contrôles numériques des cinq scènes : sommets finis après animation, variation effective des géométries ou matrices pour chaque geste, projection des sujets dans les cadrages ordinateur et portrait. Des rendus hors ligne des géométries servent à contrôler les volumes ; ils ne remplacent pas une capture du moteur WebGL.

Le navigateur de vérification fourni désactive WebGL. La vérification visuelle interactive porte donc sur l’édition CSS 3D, les commandes, les ancres, le menu et les pages publiées. La validation visuelle finale du rendu WebGL sur GPU reste à compléter dans un navigateur qui l’autorise.

## Références

- [Moooi — Paper Play](https://www.awwwards.com/sites/moooi-paper-play) : récit par la matière.
- [Lusion](https://lusion.co/) : objets manipulables et expérimentation spatiale.
- [Cartier — Watches & Wonders 2024, Immersive Garden](https://immersive-g.com/projects/cartier-watches-and-wonders-24/) : parcours au défilement et interactions ponctuelles dans des univers 3D.
- [Studio Freight](https://studiofreight.com/work/studio-freight) : continuité de l’identité à travers les différentes expressions.

Ces références orientent les principes de conception. Les scènes de Maison Mestier sont construites pour le projet.
