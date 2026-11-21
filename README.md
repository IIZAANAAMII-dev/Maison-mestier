# Maison Mestier · La Galerie vivante

**[Voir le site en ligne](https://iizaanaamii-dev.github.io/Maison-mestier/atelier-en-lumiere/)** · **[Lire le storyboard détaillé](https://iizaanaamii-dev.github.io/Maison-mestier/atelier-en-lumiere/galerie/storyboard.pdf)** · [Schéma du parcours](https://iizaanaamii-dev.github.io/Maison-mestier/atelier-en-lumiere/galerie/schema-du-parcours.png)

Une refonte de la Maison autour de la matière, d’une typographie éditoriale et de huit savoir-faire. Le parcours s’ouvre immédiatement sur « Faire impression. » et une sculpture de papier au revers de laiton. La galerie mène des études de création aux ateliers, puis à une invitation à parler du projet.

## L’expérience

- **Le pli monumental** : une sculpture 3D originale, son socle et sa lumière. Le pointeur et le défilement font évoluer le cadrage. Papier, laiton et encre sont trois matières sélectionnables. Le mouvement peut être mis en pause.
- **Le manifeste** : une respiration typographique, « Du sens. De la matière. De l’émotion. ».
- **Trois regards de création** : un pavillon de papier, une étude de papeterie et une scénographie nocturne. Un cadrage qui s’ouvre au défilement et une mise en page asymétrique relient les études.
- **Huit ateliers** : un index accompagné d’un aperçu sensible au survol et au focus, puis huit pages complètes qui reprennent les contenus validés de `lib/ateliers.json`.
- **La manière** : écouter, donner forme, faire vivre. Trois gestes consultables dans un accordéon.
- **Une invitation finale** : un footer monumental et un panneau de contact qui conserve le contexte de l’atelier sélectionné.

Le menu plein écran, le laboratoire, les trois pages d’études et le carnet de repérages reprennent la même direction. Les images de recherche sont identifiées comme études de création ; elles ne représentent pas des réalisations clientes.

## Le dessin du parcours

Le [carnet de repérages](https://iizaanaamii-dev.github.io/Maison-mestier/atelier-en-lumiere/reperages/#storyboard) donne accès à un schéma d’ensemble et à un storyboard de six pages : transitions entre les sections, menu, fiches et contact mobile. Les dessins décrivent l’intention de mise en scène ; les réglages sont adaptés aux appareils et aux essais.

Les références de création consultées sont Moooi — Paper Play, Lusion v3, Cartier Watches & Wonders 2024 par Immersive Garden, et Studio Freight. Les liens et les principes retenus figurent dans le carnet. Aucune récompense n’est revendiquée pour ce projet.

## Développer et exporter

Node.js 22 ou ultérieur est requis. Les polices sont auto-hébergées.

```sh
npm ci
npm run dev
```

```sh
npm run typecheck
NEXT_PUBLIC_BASE_PATH=/Maison-mestier/atelier-en-lumiere npm run build
```

Le build statique est écrit dans `out/`. Le dossier est publié sur la branche `gh-pages`, dans `atelier-en-lumiere/`. La [révision publiée](https://iizaanaamii-dev.github.io/Maison-mestier/atelier-en-lumiere/version.json) indique le commit source associé au déploiement.

## Repères de réalisation

- `components/galerie/GalleryHome.tsx` : parcours et partition GSAP.
- `components/galerie/MonumentScene.tsx` et `monument-geometry.ts` : scène Three.js et géométrie du ruban.
- `components/galerie/MaisonChrome.tsx` : navigation, footer et contact.
- `app/ateliers/[slug]/page.tsx` et `app/recherches/[slug]/page.tsx` : pages internes.
- `public/galerie/` : trois visuels de création générés pour cette direction et storyboard.

Le défilement reste natif. La préférence de mouvement réduit supprime les animations de parcours et fige la caméra. La scène cesse de dessiner hors du viewport ou lorsque l’onglet est masqué. En économie de données, le poster est présenté avec une commande d’activation 3D ; en cas d’indisponibilité WebGL, le poster assure la continuité. Le menu et le contact utilisent des dialogues natifs, avec Échap et restitution du focus.

Le contact prépare un **brouillon** à copier, conservé dans la session de l’onglet. Il n’envoie aucun message. Définir `NEXT_PUBLIC_CONTACT_EMAIL` au build lorsque l’adresse de réception est validée pour proposer l’ouverture de la messagerie du visiteur.

Les fichiers de l’ancienne traversée sont conservés dans l’historique et les répertoires de recherche. La nouvelle page d’accueil ne les charge pas.
