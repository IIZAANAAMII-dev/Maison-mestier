# Recette de L’atelier en lumière

Les captures et les mesures ci-dessous proviennent de l’export de production servi localement sous le préfixe GitHub Pages `/Maison-mestier/atelier-en-lumiere/`. Le relevé public indique la révision servie sur GitHub. [Version de la prévisualisation](https://iizaanaamii-dev.github.io/Maison-mestier/atelier-en-lumiere/version.json)

[Accueil sur ordinateur](captures/accueil-bureau.webp) · [Accueil à 390 px](captures/accueil-mobile-390.webp) · [Accueil à 320 px](captures/accueil-mobile-320.webp) · [Prologue](captures/ouverture.webp) · [Le portique](captures/tableau-portique.webp) · [Raccord mobile vers la correspondance](captures/raccord-mobile.webp) · [Dossier ouvert](captures/dossier.webp) · [Dossier mobile](captures/dossier-mobile.webp) · [Fiche Stands & Salons](captures/atelier-stands-salons.webp) · [L’établi](captures/laboratoire.webp)

## Parcours exercés

| Surface | Geste et résultat observés |
| --- | --- |
| Ouverture | Le premier passage montre le cachet animé. Les rappels de présentation vidéo du navigateur confirment des images successives jusqu’au dernier photogramme à 2,625 s pour une durée de 2,667 s. La touche Entrée sur Passer ferme l’ouverture. Revoir la rejoue et un rechargement dans la même session laisse la visite ouverte. Le film est lu depuis sa source portrait sur téléphone. |
| Répertoire et carnet | Entrée ouvre le dossier de Stands & Salons. Les huit ateliers et les trois recherches s’ouvrent depuis l’accueil à 320 px. Les onze fiches éditoriales chargent directement. Dans les huit ateliers, le navigateur retrouve le titre, la description, les chapitres et le lien de correspondance propre à la discipline. |
| Raccords au toucher | À 390 px, un glissement vertical de 223 px fait passer chaque raccord de 0,244 à 0,621. Un geste inverse ramène les cinq à 0,244. Les arêtes et les cinq objets à l’entrée des sections changent de pose et reprennent leur transformation initiale au retour. Après les gestes, le lien d’atelier reste activable. En mouvement réduit, les décors restent fixes. |
| Table à calque | Les flèches du clavier changent de feuille entre Le portique, L’empreinte et L’entracte. Le curseur et les deux boutons changent la découpe du relevé, de 0 à 100 %. Dans la fiche Le portique, les trois positions de loupe affichent trois légendes distinctes. |
| Dossier plein écran | Treize tabulations restent dans le dialogue. Les chapitres se déplient. Suivant remplace le dossier courant, Retour ferme la lecture, Avance retrouve le dernier dossier, puis Échap rend le focus à l’atelier. Ctrl+clic ouvre la fiche dans un autre onglet. Un lien profond de recherche permet aussi de fermer sur place ou d’ouvrir la page complète. |
| Parcours 3D | Le premier dessin a été observé dans un contexte WebGL 2. Les poses réelles du canevas passent par 0, 0,333, 0,667 et 1. À 390 et 900 px, les quatre liens profonds conservent leur pose après redimensionnement. La molette et le retour à des positions intermédiaires modifient le dessin dans les deux sens. La vue fixe retire le canevas, sa réactivation le recrée, et la perte simulée du contexte ramène aux tirages. |
| Matières 3D | Sur le canevas du parcours mobile, WebGL a reçu six textures par `texSubImage2D`. Trois cartes décrivent le travertin, deux le métal brossé et une le papier. Les fichiers WebP pèsent ensemble 164 514 octets. Le changement de relief reste visible dans le socle et le ruban. [Sources des matières](../public/licences/matieres-CC0.txt) |
| Établi | Les quatre gestes produisent quatre images distinctes. Le pli affiche la même image à 20 % avant et après un détour à 80 %. L’autre angle et la lumière rasante modifient chacun les pixels. Le geste peut être rejoué et mis en pause. La vue fixe et la perte du contexte conservent le tirage. |
| Navigation | À 320 px, le lien d’évitement mène au contenu. Entrée ouvre le sommaire, Tab entre dans ses liens et Échap rend le focus au déclencheur. Le lien La méthode place le focus sur cette section. |
| Correspondance | Depuis la fiche Stands & Salons, l’atelier est présélectionné. Le formulaire refuse un message composé d’espaces. Le brouillon conserve retours à la ligne, accents, + et &. La préparation n’a émis aucune écriture réseau. |
| Sans JavaScript | À 320 px, les quatre tableaux occupent quatre positions successives dans la page. Le menu HTML se déplie, les huit ateliers et les trois recherches conservent leurs liens, l’établi ouvre une page et le formulaire conserve son action mailto. |
| Mouvement réduit et WebGL indisponible | Lors d’une arrivée avec mouvement réduit ou économie de données, le film ne démarre pas. Depuis le lien direct du seuil sans WebGL, les quatre images sont décodées, leurs commandes changent la vue et un dossier d’atelier reste accessible. |
| Largeurs et liens | Les 13 pages complètes tiennent à 320, 390 et 1 440 px de largeur. L’inspection de l’export retrouve un seul h1 par page et résout 443 liens et ancres internes ainsi que 273 références de ressources. |

## Conditions et portée

Tests avec Chromium 156 sous Linux et Playwright. Bureau de 1 440 × 900 pixels CSS à DPR 1. Mobiles tactiles émulés de 390 × 844 et 320 × 740 à DPR 2. Les aperçus mobiles sont publiés à leur largeur CSS. La capture de l’établi mesure 1 120 × 760 pixels. Le moteur de rendu WebGL logiciel SwiftShader permet de contrôler les commandes et les images produites. Les essais sur téléphone physique et dans Safari ou Firefox restent à faire.

Le contrôle automatique axe-core 4.14.1, avec les règles WCAG A et AA proposées par l’outil, a couvert l’accueil, Événement, Le portique, le lecteur de Stands & Salons et la page de l’établi, à 390 px avec mouvement réduit. Les cinq surfaces donnent zéro violation sur ces règles. Le parcours manuel au clavier complète cette mesure.

## Chargement mobile à froid

Trois premières visites indépendantes, sans geste ni défilement, à 390 × 844 le 19 novembre 2026. Le serveur local applique gzip aux ressources texte et accepte les requêtes partielles pour les films. Le protocole DevTools désactive le cache, ajoute 150 ms de latence, limite le débit à 1,6 Mbit/s descendant et à 750 kbit/s montant, et applique un ralentissement CPU ×4. Les temps couvrent également la lecture du film et le démarrage de la scène WebGL.

| Visite | Premier contenu visible (FCP) | Plus grand élément affiché (LCP) | Décalages (CLS) | Première image du film présentée | Premier rendu 3D prêt | Transfert stabilisé |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1,52 s | 2,94 s | 0,000 | 3,86 s | 14,09 s | 1425,0 ko |
| 2 | 1,05 s | 2,96 s | 0,000 | 3,65 s | 13,11 s | 1425,0 ko |
| 3 | 1,14 s | 2,94 s | 0,000 | 3,73 s | 12,99 s | 1425,0 ko |
| Médiane | 1,14 s | 2,94 s | 0,000 | 3,73 s | 13,11 s | 1425,0 ko |
| Mouvement réduit, une visite | 1,18 s | 2,73 s | 0,000 | — | — | 378,5 ko |

| Point de mesure | Transfert cumulé médian, en ko décimaux |
| --- | ---: |
| Premier contenu visible | 153,5 ko |
| Première image du film présentée | 525,6 ko |
| Premier rendu de la visite 3D prêt | 1259,3 ko |
| Six textures de matière appliquées | 1425,0 ko |
| Réseau stabilisé avant tout geste | 1425,0 ko |

Le premier dessin WebGL montre déjà la géométrie et les matériaux de base. Les trois matières numérisées sont appliquées après 15,15 s en médiane. Le LCP est le premier tirage du parcours sur les trois visites.

Le transfert cumulé additionne les octets encodés des réponses du site observés par le protocole réseau de Chromium. Les réponses en cours sont comptées à partir des fragments déjà signalés. La première image du film est datée par le rappel de présentation vidéo du navigateur. L’état prêt du canevas est indiqué après un dessin avec sa texture chargée. Ces mesures locales incluent le rendu WebGL logiciel de la machine d’essai.
