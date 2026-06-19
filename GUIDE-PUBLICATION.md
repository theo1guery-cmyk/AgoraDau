# 📝 Publier une analyse sur agoradau.fr

Ce guide explique comment écrire et publier un article **sans aucune compétence technique**.
On écrit dans un éditeur, on clique « Save », et l'article est en ligne tout seul en ~1 minute.

L'outil s'appelle **Pages CMS** — c'est gratuit et hébergé, il n'y a rien à installer.

---

## 1. La première fois (accès)

1. Demande à un·e responsable du bureau d'être **ajouté·e au dépôt GitHub** de l'asso
   (`theo1guery-cmyk/AgoraDau`) — il suffit de donner ton identifiant GitHub.
   (Pas de compte GitHub ? Crée-en un gratuit sur github.com, ça prend 2 min.)
2. Va sur **https://app.pagescms.org**
3. Clique **« Sign in with GitHub »** et autorise.
4. Choisis le dépôt **AgoraDau**. C'est tout — tu y as accès à vie.

---

## 2. Écrire et publier un article

1. Sur Pages CMS, ouvre la collection **« Analyses »** → clique **« Add an entry »**.
2. Remplis les champs (les plus importants) :
   - **Titre** — court, clair (il sert aussi à l'adresse de la page).
   - **Chapô** — la phrase d'accroche sous le titre.
   - **Rubriques** — ex. `Sociologie · Capitalisme · Nuit`.
   - **Auteur·rice** — ton nom.
   - **Date** + **Date affichée** (ex. `Juin 2026`).
   - **Couverture** — glisse une image **carrée (~1080 px)**. C'est elle qui s'affiche
     quand on partage le lien et dans le carrousel de l'accueil.
   - **Description** — 1-2 phrases : c'est le résumé qui sort sur Google et les réseaux.
   - **Chiffres-clés** (optionnel) — jusqu'à 3 encadrés (un chiffre + ce qu'il signifie + la source).
   - **L'article** — écris normalement. Mise en forme :
     - un **titre de partie** = style **« Titre 2 »** → il est numéroté **I, II, III…** automatiquement ;
     - une **phrase-choc** = style **« Citation »** → elle ressort en gros avec une barre rouge ;
     - tu peux insérer des **images** dans le texte.
   - **Sources** (optionnel) — sous-titres en **« Titre 3 »** + listes à puces ; ça s'affiche
     dans un bloc « Sources » dépliable en bas.
3. Clique **« Save »** (en haut à droite).

C'est publié 🎉 L'article apparaît sur **agoradau.fr/analyses/ton-titre/** au bout de ~1 minute
(le temps que le site se reconstruise).

---

## 3. Bon à savoir

- **Modifier / corriger** : rouvre l'entrée, change ce que tu veux, « Save ». Mise à jour automatique.
- **Partage** : copie le lien de l'article → sur Insta/LinkedIn, l'image de couverture
  et le titre s'affichent tout seuls.
- **Google** : un nouvel article met quelques jours à être indexé. Mettre le lien en story Insta
  / post LinkedIn accélère les choses.
- **Taille des images** : garde des images raisonnables (~1080 px, < 500 Ko) pour que le site reste rapide.

---

## En coulisses (pour les curieux·ses)

Le site est un site **Jekyll** sur **GitHub Pages**. Chaque analyse est un fichier
`_analyses/<titre>.md` (texte + quelques champs). Le gabarit `_layouts/analyse.html`
le transforme automatiquement dans la charte du média. Pages CMS ne fait qu'écrire
ces fichiers à ta place — donc tout reste lisible et récupérable même sans l'outil.
