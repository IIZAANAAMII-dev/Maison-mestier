# Refonte Maison Mestier — références et coordination

Recherche du 22 novembre 2026. Document de direction et de préparation ; les budgets ci-dessous sont des objectifs de conception, pas des mesures de performance.

## Intention

Une introduction immersive en pleine largeur ouvre sur une sculpture de papier réelle, puis sur un parcours éditorial consacré aux métiers de la Maison. La transformation de la matière fournit un vocabulaire commun au volume, aux titres, aux transitions et aux panneaux de détail. La navigation garde des destinations explicites et directement accessibles.

Le geste proposé est « la feuille devient espace » : le pli relie une surface imprimée à un lieu, puis à une idée que le visiteur peut approfondir. La 3D sert cette continuité. Le contenu des huit ateliers demeure lisible en HTML et sur mobile.

## Références retenues

| Référence et source | Fait documenté | Principe applicable à la Maison |
| --- | --- | --- |
| [Cartier Watches & Wonders 2024, Immersive Garden](https://immersive-g.com/projects/cartier-watches-and-wonders-24/) | Le studio décrit une narration au scroll, des animations en temps réel et des hotspots donnant accès au détail ; il indique une récompense Awwwards SOTD. | Coordonner la caméra, la matière et le texte dans un même mouvement ; réserver le détail aux actions du visiteur. |
| [Artisans d’Idées, étude du studio](https://immersive-g.com/projects/artisans-d-idees/) ; [fiche Awwwards](https://www.awwwards.com/sites/artisans-didees) | SOTD du 20 novembre 2021. L’étude décrit l’apparition de sculptures et les jeux de lumière et d’ombre. La fiche mentionne Three.js et WebGL. | Faire naître les métiers depuis une matière commune ; utiliser la lumière pour guider le regard entre les chapitres. |
| [Chartogne-Taillet, étude du studio](https://immersive-g.com/projects/chartogne-taillet-1) ; [fiche Awwwards](https://www.awwwards.com/sites/chartogne-taillet) | SOTD du 2 décembre 2020. Carte dessinée, détails révélés au survol et paysage 3D sobre servent l’histoire des parcelles. | Construire des interactions propres au métier : pli, empreinte et relief. Conserver une action HTML équivalente au geste. |
| [Lusion](https://lusion.co/) ; [présentation du studio](https://lusion.co/about/) | Le studio associe direction artistique, motion, 3D et développement ; son palmarès présente un Awwwards Site of the Year. | Exiger une continuité entre objet 3D et interface et une réponse précise aux gestes. Le palmarès ne constitue pas une garantie pour notre réalisation. |
| [MERSI, retour d’expérience signé FLOT NOIR](https://tympanus.net/codrops/2026/07/27/between-print-and-digital-the-making-of-mersis-website/) | L’extrait indexé décrit une refonte située entre livre d’architecture et expérience interactive, avec une couche de développement spécifique. | Donner aux projets une composition éditoriale précise et maintenir une lecture calme autour du geste immersif. |

Ces références servent à étudier des mécanismes et des exigences. Leurs assets, identité, texte et code ne sont pas repris.

## Compétences GitHub consultées

Les fichiers suivants ont été lus pendant la recherche. Ils sont utilisés comme documentation ; aucune instruction de projet n’a été remplacée et aucun skill n’a été installé.

| Source | Application retenue |
| --- | --- |
| [GreenSock : gsap-timeline](https://github.com/greensock/gsap-skills/blob/main/skills/gsap-timeline/SKILL.md) | Timelines nommées, labels, valeurs par défaut et positionnement explicite des animations. |
| [GreenSock : gsap-scrolltrigger](https://github.com/greensock/gsap-skills/blob/main/skills/gsap-scrolltrigger/SKILL.md) | ScrollTrigger au niveau de la timeline principale, recalcul après changement de mise en page, séparation du pin et de l’objet animé. |
| [GreenSock : gsap-react](https://github.com/greensock/gsap-skills/blob/main/skills/gsap-react/SKILL.md) | Effets côté client, scope par composant et nettoyage complet par contexte ou hook adapté. |
| [GreenSock : gsap-performance](https://github.com/greensock/gsap-skills/blob/main/skills/gsap-performance/SKILL.md) | Transformations et opacité, `quickTo` pour les mises à jour fréquentes, nombre limité d’animations simultanées. |
| [Anthropic : frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md) | Identité fondée sur le métier, typographie intentionnelle, geste mémorable et revue visuelle du rendu. |
| [cesartevisual : threejs-r3f](https://github.com/cesartevisual/threejs-skills/blob/main/skills/threejs-r3f/SKILL.md) | Conseil communautaire : respecter les versions installées, utiliser les refs pour l’animation continue, garder les actions accessibles hors canvas et prévoir les échecs de chargement. |

La documentation et les types des dépendances installées restent la référence pour les signatures. Ne pas recopier sans vérification les snippets : le guide ScrollTrigger consulté contient notamment un exemple de défilement horizontal avec `Max.max` et une ambiguïté entre pixels et `xPercent`.

## Grille de coordination proposée

| Moment | Déclenchement | Budget de durée proposé | Coordination |
| --- | --- | --- | --- |
| Ouverture | Première arrivée à l’accueil | 1,1–1,5 s pour le geste de révélation | Image, titre et navigation partagent une timeline. Éviter de répéter l’introduction sur retour arrière ou arrivée à une ancre. |
| Sculpture | Scroll et interaction explicite | Progression liée au scroll ; lissage 0,3–0,6 s à ajuster visuellement | Le volume, la lumière et le texte dérivent de la même progression. Une propriété animée a un seul propriétaire. |
| Transition éditoriale | Entrée d’un chapitre | 0,45–0,75 s, chevauchement 0,10–0,18 s | Le passage de la matière au texte suit la même direction. Le contenu est lisible dès son arrivée. |
| Réaction du curseur | Survol ou déplacement sur une action | 0,12–0,22 s | Petit déplacement amorti ; libellé correspondant à l’action réelle. Pas de curseur personnalisé tactile. |
| Menu | Bouton Menu | Ouverture 0,45–0,60 s ; fermeture 0,20–0,30 s | Même geste de dévoilement que les panneaux. Le focus entre dans le dialogue puis revient au déclencheur. |
| Détail de projet | Clic sur un projet | 0,50–0,70 s ; fermeture 0,25–0,40 s | Le visuel sélectionné conserve sa logique spatiale. Le scroll et le focus sont restaurés à la fermeture. |
| Action courante | Clic, focus, confirmation | 0,12–0,20 s | Réponse immédiate ; aucun délai de navigation ajouté à une animation décorative. |
| Mouvement réduit | Préférence système | Instantané ou fondu bref non spatial | Mêmes contenus et actions, sans déplacement de caméra ni séquence imposée. |

Les durées sont une palette commune à ajuster sur le rendu final. Elles ne doivent pas devenir des attentes fixes si le visiteur clique rapidement ou annule une action.

## Contrats des routes existantes

Inspection des pages `app/ateliers/[slug]/page.tsx`, `app/recherches/[slug]/page.tsx`, de `lib/maison.ts` et du chrome commun avant refonte :

- L’export est statique, avec `trailingSlash: true`, `generateStaticParams()` et `dynamicParams = false`. Conserver les routes et les données de métier ; une modale peut compléter leur présentation sans les remplacer.
- Construire les liens et assets avec `path()` et `atelierPath()` pour respecter `NEXT_PUBLIC_BASE_PATH`, utilisé pour GitHub Pages.
- Les dossiers atelier retournent vers `/#ateliers`. Les recherches retournent vers `/#regards`. Ces deux cibles doivent exister dans le nouvel accueil ou être remplacées dans tous les liens entrants.
- Les invitations au contact utilisent `/?atelier=<slug>#contact`. Préserver la sélection du métier et l’ouverture sur arrivée directe. Le dialogue commun écoute aussi l’événement `mestier:contact`.
- Les chapitres des ateliers utilisent `#geste-1`, `#geste-2`, etc. La recherche utilise `#geste`. Le nouveau header doit laisser ces titres visibles après navigation à l’ancre.
- Les routes ont un `<main id="contenu" tabIndex={-1}>`, des fils d’Ariane, des métadonnées et des liens « suivant ». Conserver ce parcours au clavier et cette structure sémantique.
- Le chrome est déjà monté une fois dans le layout racine : éviter une deuxième navigation, un deuxième footer ou un deuxième dialogue de contact dans la nouvelle page d’accueil.
- Les études de création sont identifiées comme telles dans les pages. Leur nouvelle présentation ne doit pas les transformer en références clients réalisées.

### Points de raccord à vérifier pendant la refonte

Le menu précédent pointe vers `#seuil`, `#empreinte`, `#entracte`, `#traversee` et `#constellation`. Le footer pointe aussi vers `#maison`, et le laboratoire vers `#matiere`. Mettre à jour ces destinations vers les vrais chapitres ou conserver des ancres de compatibilité utiles. Ne pas garder des liens visibles qui ne déplacent plus le visiteur.

`useMaisonDialog()` gère déjà le focus, la touche Échap et un verrou de scroll compté. Son délai de fermeture doit rester synchronisé avec la nouvelle animation. Si le défilement fluide est actif, son arrêt et sa reprise doivent suivre l’état du dialogue ; `overflow:hidden` seul peut ne pas suffire selon l’intégration.

Le formulaire de contact prépare actuellement un brouillon et ne l’envoie pas. La refonte doit garder ce comportement explicite tant qu’un vrai canal d’envoi n’est pas configuré.

Les dossiers utilisent `atelier.css` et des variables locales `--a2-*`. Pour unifier l’apparence, les raccorder aux tokens communs ou les réviser ensemble ; changer seulement `:root` laisserait des couleurs et des espacements de l’ancienne direction.

## Vérification de la continuité

Parcours à contrôler sur le résultat implémenté : accueil → menu → atelier → contact prérempli → fermeture → retour aux ateliers ; accueil → recherche → atelier lié ; ouverture du menu au clavier puis Échap ; clic répété pendant fermeture ; rechargement d’une route profonde ; arrivée directe avec `#contact` ; retour du navigateur ; téléphone ; mouvement réduit ; WebGL indisponible.

Observer également une capture à mi-transition. Une belle première image ne suffit pas à établir la qualité du parcours. Les résultats de QA seront consignés séparément après implémentation.

## Raccord éditorial implémenté

Les deux familles de dossiers utilisent désormais `components/matiere/InteriorMotion.tsx` et `interiors.css`, chargé après la feuille de structure existante. Leur contenu reste préparé côté serveur, leurs métadonnées et slugs sont conservés. Le conteneur client possède seulement l’entrée du titre et de la note, puis le dévoilement du cadre principal. Il nettoie ses timelines et son observateur ; une arrivée à une ancre, une restauration d’historique ou la préférence de mouvement réduit laisse le contenu immédiatement lisible. La phrase de mouvement dure 1,1 seconde avec `power3.inOut`.

Les dossiers partagent l’ivoire `#f3f0ea`, l’encre `#1c2333` et la nuit `#141a17`. Le laiton `#b08d57` est réservé aux accents ; le bronze plus sombre `#705834` assure la lisibilité des petits liens et repères sur l’ivoire. La mise en page laisse 86 pixels au header fixe, recadre les titres selon la largeur et conserve une lecture statique pour les paragraphes.

Les liens de retour des recherches ont été mis à jour de `#regards` vers la nouvelle section `#etudes`. Les invitations `/?atelier=<slug>#contact`, les chapitres et les liens entre dossiers sont conservés.

Vérification d’étape : `npm run typecheck` et `git diff --check` terminés avec succès après ce raccord. Le contrôle visuel du parcours complet reste à réaliser avec la nouvelle page d’accueil et le chrome finalisés.

## Limites des sources

La recherche repose sur les pages des créateurs, les fiches Awwwards et les fichiers GitHub lus. Elle ne comprend pas un test interactif complet des sites de référence. Les fiches Awwwards Artisans d’Idées et Chartogne-Taillet ont été récupérées ; certaines autres ont renvoyé un timeout. Le contenu MERSI a été consulté via son résultat indexé, son ouverture directe ayant renvoyé 403. Les choix de composition, d’animation et de budgets ci-dessus sont des propositions pour Maison Mestier, pas des spécifications mesurées chez ces références.
