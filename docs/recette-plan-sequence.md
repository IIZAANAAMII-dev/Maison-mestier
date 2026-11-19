# Recette du plan-séquence

Les essais portent sur l’export de production servi sous le préfixe GitHub Pages. La première arrivée, la lecture du carnet et les retours sur le trajet ont été exercés dans un navigateur avec une souris, un clavier ou un écran tactile émulé.

[La lettre en portrait](captures-traversee/lettre-mobile.webp) · [Le portique sur ordinateur](captures-traversee/portique-bureau.webp) · [La scène en portrait](captures-traversee/scene-mobile.webp) · [Un dossier du carnet](captures-traversee/carnet-mobile.webp)

## Parcours

| Parcours | Résultat observé |
| --- | --- |
| Première arrivée | Le cachet attend à la pose 0. Un toucher, la touche Entrée ou un glissement commencent l’ouverture. Le premier arrêt correspond à la pose 0,06 en l’absence de défilement supplémentaire. Une seconde visite dans le même onglet rejoint la lecture. L’adresse `#cachet` rouvre la lettre fermée. |
| Ouverture en 3D | Sur un profil bureau rapide, la lettre attend à la pose 0 pendant que le moteur prépare les deux modèles, les textures et la lumière de studio. Après leur disponibilité, Entrée ouvre le rabat sur le même canevas. Le journal réseau confirme que cette ouverture s’effectue entièrement en WebGL. |
| Raccord du film | Les deux ouvertures H.264 contiennent 63 images sur 2,10 s. Le premier photogramme a été comparé au tirage du cachet fermé et le dernier au tirage de l’invitation à la pose 0,06. Les quatre comparaisons donnent un écart quadratique moyen inférieur à 2,6 niveaux sur 255 après réduction à 150 × 180 pixels. Avec un tirage retardé de 3,45 s, le dernier photogramme reste affiché jusqu’à sa relève. Un relevé des pixels du compositeur le confirme. |
| Caméra | Un même canevas WebGL 2 a rendu les six stations dans Chromium et WebKit en portrait. Les positions lues directement sur le canevas passent par 0,06, 0,23, 0,41, 0,59, 0,77 et 0,95. Les passages intermédiaires suivent le défilement dans les deux sens. |
| Lecture continue | Sur le téléphone émulé, le bouton parcourt les six stations dans l’ordre, termine sur la correspondance et conserve l’historique du navigateur. Un deuxième toucher suspend la pose. Tab rend le contrôle au lecteur. |
| Geste tactile | Au Portique, un déplacement vertical de 264 pixels CSS à 390 × 844 fait progresser la pose rendue de 0,4101 à 0,4653. Le geste inverse retrouve 0,4101 au même niveau dans le document. Une perte simulée du contexte laisse les chapitres accessibles. En l’absence de WebGL, Chromium et WebKit ont affiché la bande filmée à environ 4,10 s, 5,90 s, 2,30 s puis 9,50 s lors de quatre déplacements avant et arrière. |
| Accès directs | Les six adresses de chapitre placent la caméra à leur station, y compris après un passage en largeur tablette puis un retour au portrait. Les touches du rail, le retour et l’avance du navigateur ont été exercés. Les anciennes adresses des ateliers, des recherches et de la matière mènent à leur contenu. |
| Carnet | À 320 px, les huit ateliers et trois recherches s’ouvrent depuis le carnet. Les onze fiches complètes et l’établi répondent également par leur propre adresse. Treize tabulations restent dans le dialogue. Échap rend le focus à la commande d’origine et restitue la position de lecture. |
| Correspondance | Depuis Stands & Salons, le métier est présélectionné. Le brouillon conserve les accents, les signes + et & et les sauts de ligne. Cette action s’effectue entièrement dans le navigateur. |
| Mouvement réduit et HTML | En mouvement réduit, un accès direct affiche la station demandée sans lecture automatique de l’ouverture. Avec JavaScript désactivé, les six chapitres occupent six positions successives. Les huit ateliers, les trois recherches, l’établi et la correspondance restent accessibles. |

## Accessibilité

Le contrôle axe-core 4.14.1, avec les règles WCAG A et AA jusqu’à 2.2 proposées par cet outil, a couvert la lettre fermée, l’invitation, le Portique, le sommaire des ateliers, le dossier Stands & Salons, la méthode, la correspondance et l’établi. Aucune violation automatique n’a été relevée sur ces huit vues. L’inspection de l’export retrouve un seul titre de premier niveau dans chacune des treize pages, 412 liens ou ancres internes et 278 références HTML de ressources résolues. Les essais de tabulation, de fermeture et de restitution du focus complètent ce contrôle.

## Conditions d’essai

Chromium 156 et WebKit 26.5 sous Linux, pilotés avec Playwright. Téléphone tactile émulé à 390 × 844, petit écran à 320 × 740 et ordinateur à 1 440 × 900 pixels CSS. La mise en page a aussi été exercée à 844 × 390. Chromium utilise SwiftShader pour WebGL, WebKit utilise le rendu logiciel du système. L’essai sur iPhone physique reste à réaliser.

## Chargement mobile

Trois premières visites à froid indépendantes sur Chromium, écran tactile émulé de 390 × 844 à DPR 2. Le serveur local applique gzip et accepte les requêtes partielles pour les films. Le cache est désactivé, la latence réglée à 150 ms, le débit descendant à 1,6 Mbit/s, le débit montant à 750 kbit/s et le ralentissement CPU à ×4. Le navigateur signale également 1,6 Mbit/s à la page. FCP et LCP partent de la navigation. Le titre de la lettre est l’élément retenu par Chromium pour le LCP lors des trois premières visites. Les trois temps média partent du toucher sur le cachet.

| Essai | Premier contenu (FCP) | Élément principal (LCP) | Décalages (CLS) | Première image présentée du film | Premier dessin WebGL | Modèles, lumière et matières prêts | Transfert stabilisé |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1,15 s | 1,15 s | 0,002 | 0,62 s | 10,18 s | 19,52 s | 2 373,6 ko |
| 2 | 0,86 s | 0,86 s | 0,002 | 0,58 s | 9,56 s | 18,17 s | 2 373,6 ko |
| 3 | 0,82 s | 0,82 s | 0,002 | 0,79 s | 9,40 s | 18,13 s | 2 373,6 ko |
| Médiane | 0,86 s | 0,86 s | 0,002 | 0,62 s | 9,56 s | 18,17 s | 2 373,6 ko |

Avant le toucher, le navigateur reçoit 327,5 ko en médiane et termine la réception du tirage de la lettre en 0,83 s depuis la requête du document. Le transfert additionne les octets encodés des réponses du site observés par le protocole réseau de Chromium. Les premières images du H.264 ont été signalées par le rappel du navigateur. La fin de chargement de la scène a été relevée après application de la lumière de studio, du velours, des autres matières, de la gravure et des deux modèles. Avec la préférence de mouvement réduit, un essai a transféré 376,2 ko pour afficher la lecture fixe.
