# Notes techniques (pour reprendre l'app)

À lire avant toute modification. Le README décrit l'usage, ce fichier décrit les rouages.

## Où est quoi

| Élément | Emplacement |
|---|---|
| Code source | `C:\Users\lvano\Desktop\Espace de travail\labo-inventaire\` (dépôt Git, branche `main`) |
| App en ligne | https://mysou87.github.io/labo-inventaire/ (GitHub Pages, dépôt public `mysou87/labo-inventaire`) |
| Base | Supabase, projet `iuharjafrhwzhhggwzgy` (le même que Flashcards et Suivi élèves), tables `labo_*` |
| Codes d'accès | `sql/03-codes.sql`, **jamais publié** (`.gitignore`) ; vraies valeurs aussi dans la table `labo_config` |

## Fichiers

- `index.html` : coquille (barre, onglets, `<dialog>`, toast). Charge qrcodejs 1.0.0 et SheetJS 0.18.5 (cdnjs), puis `js/app.js` en module.
- `js/config.js` : URL + clé anon Supabase (publique, lecture seule).
- `js/app.js` : toute l'app, en JS sans framework et sans supabase-js (`fetch` vers `/rest/v1/`). Sections :
  - `api()` / `rpc()` : accès REST.
  - `S` : état (lieux, articles, demandes, code, rôle, filtres, `prerempli`).
  - `besoin(a)` : **règle de rachat** (nombre < seuil → cible − quantité ; état vide / presque vide / introuvable → 1).
  - Écrans : `ecranLabo` (recherche + emplacements), `ecranLieu` (+ mode tournée `ligneTournee`), `ecranArticle`, `ecranFormulaire` (ajout/modif), `ecranCommandes`, `ecranInventaire`, `ecranAdmin`, `ecranQR`.
  - `exporterCommande(annee)` : xlsx au format des feuilles `Budget_AAAA` (colonnes A Dénomination, B Prix, C Quantité, D Coût total, J Remarques, K Responsable, L Site ; blocs Biologie / Physique / Chimie / Commun ; formules + valeurs arrondies au centime).
  - Clics : délégation unique sur `[data-action]`. Routeur par hash : `#/`, `#/lieu/<id>`, `#/article/<id>`, `#/modifier/<id>`, `#/ajouter[/<lieu>]`, `#/commandes`, `#/inventaire`, `#/admin`, `#/qr`. L'onglet « À ranger » pointe simplement vers `#/lieu/xx` (emplacement « À ranger »), avec un compteur mis à jour dans `majCompteurCommandes()`.
  - Code d'accès et rôle mémorisés en `localStorage` (`labo_code`, `labo_role`).
- `css/style.css` : couleurs en variables `:root`, mode sombre automatique, impression des QR.
- `sql/01-structure.sql` : tables, RLS, fonctions. **Relançable sans danger** (`create if not exists`, `create or replace`).
- `sql/02-donnees.sql` : données de départ. ⚠️ **Efface tout** (articles, événements, demandes) : ne plus jamais le relancer, l'app est en service.
- `sql/04-commandes-pour-tous.sql` : exemple de **correctif** (seulement les fonctions modifiées), la façon de faire évoluer la base.
- `outils/construire_donnees.py` : a généré `02-donnees.sql` depuis l'inventaire 2022 et les budgets 2022-2026. N'a plus d'utilité maintenant que l'app tourne.

## Base de données

Tables : `labo_lieux` (id texte = celui du QR), `labo_articles`, `labo_evenements` (journal), `labo_demandes` (nouveautés), `labo_config` (codes).

- `suivi` vaut `etat` (produits, consommables : `ok` / `presque_vide` / `vide` / `introuvable`) ou `nombre` (verrerie, matériel : `quantite`, `cible`, `seuil`).
- `commande_le` non vide = article commandé, en attente de réception.
- `actif = false` = retiré (l'historique est gardé).
- `a_verifier` : levé par un « comptage » (tournée d'inventaire) ou par la modification d'un article.

**Droits** : la clé anon ne fait que LIRE (policies `select` seulement ; `labo_config` n'en a aucune, elle est donc illisible). Toute écriture passe par des fonctions `security definer` qui vérifient le code via `labo_exiger(code, admin?)` :

| Fonction | Code prof | Code admin seulement |
|---|---|---|
| `labo_role` | renvoie `prof` / `admin` / null | |
| `labo_signaler` (ok, presque_vide, vide, introuvable, casse, comptage) | ✓ | |
| `labo_commande` (commande, annule, recu) | ✓ (depuis le 30/10/2026) | |
| `labo_article_enregistrer` (créer / modifier) | ✓ | |
| `labo_demande` | creer, commande, recu | modifier, abandonne, rouvrir |
| `labo_lieu_enregistrer` | créer (depuis le 01/11/2026, `sql/05`) | modifier un existant |
| `labo_article_retirer` | | ✓ |

## Comment modifier

1. **Interface** : éditer `js/app.js` / `css/style.css`, puis `node --check js/app.js`.
2. **Base** : modifier `sql/01-structure.sql` (la référence) ET écrire un correctif `sql/0N-….sql` qui ne contient que ce qui change. Laureline le colle dans Supabase › SQL Editor (je n'ai **pas** d'accès en écriture à la structure). Sans correctif lancé, l'app affiche les boutons mais la base refuse.
3. **Commit** avec le git de GitHub Desktop (absent du PATH) :
   `C:\Users\lvano\AppData\Local\GitHubDesktop\app-*\resources\app\git\cmd\git.exe` (prendre la version la plus récente). Laureline fait **Push origin**, car le push en ligne de commande échoue.
4. **Vérifier en ligne** : télécharger `https://mysou87.github.io/labo-inventaire/js/app.js?nocache=<aléatoire>` et y chercher la modification.

## Tester

- **Lecture / droits** : script Node (`fetch` + clé de `js/config.js`) qui appelle `/rest/v1/rpc/<fonction>`. Pour tester un droit **sans laisser de trace**, viser un id inexistant (999999) : une erreur de clé étrangère prouve que le droit est passé et tout est annulé.
- **Cycle complet** : créer un article « TEST … », le faire vivre, puis `labo_article_retirer`. Il reste quelques lignes dans le journal admin, à signaler à Laureline.
- **Rendu** : copie du site dans le scratchpad + `fetch` simulé (données JSON) + `python -m http.server` + Edge headless :
  `msedge --headless=new --user-data-dir=<dossier à part> --window-size=500,1300 --virtual-time-budget=5000 --screenshot=…`.
  Sans `--user-data-dir`, Edge s'accroche à la session ouverte de Laureline et ne produit rien. La largeur minimale réelle est d'environ 500 px.
- **Export Excel** : SheetJS est disponible dans `App-suivi-élèves\node_modules\xlsx` ; on extrait les fonctions de `app.js` et on les exécute dans `vm` avec les vraies données.
- Encodage : en PowerShell 5.1, lire ou écrire en UTF-8 explicite (`[IO.File]::ReadAllText(…, UTF8)`), sinon les accents et les émojis sont cassés.
