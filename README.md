# Maison Mestier · La Maison en fabrication

[Voir le site](https://iizaanaamii-dev.github.io/Maison-mestier/atelier-en-lumiere/) · [Carnet de repérages](https://iizaanaamii-dev.github.io/Maison-mestier/atelier-en-lumiere/reperages/)

La refonte fait suivre une même identité à travers ses formats et ses échelles : une composition imprimée se relève en pavillon, révèle son assemblage, s’éclaire et devient un ensemble de supports. Le parcours associe une scène réellement modélisée en Three.js, une partition GSAP et des contenus HTML lisibles.

## Le parcours

1. **Le signe** : une affiche, du papier et une première intention.
2. **Les formats** : Affiche, Écran et Panorama transforment la composition.
3. **Le volume** : le plan se relève et construit un pavillon.
4. **Les coulisses** : le visiteur peut décomposer l’assemblage.
5. **L’ouverture** : un geste ajuste la lumière de la scène.
6. **La Maison** : les pièces se distribuent entre huit savoir-faire.
7. **Le lendemain** : l’espace devient édition, contenu et présence numérique.

Une navigation directe par chapitre et un accès aux ateliers restent disponibles. Le défilement est natif. La préférence de réduction des mouvements remplace le long parcours défilant par des chapitres sélectionnables.

Les ateliers se consultent dans un répertoire interactif et se conservent dans une sélection de projet. Trois exemples de parcours réunissent plusieurs métiers. Les études ont trois compositions — Galerie, Table et Catalogue — animées avec GSAP Flip. L’image choisie rejoint le dossier, puis retourne à sa carte. Deux lectures séparent l’intention et les annotations de fabrication.

Le menu prend la forme d’un plan de huit ateliers. Le footer contient une correspondance animée. Le contact rassemble les ateliers retenus, conserve un brouillon de session et permet de préparer puis copier un message.

## Scène et rendu de secours

`components/fabrication/scene-geometry.ts` contient la géométrie et les poses. Les mêmes objets sont exportés vers Blender pour produire la séquence de secours : 49 images principales et 11 états de contrôle, dont sept positions intermédiaires pour l’assemblage. Il ne s’agit pas d’une image plate déformée pour simuler le volume.

| Situation | Comportement |
|---|---|
| WebGL2 disponible | Géométrie réelle, caméra et lumière liées au score ; légère réponse au pointeur. |
| WebGL indisponible ou perdu | Séquence issue de la même scène, avec interpolation entre images et variantes correspondant aux commandes. |
| Mobile | Recadrage vertical, commandes tactiles, densité de pixels et cache limités. |
| Mouvement réduit | Chapitres directs, transitions immédiates, pointeur décoratif désactivé. |
| Page hors écran ou masquée | Rendu suspendu, reprise à la prochaine interaction ou intersection. |

Le cache total du secours, variantes comprises, est limité à 14 images sur petit écran et 22 sur grand écran, avec trois chargements simultanés. Le poster reste visible jusqu’à la disponibilité du premier rendu. Les images transparentes conservent la continuité du papier et de la nuit avec la page.

## Développer et exporter

```bash
npm install
npm run dev
npm run typecheck
NEXT_PUBLIC_BASE_PATH=/Maison-mestier/atelier-en-lumiere npm run build -- --webpack
```

Next.js produit un export statique dans `out/`. Le contenu est publié dans `atelier-en-lumiere/` sur `gh-pages`. Les routes utilisent `path()` et `atelierPath()` pour respecter le préfixe. Les huit pages ateliers et les trois pages d’études conservent leurs URLs. `version.json` associe une publication à son commit source.

## Principaux fichiers

| Fichier | Rôle |
|---|---|
| `components/fabrication/FabricationHome.tsx` | Score partagé, chapitres, ateliers et composition de parcours. |
| `components/fabrication/FabricationScene.tsx` | Rendu Three.js et lecteur de séquence, chargement et cycle de vie. |
| `components/fabrication/scene-geometry.ts` | Géométrie, matériaux, lumières et poses. |
| `components/fabrication/FabricationProjects.tsx` | Galerie Flip, transferts d’image et dossiers annotés. |
| `components/fabrication/FabricationShell.tsx` | Navigation, plan, contact, footer et pointeur. |
| `components/fabrication/useFabricationDialog.ts` | Dialogues natifs, focus et verrou de défilement partagé. |
| `components/fabrication/fabrication-data.ts` | Chapitres et sélection de projet. |
| `art/fabrication-README.md` | Reproduction des textures et des rendus de la scène. |
| `lib/ateliers.json` | Source éditoriale des huit métiers. |

## Contenus et contact

Le Portique, L’empreinte et L’entracte sont explicitement des **études de création**, pas des références clients. Les descriptions et annotations correspondent aux images utilisées. L’atelier Visibilité traite le SEO, le GEO et les campagnes, conformément au contenu métier.

Aucun envoi de formulaire n’est simulé. Sans `NEXT_PUBLIC_CONTACT_EMAIL`, le visiteur prépare et copie son message. Avec une adresse configurée au build, il peut ouvrir sa messagerie pour relire et envoyer lui-même le message. Le brouillon reste dans la session du navigateur.

## Vérification et limites

Le projet fait l’objet d’une compilation de production et d’un contrôle des parcours sur la version publiée. L’environnement de contrôle disponible ne dispose pas de WebGL utilisable : les captures visuelles y concernent le rendu de secours. Le rendu Three.js et sa fluidité doivent aussi être vérifiés sur des appareils disposant d’un GPU compatible avant une ouverture commerciale.

Les anciens composants et carnets restent dans le dépôt comme archives de recherche. L’accueil courant utilise exclusivement `components/fabrication/`. Les pages de laboratoire ne constituent pas la spécification du parcours courant.
