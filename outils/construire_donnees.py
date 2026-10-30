"""Construit sql/02-donnees.sql : le contenu de départ de l'inventaire.

Sources (relues à la main le 30/10/2026) :
  - Équipe Sciences > Laboratoires > 2022-05-30 Inventaire.xlsx (mis à jour jusqu'au 28/11/2022)
  - Downloads > 2023-06-07 Budget Commandes Labo.xlsx, feuilles Budget_2022 à Budget_2026
    (commande Conatex d'octobre 2022 ajoutée : elle n'est pas dans l'inventaire 2022)

Règles :
  - achat noté « commandé / arrivé / acheté » → ajouté au stock ;
  - achat sans statut dans le budget → ajouté quand même, mais marqué « à vérifier » ;
  - denrées périssables (cœurs de porc, truites, épicerie…) et livres → ignorés ;
  - produits chimiques et consommables : suivis par ÉTAT (ok / presque vide / vide) ;
  - verrerie et matériel durable : suivis par NOMBRE, avec un seuil de rachat.

Lancer : python -I outils/construire_donnees.py
"""
from pathlib import Path

LIEUX = [
    # id, salle, nom, détails, ordre
    ("sp-ax1", "Salle prépa", "Armoire anti-explosion · 1er étage", "Acides et bases", 10),
    ("sp-ax2", "Salle prépa", "Armoire anti-explosion · 2e étage", "Sels", 11),
    ("sp-ax3", "Salle prépa", "Armoire anti-explosion · 3e étage", "Métaux, éléments et divers", 12),
    ("sp-ax4", "Salle prépa", "Armoire anti-explosion · 4e étage", "Produits organiques", 13),
    ("sp-ad", "Salle prépa", "Armoire droite",
     "5e : bocaux, verres à pied en plastique · 4e : verrerie de préparation · 3e : indicateurs, "
     "acides, bases, sels divers · 2e : sels divers et autres produits · 1er : pipettes d'eau, bac de préparations", 20),
    ("sp-ag", "Salle prépa", "Armoire gauche",
     "Matériel gaz, modèles moléculaires, grande verrerie, bouteilles, balances, divers", 21),
    ("sp-ti", "Salle prépa", "Tiroirs",
     "1 : clés, dissection · 2 : bougies, ballons, petit matériel · 3 : chronos, thermomètres, pH-mètres · 4 : papiers", 22),
    ("sp-pt", "Salle prépa", "Plan de travail et sous la table", "Bidons, appareils, matériel en vrac", 23),
    ("sp-bp", "Salle prépa", "Boîte « piles »", "Multimètres, câbles, piles, lames métalliques", 24),
    ("sp-ac", "Salle prépa", "Armoire à côté du frigo", None, 25),
    ("sp-fr", "Salle prépa", "Frigo et congélateur", None, 26),
    ("lc-ar", "Labo chimie", "Armoire chimie (verrerie élèves)",
     "4e : burettes, thermomètres · 3e : tubes à essai, verres à pied · 2e : béchers, erlenmeyers, coupelles · "
     "1er : pipettes rangées par taille, poires", 30),
    ("lc-ho", "Labo chimie", "Sous la hotte", "Pipettes en plastique, statifs, pinces, supports", 31),
    ("lc-ev", "Labo chimie", "Éviers", "Brosses", 32),
    ("lb-ar", "Labo biologie", "Armoire bio", None, 40),
    ("lp-ar", "Labo physique", "Armoire physique", "Planches 1 à 5", 50),
    ("lp-ac", "Labo physique", "À côté de l'armoire", None, 51),
    ("xx", "À ranger", "Emplacement à préciser", "Achats récents pas encore localisés", 90),
]

ARTICLES = []


def seuil_auto(cible):
    """Seuil de rachat par défaut : 75 % du stock normal, ou tout le stock s'il est petit."""
    if cible is None:
        return None
    return cible if cible <= 3 else max(1, round(cible * 0.75))


def P(dom, nom, formule, cond, lieu, prec=None, etat="ok", rem=None, verif=False,
      cat="produit", achats=(), four=None, lien=None, prix=None):
    """Article suivi par état (produit chimique, consommable)."""
    ARTICLES.append(dict(domaine=dom, categorie=cat, nom=nom, formule=formule, conditionnement=cond,
                         suivi="etat", quantite=None, cible=None, seuil=None, etat=etat,
                         lieu_id=lieu, precision_lieu=prec, remarque=rem, a_verifier=verif,
                         achats=list(achats), fournisseur=four, lien=lien, prix=prix))


def N(dom, cat, nom, cond, q, lieu, prec=None, rem=None, verif=False, achats=(),
      four=None, lien=None, prix=None, cible=None):
    """Article compté (verrerie, matériel). q = quantité actuelle estimée."""
    c = q if cible is None else cible
    ARTICLES.append(dict(domaine=dom, categorie=cat, nom=nom, formule=None, conditionnement=cond,
                         suivi="nombre", quantite=q, cible=c, seuil=seuil_auto(c), etat="ok",
                         lieu_id=lieu, precision_lieu=prec, remarque=rem, a_verifier=verif,
                         achats=list(achats), fournisseur=four, lien=lien, prix=prix))


# Raccourci pour un achat : (année, quantité, prix unitaire, fournisseur, statut dans le budget)
def achat(annee, q, prix, four, statut):
    return (annee, q, prix, four, statut)


CONATEX = "Conatex"
SORDA = "Sordalab"
EQUA = "Equascience"

# ===================================================================== CHIMIE · produits
# --- 1er étage : acides et bases
P("chimie", "Acide chlorhydrique 1 mol/L", "HCl", "6 L", "sp-ax1")
P("chimie", "Acide chlorhydrique 23 %", "HCl", "1 L", "xx", verif=True,
  rem="Acheté pour diluer en solution 1 mol/L.",
  achats=[achat(2026, 1, 4.25, SORDA, "commandé")], four=SORDA, prix=4.25,
  lien="https://sordalab.com/FR/catalogue/chimie/acide-chlorhydrique-23,SA087-1L,SA087-5L,.php")
P("chimie", "Acide nitrique 1 mol/L", "HNO₃", "1 L", "sp-ax1")
P("chimie", "Acide sulfurique 0,5 mol/L", "H₂SO₄", "1 L", "sp-ax1")
P("chimie", "Acide sulfurique concentré 96 %", "H₂SO₄", "1 L", "sp-ax1")
P("chimie", "Ammoniaque 1 mol/L", "NH₃", "1 L", "sp-ax1")
P("chimie", "Réactif de Schiff", None, "500 mL", "sp-ax1", rem="Noté « Base de Schiff » dans l'inventaire 2022.")
P("chimie", "Hydroxyde de sodium (pastilles)", "NaOH", "500 g", "sp-ax1")
P("chimie", "Hydroxyde de sodium 1 mol/L", "NaOH", "5 L", "sp-ax1",
  rem="Solution mère pour les dilutions. L'inventaire 2022 mentionne aussi 1 L ailleurs.")
P("chimie", "Hydroxyde de sodium 0,1 mol/L", "NaOH", "1 L", "sp-ax1")
P("chimie", "Soude caustique (qualité ménagère)", "NaOH", "2 boîtes", "xx", verif=True,
  achats=[achat(2022, 2, 15, "Amazon", "commandé")], four="Amazon", prix=15)
P("chimie", "Hypochlorite de sodium 9,6 %", "NaClO", "1 L", "sp-ax1")

# --- 2e étage : sels (ordre alphabétique de l'élément, comme l'ancien inventaire)
P("chimie", "Nitrate d'argent, solution 1 %", "AgNO₃", "500 mL", "sp-ax2", etat="presque_vide",
  rem="« Bientôt vide » en 2022.")
P("chimie", "Nitrate d'argent", "AgNO₃", "50 g", "sp-ax2")
P("chimie", "Chlorure de baryum", "BaCl₂", "250 g", "sp-ax2")
P("chimie", "Oxyde de calcium", "CaO", "1 kg", "sp-ax2")
P("chimie", "Eau de chaux", "Ca(OH)₂", "1 L", "sp-ax2")
P("chimie", "Chlorure de calcium anhydre", "CaCl₂", "250 g", "xx", verif=True,
  achats=[achat(2026, 1, 6.05, SORDA, "arrivé")], four=SORDA, prix=6.05,
  lien="https://sordalab.com/FR/catalogue/chimie/calcium-chlorure-anhydre,SR131-250G,SR131-500G,SR131-1KG,.php")
P("chimie", "Chlorure de cobalt(II) hexahydraté", "CoCl₂·6H₂O", "quantité inconnue", "sp-ax2")
P("chimie", "Sulfate de cuivre(II), solution", "CuSO₄", "quantité inconnue", "sp-ax2")
P("chimie", "Chlorure de cuivre(II) dihydraté", "CuCl₂·2H₂O", "quantité inconnue", "sp-ax2",
  rem="Noté « . 10 H2O » dans l'inventaire 2022 : vérifier l'étiquette.")
P("chimie", "Nitrate de cuivre(II)", "Cu(NO₃)₂", "500 g", "sp-ax2")
P("chimie", "Chlorure de fer(III) hexahydraté", "FeCl₃·6H₂O", "250 g", "sp-ax2")
P("chimie", "Chlorure de fer(II)", "FeCl₂", "250 g", "sp-ax2", etat="introuvable",
  rem="Déjà introuvable en 2022.")
P("chimie", "Sulfate d'ammonium et de fer(II) hexahydraté (sel de Mohr)", "(NH₄)₂Fe(SO₄)₂·6H₂O",
  "quantité inconnue", "sp-ax2")
P("chimie", "Chlorure de potassium", "KCl", "250 g", "sp-ax2")
P("chimie", "Iodure de potassium", "KI", "2 × 250 g", "sp-ax2",
  four=SORDA, prix=25, lien="https://sordalab.be/FR/catalogue/chimie/potassium-iodure,SR254-250G,SR254-500G,SR254-1KG,.php",
  achats=[achat(2022, 1, 25, SORDA, "commandé (arrivé le 28/11/2022)")])
P("chimie", "Nitrate de potassium", "KNO₃", "1 kg", "sp-ax2")
P("chimie", "Hydroxyde de potassium", "KOH", "250 g", "sp-ax2")
P("chimie", "Permanganate de potassium", "KMnO₄", "250 g", "sp-ax2")
P("chimie", "Thiocyanate de potassium", "KSCN", "500 g", "sp-ax2")
P("chimie", "Peroxodisulfate de potassium (persulfate)", "K₂S₂O₈", "250 g", "xx", verif=True,
  achats=[achat(2026, 1, 10.4, SORDA, "arrivé")], four=SORDA, prix=10.4,
  lien="https://sordalab.com/FR/catalogue/chimie/potassium-peroxodisulfate,SC024-1KG,SC024-250G,.php")
P("chimie", "Hexacyanoferrate(II) de potassium trihydraté", "K₄[Fe(CN)₆]·3H₂O", "1 flacon", "xx", verif=True,
  achats=[achat(2026, 1, 4.8, SORDA, "arrivé")], four=SORDA, prix=4.8,
  lien="https://sordalab.com/FR/catalogue/chimie/potassium-hexacyanoferrate-ii-trihydrate,SR251-500G,SR251-250G,SR251-50G,SR251-100G,.php")
P("chimie", "Sulfate de magnésium", "MgSO₄", "500 g", "sp-ax2")
P("chimie", "Hydrogénocarbonate de sodium (bicarbonate)", "NaHCO₃", "2 × 1 kg + 1 pot", "sp-ax2",
  rem="Deux lignes fusionnées (« bicarbonate » et « hydrogénocarbonate »).")
P("chimie", "Carbonate de sodium anhydre", "Na₂CO₃", "250 g", "sp-ax2")
P("chimie", "Chlorure de sodium", "NaCl", "500 g", "sp-ax2")
P("chimie", "Sulfate de sodium", "Na₂SO₄", "500 g", "sp-ax2")
P("chimie", "Phosphate de sodium", "Na₃PO₄", "1 kg", "sp-ax2")
P("chimie", "Sulfite de sodium anhydre", "Na₂SO₃", "2 × 250 g", "sp-ax2",
  four=SORDA, prix=4.9, lien="https://sordalab.be/FR/catalogue/chimie/sodium-sulfite-anhydre,SR296-500G,SR296-1KG,SR296-250G,.php",
  achats=[achat(2022, 1, 4.9, SORDA, "commandé (arrivé le 28/11/2022)")])
P("chimie", "Thiosulfate de sodium anhydre", "Na₂S₂O₃", "250 g", "xx", verif=True,
  achats=[achat(2026, 1, 9.9, SORDA, "arrivé")], four=SORDA, prix=9.9,
  lien="https://sordalab.com/FR/catalogue/chimie/sodium-thiosulfate-anhydre-,SR299-250G,SR299-1KG,.php")
P("chimie", "Tétraborate de sodium décahydraté (borax)", "Na₂B₄O₇·10H₂O", "500 g", "sp-ax2")
P("chimie", "Alginate de sodium", None, "1 flacon", "xx", verif=True,
  achats=[achat(2026, 1, 16.3, SORDA, "arrivé")], four=SORDA, prix=16.3,
  lien="https://sordalab.com/FR/catalogue/chimie/sodium-alginate,SR038-500G,SR038-100G,.php")
P("chimie", "Nitrate de plomb(II)", "Pb(NO₃)₂", "100 g", "sp-ax2")
P("chimie", "Chlorure de zinc anhydre", "ZnCl₂", "1 kg", "sp-ax2")
P("chimie", "Nitrate de zinc", "Zn(NO₃)₂", "100 g", "sp-ax2")

# --- 3e étage : éléments et divers
P("chimie", "Argent (pastilles)", "Ag", "10 g", "sp-ax3")
P("chimie", "Cuivre (fil)", "Cu", "5 m", "sp-ax3")
P("chimie", "Cuivre en poudre", "Cu", "100 g", "sp-ax3")
P("chimie", "Limaille de fer", "Fe", "250 g", "sp-ax3")
P("chimie", "Peroxyde d'hydrogène 30 % (110 volumes)", "H₂O₂", "1 L à 9,82 mol/L", "sp-ax3")
P("chimie", "Diiode bisublimé (poudre)", "I₂", "250 g", "sp-ax3")
P("chimie", "Magnésium en poudre", "Mg", "250 g", "sp-ax3")
P("chimie", "Magnésium en ruban", "Mg", "25 g", "sp-ax3")
P("chimie", "Soufre en poudre", "S", "500 g", "sp-ax3")
P("chimie", "Zinc en poudre", "Zn", "250 g", "sp-ax3")

# --- 4e étage : organiques
P("chimie", "Éthanoate de butyle (acétate de n-butyle)", "CH₃COOC₄H₉", "1 L", "sp-ax4")
P("chimie", "Propan-2-one (acétone)", "CH₃COCH₃", "1 L", "sp-ax4")
P("chimie", "Propan-2-one technique (acétone)", "CH₃COCH₃", "2 L", "sp-ax4")
P("chimie", "Acide éthanoïque (acétique) pur", "CH₃COOH", "1 L", "sp-ax4")
P("chimie", "Acide butanoïque", "C₃H₇COOH", "100 mL", "sp-ax4")
P("chimie", "Alcool à brûler", None, "2 × 1 L", "sp-ax4", four="Grande surface", prix=4,
  achats=[achat(2023, 1, 3.59, "Delhaize", "acheté"), achat(2024, 2, 4, "Grande surface", "acheté")])
P("chimie", "3-Méthylbutan-1-ol (alcool isoamylique)", "C₅H₁₁OH", "1 L", "sp-ax4")
P("chimie", "Butan-1-ol", "C₄H₉OH", "1 L", "sp-ax4")
P("chimie", "Butan-2-ol", "C₄H₉OH", "500 mL", "sp-ax4")
P("chimie", "2-Méthylpropan-2-ol (tert-butanol)", "C₄H₉OH", "1 L", "sp-ax4")
P("chimie", "Cyclohexane", "C₆H₁₂", "1 L", "sp-ax4")
P("chimie", "N-Éthyléthanamine (diéthylamine)", "(C₂H₅)₂NH", "100 mL", "sp-ax4")
P("chimie", "Éthanal", "CH₃CHO", "100 mL", "sp-ax4")
P("chimie", "Éthanol absolu dénaturé", "C₂H₅OH", "2,5 L", "sp-ax4", four=SORDA, prix=40,
  lien="https://sordalab.be/FR/catalogue/chimie/ethanol-absolu-denature,SI039-2-5L,SI039-1L,.php",
  achats=[achat(2022, 1, 40, SORDA, "commandé (reçu le 28/11/2022)")])
P("chimie", "Éther de pétrole 40-60 °C", None, "1 L", "sp-ax4")
P("chimie", "Propane-1,2,3-triol (glycérol)", "C₃H₅(OH)₃", "1 L", "sp-ax4")
P("chimie", "Hexane", "C₆H₁₄", "1 L", "sp-ax4")
P("chimie", "Hexan-1-ol", "C₆H₁₃OH", "1 L", "sp-ax4")
P("chimie", "Méthanol", "CH₃OH", "1 L", "sp-ax4")

# --- Armoire droite : indicateurs et divers
P("chimie", "Acide éthanoïque 10 %", "CH₃COOH", "5 L", "sp-ad", prec="1er étage")
P("chimie", "Bleu de méthylène", None, "petit pot", "sp-ad", prec="3e étage")
P("chimie", "Bleu de bromothymol (BBT)", None, "100 mL", "sp-ad", prec="3e étage")
P("chimie", "Fluorescéine", None, "quantité inconnue", "sp-ad", prec="3e étage")
P("chimie", "Hélianthine (orange de méthyle)", None, "500 mL", "sp-ad", prec="3e étage")
P("chimie", "Phénolphtaléine 0,2 %", None, "100 mL", "sp-ad", prec="3e étage")
P("chimie", "Phénolphtaléine solide", None, "50 g", "sp-ad", prec="3e étage")
P("chimie", "Vert de méthyle", None, "5 g", "sp-ad", prec="3e étage")
P("chimie", "Silicate de sodium, solution (jardin chimique)", "Na₂SiO₃", "2 × 1 L", "sp-ad",
  four=SORDA, prix=11.5, lien="https://sordalab.be/FR/catalogue/chimie/sodium-silicate-solution,SB029-1L,.php",
  achats=[achat(2022, 2, 11.5, SORDA, "commandé (arrivé le 28/11/2022)")])
P("chimie", "Eau ultrapure (milliQ)", "H₂O", "—", "sp-ad", etat="vide", rem="« 0 mL » en 2022.")
P("chimie", "Empois d'amidon", None, "100 mL", "xx", verif=True,
  achats=[achat(2026, 1, 11.4, SORDA, "arrivé")], four=SORDA, prix=11.4,
  lien="https://sordalab.com/FR/catalogue/chimie/amidon-en-empois,SR090-100ML,.php")

# --- Kit plastiques (salle prépa)
P("chimie", "Éthylène-acétate de vinyle (EVA, solide)", None, "100 g", "sp-pt", prec="Kit plastiques")
P("chimie", "Borax anhydre (kit plastiques)", "Na₂B₄O₇", "20 mL", "sp-pt", prec="Kit plastiques")
P("chimie", "Alcool polyvinylique", None, "200 mL", "sp-pt", prec="Kit plastiques")
P("chimie", "Billes de polyacrylamide (hydrogel)", None, "1 sachet", "xx", verif=True,
  achats=[achat(2026, 1, 9.95, "Amazon", "commandé")], four="Amazon", prix=9.95)

# --- Consommables chimie
P("chimie", "Eau déminéralisée", "H₂O", "bidons de 5 L", "sp-pt", cat="consommable",
  four="Grande surface", prix=5,
  achats=[achat(2022, 1, 5, "Grande surface", "acheté"), achat(2023, 2, 5, "Colruyt", "acheté"),
          achat(2024, 2, 5, "Grande surface", "acheté"), achat(2025, 5, 5, "Grande surface", "acheté"),
          achat(2026, 5, 5, "Grande surface", "acheté")])
P("commun", "Gants en nitrile", None, "5 boîtes", "sp-pt", cat="consommable")
P("commun", "Gants en latex, taille M", None, "boîtes de 100", "sp-pt", cat="consommable",
  four=SORDA, prix=11.25,
  lien="https://sordalab.com/FR/catalogue/laboratoire/gants-dexamen-jetables-en-latex,GTG,GTM,GTP,GTXL,.php",
  achats=[achat(2023, 3, 11.25, CONATEX, "commandé"), achat(2024, 3, 11.25, CONATEX, "commandé"),
          achat(2025, 3, 11.25, CONATEX, "commandé"), achat(2026, 3, 11.25, SORDA, "arrivé")])
P("chimie", "Pipettes Pasteur en plastique", None, "≈ 700 pièces", "sp-pt", cat="consommable",
  four=CONATEX, prix=1.84,
  lien="https://www.conatex.be/catalog/laboratoire/materiel_de_laboratoire/pipettes_seringues_et_accessoires/product-pipettes_pasteur_pe_2ml_50/sku-1203581",
  rem="Sachets de 50.", achats=[achat(2022, 5, 1.84, CONATEX, "commandé")])
P("chimie", "Papier pH (rouleaux)", None, "8 rouleaux", "sp-pt", cat="consommable", four=CONATEX, prix=4,
  lien="https://www.conatex.be/catalog/environnement/coffrets_d_analyses/analyse_de_l_environnement/product-papier_ph_1_a_14/sku-2007745",
  achats=[achat(2022, 5, 4, CONATEX, "commandé")])
P("chimie", "Bandelettes pH", None, "2 boîtes", "sp-pt", cat="consommable")
P("chimie", "Papier chromatographie", None, "≈ 100 feuilles", "sp-pt", cat="consommable")
P("commun", "Papier essuie-tout (Tork)", None, "1 rouleau", "lc-ar", cat="consommable",
  achats=[achat(2022, 1, 10, "—", "commandé")])
P("chimie", "Baguettes en verre", None, "beaucoup", "lc-ar", cat="consommable",
  rem="Aussi dans l'armoire de la salle prépa.")
P("chimie", "Taille-crayons en magnésium", "Mg", "4 pièces", "xx", cat="consommable", verif=True,
  achats=[achat(2023, 4, 4, "Amazon", "commandé")], four="Amazon", prix=4)
P("chimie", "Bouteilles de gaz pour bec Bunsen", None, "5 bouteilles", "sp-pt", cat="consommable")
P("commun", "Colle à bois", None, "1 pot", "sp-ac", cat="consommable")

# ===================================================================== CHIMIE · verrerie
V = "verrerie"
N("chimie", V, "Burette avec robinet", "50 mL", 28, "lc-ar", "4e étage",
  rem="18 en 2022 + 5 achetées en 2023 + 5 en 2024.", four=CONATEX, prix=37.14,
  lien="https://www.conatex.be/catalog/laboratoire/verrerie/burettes_et_seringues/product-burette_de_mohr_a_robinet_en_ptfe_50_ml/sku-2006232",
  achats=[achat(2023, 5, 35.07, CONATEX, "commandé"), achat(2024, 5, 37.14, CONATEX, "commandé")])
N("chimie", V, "Burette sans robinet", "25 mL", 15, "lc-ar", "4e étage")
for vol, q in [("5 mL", 12), ("10 mL", 14), ("20 mL", 8), ("25 mL", 8), ("50 mL", 3)]:
    N("chimie", V, "Pipette en verre", vol, q, "lc-ar", "1er étage")
N("chimie", V, "Bécher", "25 mL", 10, "lc-ar", "2e étage")
N("chimie", V, "Bécher", "50 mL", 1, "lc-ar", "2e étage")
N("chimie", V, "Bécher", "100 mL", 21, "lc-ar", "2e étage", four=CONATEX, prix=1.42,
  lien="https://www.conatex.be/catalog/laboratoire/verrerie/bechers_et_verres_a_pied/product-becher_forme_basse_100_ml_vb_3_3/sku-2006534",
  achats=[achat(2024, 10, 1.42, CONATEX, "commandé")])
N("chimie", V, "Bécher", "150 mL", 4, "lc-ar", "2e étage")
N("chimie", V, "Bécher", "250 mL", 25, "lc-ar", "2e étage", four=CONATEX, prix=1.52,
  lien="https://www.conatex.be/catalog/laboratoire/verrerie/bechers_et_verres_a_pied/product-becher_forme_basse_250_ml_vb_3_3/sku-2006533",
  achats=[achat(2024, 10, 1.52, CONATEX, "commandé")])
N("chimie", V, "Bécher", "400 mL", 12, "lc-ar", "2e étage", four=CONATEX, prix=2.16,
  lien="https://www.conatex.be/catalog/laboratoire/verrerie/bechers_et_verres_a_pied/product-becher_forme_basse_400_ml_vb_3_3/sku-2006532",
  achats=[achat(2024, 10, 2.16, CONATEX, "commandé")])
N("chimie", V, "Bécher", "1000 mL", 3, "lc-ar", "2e étage")
N("chimie", V, "Erlenmeyer", "100 mL", 13, "lc-ar", "2e étage")
N("chimie", V, "Erlenmeyer", "250 mL", 17, "lc-ar", "2e étage", four=CONATEX, prix=7.25,
  lien="https://www.conatex.be/catalog/laboratoire/verrerie/fioles_erlenmeyer/product-erlenmeyer_col_etroit_250_ml_duran_r/sku-1113018",
  achats=[achat(2024, 5, 7.25, CONATEX, "commandé")])
N("chimie", V, "Erlenmeyer", "500 mL", 1, "lc-ar", "2e étage")
N("chimie", V, "Erlenmeyer bouchable", "250 mL", 3, "sp-ad")
N("chimie", V, "Cristallisoir", "100 mL", 4, "sp-ad")
N("chimie", V, "Fiole jaugée", "100 mL", 12, "lc-ar", four=CONATEX, prix=8,
  lien="https://www.conatex.be/catalog/laboratoire/verrerie/ballons_et_fioles_jaugees/product-fiole_jaugee_bouchee_100_ml_vb_3_3/sku-2006710",
  rem="2 en 2022 + 10 « matras » commandés chez Conatex en octobre 2022.",
  achats=[achat(2022, 10, 8, CONATEX, "commandé")])
N("chimie", V, "Fiole jaugée", "250 mL", 3, "lc-ar")
N("chimie", V, "Fiole jaugée", "500 mL", 2, "lc-ar")
N("chimie", V, "Ballon bouchable", "250 mL", 1, "sp-ad")
N("chimie", V, "Tube à essai", "standard", 500, "lc-ar", "3e étage",
  rem="Un lot de tubes de 15 mm a aussi été commandé en 2026 (quantité à compter).",
  four=CONATEX, lien="https://www.conatex.be/laboratoire/verrerie/tubes-a-essais-et-accessoires/",
  achats=[achat(2026, 1, 50, CONATEX, "commandé (lot)")])
N("chimie", V, "Gros tube à essai", None, 30, "sp-ad")
N("chimie", V, "Entonnoir en verre", "petit (Ø 60 mm)", 15, "lc-ar", four=CONATEX, prix=2.35,
  lien="https://www.conatex.be/catalog/laboratoire/materiel_de_laboratoire/ampoules_a_decanter_entonnoirs_et_filtres/product-entonnoir_o_60_mm_vb_3_3/sku-1040202",
  achats=[achat(2024, 5, 2.35, CONATEX, "commandé")])
N("chimie", V, "Entonnoir en verre", "moyen", 2, "sp-ad")
N("chimie", V, "Entonnoir en plastique", None, 2, "sp-ad")
N("chimie", V, "Coupelle en plastique", "grande", 10, "lc-ar", "2e étage")
N("chimie", V, "Coupelle en plastique", "petite", 10, "lc-ar", "2e étage")
N("chimie", V, "Verre de montre", "petit", 10, "lc-ar")
N("chimie", V, "Verre à pied en verre (éprouvette graduée)", "100 mL", 21, "lc-ar", "3e étage")
N("chimie", V, "Verre à pied en verre (éprouvette graduée)", "10 mL", 20, "lc-ar", "3e étage")
N("chimie", V, "Verre à pied en plastique (éprouvette graduée)", "250 mL", 4, "sp-ad", "5e étage")
N("chimie", V, "Verre à pied en plastique (éprouvette graduée)", "100 mL", 4, "sp-ad", "5e étage")
N("chimie", V, "Verre à pied en plastique (éprouvette graduée)", "50 mL", 5, "sp-ad", "5e étage")
N("chimie", V, "Verre à pied en plastique (éprouvette graduée)", "25 mL", 4, "sp-ad", "5e étage")
for vol, q in [("5 mL", 11), ("10 mL", 35), ("25 mL", 8)]:
    N("chimie", V, "Pipette graduée en plastique", vol, q, "lc-ho")
N("chimie", V, "Ampoule à décanter", "250 mL", 4, "sp-ad", four=SORDA, prix=35,
  lien="https://sordalab.be/FR/catalogue/laboratoire/ampoules-a-decanter-forme-poire-robinet-teflon,ART100,ART250,.php",
  rem="2 en 2022 + 2 commandées en 2022.", achats=[achat(2022, 2, 35, SORDA, "commandé")])
N("chimie", V, "Flacon de stockage", "500 mL", 30, "sp-ad", four=CONATEX, prix=4.27,
  lien="https://www.conatex.be/catalog/laboratoire/verrerie/flacons_pissettes_et_fioles_a_vide/product-flacon_a_reactif_col_large_500_ml_vb_3_3/sku-2006790",
  achats=[achat(2023, 10, 4.27, CONATEX, "commandé")])
N("chimie", V, "Flacon", "10 mL", 8, "sp-ad")
N("chimie", V, "Bouteille compte-gouttes", "50 mL", 35, "sp-ad")
N("chimie", V, "Bouteille compte-gouttes", "100 mL", 20, "sp-ad")
N("chimie", V, "Pissette", "1 L", 3, "sp-ad")
N("chimie", V, "Pissette", "500 mL", 4, "sp-ad")
N("chimie", V, "Pissette", "250 mL", 2, "sp-ad")
N("chimie", V, "Tube à fond plat", None, 3, "sp-pt")
N("chimie", V, "Tube à centrifuger", "15 mL", 3, "sp-pt")

# ===================================================================== CHIMIE · matériel
M = "materiel"
N("chimie", M, "Poire à pipeter", None, 20, "lc-ar", "1er étage", four=CONATEX, prix=8.15,
  lien="https://www.conatex.be/catalog/laboratoire/materiel_de_laboratoire/pipettes_seringues_et_accessoires/product-poire_propipette_longue/sku-1093368",
  achats=[achat(2022, 10, 8.15, CONATEX, "commandé")])
N("chimie", M, "Support rotatif pour pipettes", None, 2, "lc-ar", four=CONATEX, prix=21.24,
  achats=[achat(2023, 2, 21.24, CONATEX, "commandé")])
N("chimie", M, "Bouchon", None, 20, "sp-ad")
N("chimie", M, "Support pour tubes à essai", None, 24, "sp-pt")
N("chimie", M, "Pince en plastique", None, 3, "sp-pt")
N("chimie", M, "Spatule en plastique", None, 1, "sp-pt")
N("chimie", M, "Testeur pH", None, 8, "sp-ti", "3e tiroir")
N("chimie", M, "Thermomètre infrarouge", None, 2, "sp-ti", "3e tiroir")
N("chimie", M, "Agitateur magnétique chauffant", None, 1, "sp-pt")
N("chimie", M, "Barreau aimanté (agitateur)", None, 3, "sp-pt")
N("chimie", M, "Embout pour bouteille de gaz", None, 4, "sp-pt")
N("chimie", M, "Double chauffe-plat", None, 1, "sp-pt")
N("chimie", M, "Plaque chauffante", None, 1, "sp-pt")
N("chimie", M, "Calorimètre", None, 8, "sp-pt")
N("commun", M, "Balance de poche", None, 8, "sp-ag")
N("commun", M, "Balance (1000 g)", None, 1, "sp-ag")
N("chimie", M, "Support (anneau)", None, 10, "lc-ho")
N("chimie", M, "Statif", None, 15, "lc-ho")
N("chimie", M, "Pince trois doigts avec noix", None, 10, "lc-ho", four=CONATEX, prix=17.95,
  lien="https://www.conatex.be/catalog/laboratoire/verrerie/burettes_et_seringues/product-pince_3_doigts_avec_noix/sku-1093467",
  achats=[achat(2022, 5, 10, CONATEX, "commandé"), achat(2023, 5, 17.95, CONATEX, "commandé")])
N("chimie", M, "Bec Bunsen", None, 8, "sp-ag", "Caisse matériel gaz")
N("chimie", M, "Tuyau à gaz", None, 10, "sp-ag", "Caisse matériel gaz")
N("chimie", M, "Trépied", None, 8, "sp-ag", "Caisse matériel gaz", verif=True,
  rem="« Pas arrivés » dans l'inventaire 2022.")
N("chimie", M, "Grille", None, 10, "sp-ag", "Caisse matériel gaz")
N("chimie", M, "Seringue à gaz", None, 2, "sp-ag", "Caisse matériel gaz")
N("chimie", M, "Manomètre", None, 1, "sp-ag")
N("chimie", M, "Brosse pour tubes à essai", None, 5, "lc-ev")
N("chimie", M, "Brosse pour erlenmeyers", None, 2, "lc-ev", rem="Évier de la salle prépa.")
N("chimie", M, "Lame de cuivre (électrode)", None, 10, "sp-bp")
N("chimie", M, "Lame de zinc (électrode)", None, 10, "sp-bp")
N("chimie", M, "Modèles moléculaires 3D (caisse)", None, 1, "sp-ag")
N("chimie", M, "Kit Snatoms (modèles moléculaires)", None, 1, "sp-ag", verif=True, four="Snatoms", prix=129.41,
  lien="https://snatoms.com/products/snatoms-x-complete-kit", achats=[achat(2022, 1, 129.41, "Snatoms", "commandé")])
N("chimie", M, "Échantillons de plastiques (PET, PEHD, PLA…)", None, 10, "sp-pt", "Kit plastiques")
N("chimie", M, "Lames de plastiques (PEHD, PVC, PS, PP, PET, PMMA)", None, 10, "sp-pt", "Kit plastiques")
N("chimie", M, "Languette thermorétractable", None, 20, "sp-pt", "Kit plastiques")
N("chimie", M, "Électrolyseur en U", None, 1, "xx", verif=True, four=EQUA, prix=39.9,
  lien="https://www.equascience.com/materiel-experiences-de-chimie/1167-electrolyseur-en-u.html",
  achats=[achat(2022, 1, 39.9, EQUA, "commandé")])
N("chimie", M, "Bloc secteur universel 3-12 V", None, 1, "xx", verif=True, four=EQUA, prix=14.9,
  achats=[achat(2022, 1, 14.9, EQUA, "commandé")])
N("chimie", M, "Cordon jack femelle / 2 fiches bananes", None, 1, "xx", verif=True, four=EQUA, prix=9.9,
  achats=[achat(2022, 1, 9.9, EQUA, "commandé")])
N("chimie", M, "Câble jack mâle/mâle", None, 1, "xx", verif=True, four=EQUA, prix=3.35,
  achats=[achat(2022, 1, 3.35, EQUA, "commandé")])
N("chimie", M, "Bidon de récupération 10 L", None, 2, "sp-pt", four=CONATEX, prix=10.19,
  achats=[achat(2024, 2, 10.19, CONATEX, "commandé")])
N("commun", M, "Boîte de rangement pour jeux de cartes", None, 4, "xx", verif=True, four="Amazon", prix=19,
  achats=[achat(2023, 2, 19, "Amazon", "commandé"), achat(2024, 2, 19, "Amazon", "commandé")])
N("commun", M, "Armoire à roulettes", None, 1, "sp-pt", verif=True,
  rem="Prévue au budget 2025, sans statut d'achat.", achats=[achat(2025, 1, 150, "—", "sans statut")])
N("chimie", M, "Kit de gaz nobles lumineux", None, 1, "xx", verif=True, four="Haloplasma", prix=134,
  lien="https://haloplasma.com/products/lumora-the-ultimate-gas-element-collection-glowing-display",
  achats=[achat(2026, 1, 134, "Haloplasma", "arrivé")])

# ===================================================================== BIOLOGIE
P("biologie", "Liqueur de Fehling A", None, "500 mL", "lb-ar", verif=True, rem="« Bio ? » en 2022.")
P("biologie", "Liqueur de Fehling B", None, "500 mL", "lb-ar", verif=True, four=SORDA, prix=6.85,
  lien="https://www.sordalab.com/FR/catalogue/chimie/liqueur-de-fehling-b,SB014-1L,SB014-500ML,.php",
  achats=[achat(2024, 1, 6.85, SORDA, "sans statut")])
P("biologie", "Lugol", None, "2 flacons (dont 100 mL à 1 %)", "lb-ar", verif=True)
P("biologie", "Gomme arabique", None, "100 g", "lb-ar", verif=True)
P("biologie", "Amidon soluble", None, "250 g", "lb-ar", verif=True)
P("biologie", "Glucose", "C₆H₁₂O₆", "2 × 200 g", "lb-ar", rem="Deux lignes fusionnées.")
P("biologie", "Saccharose", "C₁₂H₂₂O₁₁", "250 g", "lb-ar", verif=True)
P("biologie", "Sucre", None, "1 kg", "lb-ar")
P("biologie", "Huile", None, "500 mL", "lb-ar")
P("biologie", "Vinaigre", None, "1 bouteille", "lb-ar")
P("biologie", "Lames de bistouri", None, "20 lames", "lb-ar", cat="consommable", verif=True, four=EQUA, prix=0.455,
  achats=[achat(2023, 20, 0.455, EQUA, "sans statut")])
P("biologie", "Kit d'identification des molécules du vivant", None, "1 kit", "lb-ar", cat="consommable",
  verif=True, four=SORDA, prix=35.3,
  lien="https://sordalab.com/FR/catalogue/svt/identification-des-molecules-du-vivant,KIMV,.php",
  achats=[achat(2025, 1, 35.3, SORDA, "commandé")])
P("biologie", "Kit de détermination des groupes sanguins", None, "1 kit", "lb-ar", cat="consommable",
  verif=True, four=SORDA, prix=76.1,
  achats=[achat(2022, 1, 76.1, SORDA, "sans statut")])
N("biologie", "consommable", "Lame de microscope bleue", None, 150, "lb-ar")
N("biologie", "consommable", "Lame de microscope", None, 50, "lb-ar")
N("biologie", M, "Cuillère en plastique", None, 3, "lb-ar")
N("biologie", M, "Microscope optique", None, 2, "lb-ar", verif=True, four=SORDA, prix=178.8,
  rem="2 achetés en 2022 (les microscopes plus anciens ne sont pas dans l'inventaire).",
  achats=[achat(2022, 2, 178.8, SORDA, "sans statut")])
N("biologie", M, "Set de 5 pinces", None, 1, "lb-ar", verif=True, four="Brico", prix=15.99,
  achats=[achat(2023, 1, 15.99, "Brico", "sans statut")])
N("biologie", M, "Appareil de Berlèse (élève)", None, 4, "lb-ar", verif=True, four=SORDA, prix=18.1,
  lien="https://www.sordalab.com/FR/catalogue/svt/appareils-de-berlese-eleve,BERELV,.php",
  rem="Au budget 2024 (sans statut) et 2025 (commandé) : peut-être 8.",
  achats=[achat(2024, 4, 18.1, SORDA, "sans statut"), achat(2025, 4, 18.1, SORDA, "commandé")])
N("biologie", M, "Collection de préparations microscopiques (groupes sanguins)", None, 1, "lb-ar", verif=True,
  four=SORDA, prix=177, achats=[achat(2026, 1, 177, SORDA, "arrivé")])
N("biologie", M, "Préparation microscopique (cellules buccales humaines)", None, 6, "lb-ar", verif=True,
  four=SORDA, prix=6.5, achats=[achat(2026, 6, 6.5, SORDA, "arrivé")])
N("biologie", M, "Préparation microscopique (oignon : épiderme, stomates)", None, 6, "lb-ar", verif=True,
  four=SORDA, prix=8.05, achats=[achat(2026, 6, 8.05, SORDA, "arrivé")])
N("biologie", M, "Épi de maïs (génétique)", None, 8, "lb-ar", verif=True, four=SORDA, prix=15.5,
  achats=[achat(2026, 8, 15.5, SORDA, "arrivé")])

# ===================================================================== PHYSIQUE
PH = "physique"
for nom, q, pl in [
    ("Cube de limaille de fer (lignes de champ)", 1, 1),
    ("Plaque de limaille de fer (lignes de champ)", 1, 1),
    ("Aimant cylindrique", 2, 1), ("Aimant en U", 1, 1), ("Barreau aimanté", 1, 1),
    ("Support et aiguille (expérience d'Œrsted)", 1, 1),
    ("Dynamomètre 20 N", 1, 2), ("Dynamomètre 10 N", 1, 2), ("Dynamomètre 5 N", 3, 2),
    ("Dynamomètre 2 N", 16, 2), ("Dynamomètre 1 N", 8, 2),
    ("Masse de 100 g à deux crochets", 3, 2), ("Masse cylindrique de 50 g à crochet", 1, 2),
    ("Statif (physique)", 1, 3), ("Tube de glycérine (MRU)", 8, 3),
    ("Poulie à crochet", 11, 4), ("Poulie à tige", 15, 4), ("Corde blanche", 2, 4),
    ("Pince de serrage", 13, 4),
    ("Écran avec tige de support", 1, 5), ("Loupe en plastique", 8, 5), ("Prisme aimanté", 1, 5),
]:
    N(PH, M, nom, None, q, "lp-ar", f"Planche {pl}",
      rem="Noté « tube de glycine » en 2022." if "glycérine" in nom else None)
N(PH, M, "Mallette d'optique (lentilles et planches)", None, 0, "lp-ar", "Planche 5", cible=1,
  rem="« Disparue » en 2022.", verif=True)
N(PH, M, "Laser à 3 faisceaux parallèles aimanté", None, 0, "lp-ar", "Planche 5", cible=1,
  rem="« Disparu » en 2022.", verif=True)
N(PH, M, "Grand aquarium", None, 1, "lp-ac")
N(PH, M, "Multimètre", None, 8, "sp-bp")
N(PH, M, "Pile 9 V", None, 12, "sp-bp")
N(PH, M, "Cordon à pinces crocodiles", None, 40, "sp-bp", verif=True, four=EQUA, prix=0.89,
  rem="Lots de 10. L'inventaire 2022 mentionnait aussi des câbles croco sans quantité.",
  achats=[achat(2023, 40, 0.89, EQUA, "sans statut")])
N(PH, M, "Ampoule E10 (culot à vis)", None, 100, "sp-bp", verif=True, four=SORDA, prix=1.48,
  rem="Lots de 10 : 30 en 2023, 20 en 2024, 20 en 2025, 30 en 2026 (4 V / 40 mA). Plus des ampoules 2,5 V en 2022.",
  achats=[achat(2022, 1, 14, "Amazon", "sans statut"), achat(2023, 30, 0.82, EQUA, "sans statut"),
          achat(2024, 20, 1.28, EQUA, "sans statut"), achat(2025, 20, 1.28, EQUA, "commandé"),
          achat(2026, 30, 1.48, SORDA, "arrivé")])
N(PH, M, "Douille E10 sur socle", None, 20, "sp-bp", verif=True, four=EQUA, prix=1.25,
  achats=[achat(2022, 1, 10.79, "Amazon", "sans statut"), achat(2023, 20, 1.25, EQUA, "sans statut")])
N(PH, M, "Pile alcaline 4,5 V", None, 10, "sp-bp", verif=True, four=EQUA, prix=4.15,
  achats=[achat(2023, 10, 4.15, EQUA, "sans statut")])
N(PH, M, "Kit d'électrostatique", None, 1, "lp-ar", verif=True, four=EQUA, prix=37,
  achats=[achat(2022, 1, 37, EQUA, "commandé")])
N(PH, M, "Électroscope à aiguille", None, 1, "lp-ar", verif=True, four=EQUA, prix=35,
  achats=[achat(2022, 1, 35, EQUA, "commandé")])
N(PH, M, "Rails de Laplace avec aimant en U", None, 1, "lp-ar", verif=True, four=EQUA, prix=89,
  achats=[achat(2023, 1, 89, EQUA, "sans statut")])
N(PH, M, "Paire de diapasons 440 Hz avec caisses de résonance", None, 1, "lp-ar", verif=True, four=EQUA, prix=35,
  achats=[achat(2023, 1, 35, EQUA, "sans statut")])
N(PH, M, "Solénoïde (champ magnétique)", None, 1, "lp-ar", verif=True, four=EQUA, prix=36.8,
  achats=[achat(2023, 1, 36.8, EQUA, "sans statut")])
N(PH, "verrerie", "Éprouvette graduée en polypropylène", "250 mL", 12, "lp-ar", verif=True, four=EQUA, prix=4,
  achats=[achat(2023, 12, 4, EQUA, "sans statut")])
N(PH, "verrerie", "Bécher forme basse en polypropylène", "250 mL", 12, "lp-ar", verif=True, four=EQUA, prix=1.5,
  achats=[achat(2023, 12, 1.5, EQUA, "sans statut")])
N(PH, M, "Balance de cuisine", None, 6, "lp-ar", verif=True, four="Action", prix=5.95,
  achats=[achat(2023, 6, 5.95, "Action", "sans statut")])
N(PH, M, "Cuve rhéographique", None, 1, "lp-ar", verif=True, four=EQUA, prix=50,
  achats=[achat(2024, 1, 50, EQUA, "sans statut")])
N(PH, M, "Plaque de visualisation du champ magnétique", None, 4, "lp-ar", verif=True, four=EQUA, prix=12.5,
  achats=[achat(2024, 1, 50, EQUA, "sans statut (lot de 4)")])
N(PH, M, "Aimant néodyme (disque)", None, 10, "lp-ar", verif=True, four="Supermagnete",
  rem="10 achetés en 2024 + d'autres (Ø 20 mm) commandés en 2026.",
  lien="https://www.supermagnete.be/fre/aimants-disques-neodyme/disque-magnetique-20mm-12mm_S-20-12-N",
  achats=[achat(2024, 10, 5, "Supermagnete", "sans statut"), achat(2026, 1, 90, "Supermagnete", "commandés (lot)")])
N(PH, M, "Bateau pop-pop", None, 1, "lp-ar", verif=True, achats=[achat(2024, 1, 50, "Brico", "sans statut")])
N(PH, M, "Modèle expérimental effet Doppler", None, 1, "lp-ar", verif=True, four=CONATEX, prix=149.57,
  achats=[achat(2025, 1, 149.57, CONATEX, "commandé")])
N(PH, M, "Alternateur de démonstration", None, 1, "lp-ar", verif=True, four=CONATEX, prix=134.12,
  achats=[achat(2025, 1, 134.12, CONATEX, "commandé")])
N(PH, M, "Ensemble électromagnétisme", None, 1, "lp-ar", verif=True, four=CONATEX, prix=394,
  achats=[achat(2026, 1, 394, CONATEX, "commandé")])
N(PH, M, "Accessoire galvanomètre", None, 1, "lp-ar", verif=True, four=CONATEX, prix=49.8,
  achats=[achat(2026, 1, 49.8, CONATEX, "sans statut")])
N(PH, M, "Fibre optique (5 m)", None, 1, "lp-ar", verif=True, four=EQUA, prix=9.9,
  achats=[achat(2026, 1, 9.9, EQUA, "commandé")])
N(PH, M, "Pointeur laser", None, 3, "lp-ar", verif=True, four=SORDA, prix=40.33,
  rem="Rouge, vert, violet.", achats=[achat(2026, 1, 121, SORDA, "arrivé (lot de 3)")])


# ===================================================================== Écriture SQL
def lit(v):
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return repr(v)
    return "'" + str(v).replace("'", "''") + "'"


def main():
    sortie = Path(__file__).resolve().parent.parent / "sql" / "02-donnees.sql"
    L = ["-- Contenu de départ de l'inventaire (généré par outils/construire_donnees.py).",
         "-- À coller dans Supabase > SQL Editor APRÈS 01-structure.sql.",
         "-- ⚠️ Remet l'inventaire à zéro : à ne lancer qu'une fois, au démarrage.",
         "begin;",
         "delete from labo_evenements; delete from labo_demandes; delete from labo_articles; delete from labo_lieux;",
         ""]
    for lid, salle, nom, det, ordre in LIEUX:
        L.append(f"insert into labo_lieux(id, salle, nom, details, ordre) values "
                 f"({lit(lid)}, {lit(salle)}, {lit(nom)}, {lit(det)}, {ordre});")
    L.append("")
    cols = ["id", "domaine", "categorie", "nom", "formule", "conditionnement", "suivi", "quantite",
            "cible", "seuil", "etat", "lieu_id", "precision_lieu", "fournisseur", "lien", "prix",
            "remarque", "a_verifier", "maj_par"]
    nb_ev = 0
    for i, a in enumerate(ARTICLES, start=1):
        a["id"] = i
        a["maj_par"] = "Import 2022 + budgets"
        if a["remarque"] is None and a["a_verifier"] and a["achats"]:
            a["remarque"] = "Acheté récemment : vérifier la quantité et l'emplacement."
        vals = ", ".join(lit(a[c]) for c in cols)
        L.append(f"insert into labo_articles({', '.join(cols)}) values ({vals});")
    L.append("")
    for a in ARTICLES:
        L.append(f"insert into labo_evenements(article_id, type, par, note, cree_le) values "
                 f"({a['id']}, 'import', 'Import', 'Inventaire du 30/05/2022', '2022-05-30');")
        for annee, q, prix, four, statut in a["achats"]:
            note = f"Budget {annee} · {four} · {prix} € pièce · {statut}"
            L.append(f"insert into labo_evenements(article_id, type, quantite, par, note, cree_le) values "
                     f"({a['id']}, 'recu', {q}, 'Budget labo', {lit(note)}, '{annee}-09-01');")
            nb_ev += 1
    L.append("")
    L.append("select setval(pg_get_serial_sequence('labo_articles','id'), (select max(id) from labo_articles));")
    L.append("commit;")
    sortie.write_text("\n".join(L) + "\n", encoding="utf-8")

    from collections import Counter
    print(f"{len(LIEUX)} emplacements, {len(ARTICLES)} articles, {nb_ev} achats historiques")
    print(Counter((a['domaine'], a['categorie']) for a in ARTICLES))
    print("à vérifier :", sum(a["a_verifier"] for a in ARTICLES))
    noms = Counter((a["nom"], a["conditionnement"]) for a in ARTICLES)
    print("doublons :", [k for k, v in noms.items() if v > 1])


if __name__ == "__main__":
    main()
