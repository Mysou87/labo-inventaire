# Inventaire des labos de sciences

Petite app web (téléphone d'abord) pour savoir ce qu'il y a au labo, signaler ce qui est vide ou cassé, et générer automatiquement la liste des achats.

- **App** : https://mysou87.github.io/labo-inventaire/ (une fois publiée)
- **Base** : même projet Supabase que Flashcards et Suivi élèves, tables `labo_…`
- **Codes** : dans `sql/03-codes.sql` (fichier privé, jamais publié)

## Installation (une seule fois)

1. Supabase → **SQL Editor** → coller et lancer, dans l'ordre :
   1. `sql/01-structure.sql` (tables, droits, actions)
   2. `sql/02-donnees.sql` (inventaire 2022 + achats 2022-2026). ⚠️ Remet l'inventaire à zéro : ne plus le relancer ensuite.
   3. `sql/03-codes.sql` (codes d'accès)
   (`sql/04-commandes-pour-tous.sql` est un correctif pour une base créée avant le 30/10/2026 au soir ; inutile sur une installation neuve.)
2. GitHub Desktop → *File › Add local repository* → ce dossier → *Publish repository* (public, nom `labo-inventaire`).
3. Sur github.com → dépôt → *Settings › Pages* → *Deploy from a branch* → `main` / racine.
4. Ouvrir l'app, entrer le code admin, *Admin › QR codes* → imprimer et coller sur les armoires.

## Utilisation

| Qui | Quoi |
|---|---|
| Tout le monde (code prof) | Scanner le QR d'une armoire ou chercher un produit → **Presque vide / Vide / Introuvable**, ou **casse** pour la verrerie et le matériel. Proposer un **nouvel achat**. Marquer une ligne comme **commandée**, noter qu'une livraison est **arrivée**. Ajouter ou corriger un article. |
| Administratrice (code admin) | Abandonner une nouveauté proposée. **Commande annuelle** : *Admin › Générer Budget_AAAA.xlsx* (même format que les feuilles `Budget_AAAA` du fichier de commandes), puis *Marquer toute la liste comme commandée*. Emplacements, QR codes, retrait d'articles, journal. |

Consulter l'inventaire ne demande aucun code.

### Comment l'app décide qu'il faut racheter

- **Produits chimiques et consommables** : suivis par état. Une alerte part dès que l'article est signalé *presque vide*, *vide* ou *introuvable*. On commande alors 1 conditionnement.
- **Verrerie et matériel** : comptés. Une alerte part quand le stock passe **sous le seuil** (par défaut 75 % de la quantité normale, ou toute la quantité si elle vaut 3 ou moins). On commande de quoi revenir à la quantité normale.
- À la réception, l'article repasse à OK et le stock remonte.

## Données de départ : choix faits (à valider)

- Base = **inventaire du 30/05/2022** (Équipe Sciences, mis à jour jusqu'au 28/11/2022), complété par les **budgets 2022 à 2026**. La commande Conatex d'octobre 2022 a été ajoutée, car elle n'était pas dans l'inventaire.
- Achats marqués « commandé / arrivé / acheté » : ajoutés. Achats **sans statut** dans le budget (beaucoup de physique 2023-2024) : ajoutés aussi, mais marqués **« à vérifier »**.
- Ignorés : denrées (cœurs de porc, épicerie, truites…), cultures vivantes (blob, kombucha), livre, budgets « boîte à expérience » et « matériel de construction ».
- Casse depuis 2022 inconnue : les quantités de verrerie sont donc **optimistes** jusqu'à la première tournée d'inventaire.
- Achats récents sans emplacement connu : rangés dans **« À ranger · Emplacement à préciser »**.
- Doublons fusionnés : bicarbonate et hydrogénocarbonate de sodium ; les deux lignes de glucose.
- Corrections : « Base de Schiff » → réactif de Schiff ; chlorure de cuivre(II) « 10 H₂O » → dihydraté (à vérifier sur l'étiquette) ; « tube de glycine » → tube de glycérine ; noms organiques en IUPAC avec le nom usuel entre parenthèses (la recherche trouve les deux).
- Liqueurs de Fehling, Lugol, amidon, gomme arabique (« Bio ? » en 2022) : placés dans l'armoire bio, à vérifier.

## Modifier les données de départ

`outils/construire_donnees.py` régénère `sql/02-donnees.sql` (`python -I outils/construire_donnees.py`). Utile seulement **avant** la mise en service : ensuite, tout se fait dans l'app.
