# Recette de L’atelier en lumière

L’export de production a été servi sous `/Maison-mestier/atelier-en-lumiere/`, le chemin de la prévisualisation GitHub Pages. Les captures ci-dessous viennent de cet export. Le [relevé de version de la prévisualisation](https://iizaanaamii-dev.github.io/Maison-mestier/atelier-en-lumiere/version.json) identifie le commit source publié.

[Accueil sur ordinateur](captures/accueil-bureau.webp) · [Accueil à 390 px](captures/accueil-mobile-390.webp) · [Accueil à 320 px](captures/accueil-mobile-320.webp) · [Stands & Salons](captures/atelier-stands-salons.webp) · [Le pli en 3D](captures/laboratoire.webp)

## Parcours vérifiés

| Essai | Observation |
| --- | --- |
| Index et fiches | Les huit liens de l’accueil s’ouvrent avec Entrée. Chaque URL charge directement, porte son titre et sa description, et présente les quatre ou cinq chapitres de l’atelier. Le retour permet de reprendre l’index. |
| Recherches | Le portique, L’empreinte et L’entracte s’ouvrent depuis le carnet et renvoient à leur atelier et à l’étude de matière correspondante. |
| Clavier | Le lien d’évitement place le focus sur le contenu. Le menu s’ouvre avec Entrée, ses liens se parcourent avec Tab et Échap ramène au bouton. Le retour de la fiche Éphémère retrouve le lien de l’index et son visuel. |
| Brouillon | La fiche Stands & Salons présélectionne le bon atelier. Les espaces seuls sont refusés. Le brouillon conserve les accents, les retours à la ligne et les caractères spéciaux. En cas de refus du presse-papiers, le texte se sélectionne pour une copie manuelle. Aucun e-mail n’a été envoyé. |
| Mise en page | L’accueil, les huit fiches et les trois recherches tiennent dans chaque largeur testée. Le bouton des huit ateliers se trouve dans le premier écran sur ordinateur et sur les deux mobiles émulés. |
| Études 3D | Le pli, le sceau, la trame et la scène donnent quatre rendus distincts. Le curseur du pli passe de 20 % à 80 %, puis revient à 20 % avec une image identique pixel par pixel dans ce navigateur. L’autre angle modifie effectivement le rendu. |
| Lecture du geste | Lecture, pause, reprise et relecture fonctionnent. Pendant le défilement hors du laboratoire, le curseur et la progression du rendu restent immobiles, puis reprennent au retour. |
| Vue fixe et mouvement réduit | La vue fixe libère le canevas. La préférence de mouvement réduit conserve les quatre tirages, les ateliers et le contact sans charger le moteur 3D. Sa modification à chaud est prise en compte. |
| WebGL indisponible ou perdu | Sans contexte WebGL 2, les boutons affichent les quatre tirages. La perte simulée d’un contexte actif ramène à l’image fixe et permet de continuer le parcours. |
| JavaScript désactivé | Le menu natif, les liens vers les huit fiches, les quatre études fixes et le formulaire HTML de préparation d’e-mail restent disponibles. |

Les 12 pages contiennent chacune un titre principal. Le contrôle du HTML exporté a résolu les 367 liens et ancres internes, les 200 références de ressources et les associations de libellés.

## Affichage et conditions d’essai

Chromium 156 sur Linux, piloté avec Playwright. L’écran de bureau mesure 1 440 × 900 pixels CSS à DPR 1. Les écrans tactiles émulés mesurent 390 × 844 et 320 × 740 pixels CSS à DPR 2. Les interactions WebGL utilisent le moteur logiciel SwiftShader. Ces essais couvrent le fonctionnement des scènes. Le contrôle axe-core 4.14.1 sur l’accueil, Événement et Le portique à 390 px en mode de mouvement réduit relève zéro violation parmi les règles WCAG A/AA testées. La fluidité sur des GPU de téléphones physiques et le rendu sous Safari et Firefox restent à mesurer.

## Chargement mobile

Trois visites à froid le 19 novembre 2026, dans trois contextes Chromium indépendants. Cache désactivé, CPU ralenti quatre fois, latence ajoutée de 150 ms, débit descendant de 1,6 Mbit/s et montant de 750 kbit/s. Le serveur local applique gzip aux réponses HTML, CSS et JavaScript. La première vue est mesurée sans défilement, une fois les polices et l’image de couverture chargées.

| Visite | Premier affichage de contenu (FCP) | Plus grand élément affiché (LCP) | Décalages de mise en page (CLS) | Transfert initial |
| --- | ---: | ---: | ---: | ---: |
| 1 | 1,05 s | 1,87 s | 0,003 | 376,5 ko |
| 2 | 0,73 s | 1,76 s | 0,000 | 376,5 ko |
| 3 | 0,80 s | 1,77 s | 0,000 | 376,5 ko |
| Médiane | 0,80 s | 1,77 s | 0,000 | 376,5 ko |

Le LCP correspond à l’image de couverture mobile. Le poids initial additionne la navigation et les ressources de la première vue selon Resource Timing, soit 18 requêtes. Les valeurs sont des mesures de laboratoire sur cet export.

Le principal fichier du laboratoire 3D arrive à l’entrée de la scène. Il pèse 249,6 ko en gzip. Le module d’animation ajoute 27,2 ko. Ces fichiers restent absents de la première vue et du mode de mouvement réduit par défaut.
