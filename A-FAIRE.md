# Inventaire des labos : à faire plus tard

Idées validées par Laureline le 01/11/2026, mises de côté parce qu'elles demandent beaucoup de travail.

## 1. Dates de péremption (point 5)

- Base : colonnes `perissable boolean` et `peremption date` (correctif `sql/07`), ajoutées à `labo_article_enregistrer` ; remettre `peremption` à null à la réception (`labo_commande` recu).
- App : champ date dans le formulaire ; badges « date à relever » / « périme bientôt » (3 mois) / « périmé » ; un produit périmé ou proche entre dans `besoin()` → « À commander » ; filtre « Péremption » dans Inventaire.
- Mettre les périssables « à vérifier » pour relever la date sur l'étiquette.
- Liste proposée (ids de `labo_articles`, à valider) :
  - Chimie : 7 réactif de Schiff, 51 H₂O₂ 30 %, 12 hypochlorite de sodium, 17 eau de chaux, 13 nitrate d'argent 1 %, 10 NaOH 0,1 mol/L, 6 ammoniaque 1 mol/L, 69 éthanal, 68 diéthylamine, 40 sulfite de sodium, 24 chlorure de fer(II), 32 persulfate de potassium, 16 oxyde de calcium, 86 empois d'amidon, 43 alginate de sodium, 89 alcool polyvinylique.
  - Biologie : 195 Fehling A, 196 Fehling B, 197 lugol, 203 huile, 206 kit molécules du vivant, 207 kit groupes sanguins.
  - Consommables : 96 bandelettes pH, 95 papier pH, 93 gants latex, 92 gants nitrile.

## Source pour les points 2 et 3

`C:\Users\lvano\Desktop\Ecole Active\Labo Chimie\Règles\2018-03-27 liste produits interdits.pdf` (dossier Ecole Active = lecture seule). À lire en premier, avant toute autre source.

## 2. Qui peut manipuler chaque produit (point 7)

- Ce qui compte pour Laureline : prof seulement, ou élèves de quelle année et de quelle option.
- D'abord lui faire choisir l'échelle des niveaux (proposition : prof seulement · 5e-6e option sciences · dès la 4e · tous les élèves), puis une proposition produit par produit, à valider par elle.
- Croiser avec les pictogrammes de danger (GHS) et les fiches de sécurité ; option : colonnes `ghs` et `fds` (lien), registre des produits dangereux exportable.

## 3. Où jeter chaque produit

- Pour chaque produit chimique : filière d'élimination (évier avec beaucoup d'eau, bidon de récupération acides/bases, bidon métaux lourds, bidon solvants organiques, bidon halogénés, collecte spéciale…), en croisant avec les fiches de sécurité (section 13).
- À faire en même temps que le point 2 : mêmes sources, même passage produit par produit.
