-- Correctif du 01/11/2026 : « Responsable » des anciens achats (feuilles Budget_2022 à 2026),
-- à la place de « Budget labo » dans l'historique des articles.
-- À coller une fois dans Supabase > SQL Editor > Run. Ne touche qu'aux lignes d'historique listées.
begin;
update labo_evenements set par = 'Laureline' where id = 3 and par = 'Budget labo';  -- 2026 · Acide chlorhydrique 23 %
update labo_evenements set par = 'Laureline' where id = 13 and par = 'Budget labo';  -- 2022 · Soude caustique (qualité ménagère)
update labo_evenements set par = 'Laureline' where id = 21 and par = 'Budget labo';  -- 2026 · Chlorure de calcium anhydre
update labo_evenements set par = 'Laureline' where id = 31 and par = 'Budget labo';  -- 2022 · Iodure de potassium
update labo_evenements set par = 'Laureline' where id = 37 and par = 'Budget labo';  -- 2026 · Peroxodisulfate de potassium (persulfate)
update labo_evenements set par = 'Laureline' where id = 39 and par = 'Budget labo';  -- 2026 · Hexacyanoferrate(II) de potassium trihydraté
update labo_evenements set par = 'Laureline' where id = 47 and par = 'Budget labo';  -- 2022 · Sulfite de sodium anhydre
update labo_evenements set par = 'Laureline' where id = 49 and par = 'Budget labo';  -- 2026 · Thiosulfate de sodium anhydre
update labo_evenements set par = 'Laureline' where id = 52 and par = 'Budget labo';  -- 2026 · Alginate de sodium
update labo_evenements set par = 'Laureline' where id = 72 and par = 'Budget labo';  -- 2023 · Alcool à brûler
update labo_evenements set par = 'Laureline' where id = 73 and par = 'Budget labo';  -- 2024 · Alcool à brûler
update labo_evenements set par = 'Laureline' where id = 82 and par = 'Budget labo';  -- 2022 · Éthanol absolu dénaturé
update labo_evenements set par = 'Laureline' where id = 97 and par = 'Budget labo';  -- 2022 · Silicate de sodium, solution (jardin chimique)
update labo_evenements set par = 'Laureline' where id = 100 and par = 'Budget labo';  -- 2026 · Empois d'amidon
update labo_evenements set par = 'Laureline' where id = 105 and par = 'Budget labo';  -- 2026 · Billes de polyacrylamide (hydrogel)
update labo_evenements set par = 'Laureline' where id = 107 and par = 'Budget labo';  -- 2022 · Eau déminéralisée
update labo_evenements set par = 'Laureline' where id = 109 and par = 'Budget labo';  -- 2024 · Eau déminéralisée
update labo_evenements set par = 'Mélanie' where id = 110 and par = 'Budget labo';  -- 2025 · Eau déminéralisée
update labo_evenements set par = 'Mélanie' where id = 111 and par = 'Budget labo';  -- 2026 · Eau déminéralisée
update labo_evenements set par = 'Laureline' where id = 114 and par = 'Budget labo';  -- 2023 · Gants en latex, taille M
update labo_evenements set par = 'Laureline' where id = 115 and par = 'Budget labo';  -- 2024 · Gants en latex, taille M
update labo_evenements set par = 'Laureline' where id = 116 and par = 'Budget labo';  -- 2025 · Gants en latex, taille M
update labo_evenements set par = 'Laureline' where id = 117 and par = 'Budget labo';  -- 2026 · Gants en latex, taille M
update labo_evenements set par = 'Laureline' where id = 119 and par = 'Budget labo';  -- 2022 · Pipettes Pasteur en plastique
update labo_evenements set par = 'Laureline' where id = 121 and par = 'Budget labo';  -- 2022 · Papier pH (rouleaux)
update labo_evenements set par = 'Laureline' where id = 125 and par = 'Budget labo';  -- 2022 · Papier essuie-tout (Tork)
update labo_evenements set par = 'Laureline' where id = 128 and par = 'Budget labo';  -- 2023 · Taille-crayons en magnésium
update labo_evenements set par = 'Laureline' where id = 132 and par = 'Budget labo';  -- 2023 · Burette avec robinet
update labo_evenements set par = 'Laureline' where id = 133 and par = 'Budget labo';  -- 2024 · Burette avec robinet
update labo_evenements set par = 'Laureline' where id = 143 and par = 'Budget labo';  -- 2024 · Bécher
update labo_evenements set par = 'Laureline' where id = 146 and par = 'Budget labo';  -- 2024 · Bécher
update labo_evenements set par = 'Laureline' where id = 148 and par = 'Budget labo';  -- 2024 · Bécher
update labo_evenements set par = 'Laureline' where id = 152 and par = 'Budget labo';  -- 2024 · Erlenmeyer
update labo_evenements set par = 'Laureline' where id = 157 and par = 'Budget labo';  -- 2022 · Fiole jaugée
update labo_evenements set par = 'Laureline' where id = 162 and par = 'Budget labo';  -- 2026 · Tube à essai
update labo_evenements set par = 'Laureline' where id = 165 and par = 'Budget labo';  -- 2024 · Entonnoir en verre
update labo_evenements set par = 'Laureline' where id = 181 and par = 'Budget labo';  -- 2022 · Ampoule à décanter
update labo_evenements set par = 'Laureline' where id = 183 and par = 'Budget labo';  -- 2023 · Flacon de stockage
update labo_evenements set par = 'Laureline' where id = 193 and par = 'Budget labo';  -- 2022 · Poire à pipeter
update labo_evenements set par = 'Laureline' where id = 195 and par = 'Budget labo';  -- 2023 · Support rotatif pour pipettes
update labo_evenements set par = 'Laureline' where id = 213 and par = 'Budget labo';  -- 2022 · Pince trois doigts avec noix
update labo_evenements set par = 'Laureline' where id = 214 and par = 'Budget labo';  -- 2023 · Pince trois doigts avec noix
update labo_evenements set par = 'Amandine' where id = 232 and par = 'Budget labo';  -- 2022 · Électrolyseur en U
update labo_evenements set par = 'Amandine' where id = 234 and par = 'Budget labo';  -- 2022 · Bloc secteur universel 3-12 V
update labo_evenements set par = 'Amandine' where id = 236 and par = 'Budget labo';  -- 2022 · Cordon jack femelle / 2 fiches bananes
update labo_evenements set par = 'Amandine' where id = 238 and par = 'Budget labo';  -- 2022 · Câble jack mâle/mâle
update labo_evenements set par = 'Laureline' where id = 240 and par = 'Budget labo';  -- 2024 · Bidon de récupération 10 L
update labo_evenements set par = 'Laureline' where id = 242 and par = 'Budget labo';  -- 2023 · Boîte de rangement pour jeux de cartes
update labo_evenements set par = 'Laureline' where id = 243 and par = 'Budget labo';  -- 2024 · Boîte de rangement pour jeux de cartes
update labo_evenements set par = 'Laureline' where id = 245 and par = 'Budget labo';  -- 2025 · Armoire à roulettes
update labo_evenements set par = 'Laureline' where id = 247 and par = 'Budget labo';  -- 2026 · Kit de gaz nobles lumineux
update labo_evenements set par = 'Valentine/Louise' where id = 250 and par = 'Budget labo';  -- 2024 · Liqueur de Fehling B
update labo_evenements set par = 'Amandine' where id = 260 and par = 'Budget labo';  -- 2023 · Lames de bistouri
update labo_evenements set par = 'Louise' where id = 262 and par = 'Budget labo';  -- 2025 · Kit d'identification des molécules du vivant
update labo_evenements set par = 'Valentine' where id = 264 and par = 'Budget labo';  -- 2022 · Kit de détermination des groupes sanguins
update labo_evenements set par = 'Valentine' where id = 269 and par = 'Budget labo';  -- 2022 · Microscope optique
update labo_evenements set par = 'Valentine' where id = 271 and par = 'Budget labo';  -- 2023 · Set de 5 pinces
update labo_evenements set par = 'Amandine' where id = 273 and par = 'Budget labo';  -- 2024 · Appareil de Berlèse (élève)
update labo_evenements set par = 'Amandine' where id = 274 and par = 'Budget labo';  -- 2025 · Appareil de Berlèse (élève)
update labo_evenements set par = 'Louise' where id = 276 and par = 'Budget labo';  -- 2026 · Collection de préparations microscopiques (groupes sanguins)
update labo_evenements set par = 'Amandine' where id = 278 and par = 'Budget labo';  -- 2026 · Préparation microscopique (cellules buccales humaines)
update labo_evenements set par = 'Amandine' where id = 280 and par = 'Budget labo';  -- 2026 · Préparation microscopique (oignon : épiderme, stomates)
update labo_evenements set par = 'Louise' where id = 282 and par = 'Budget labo';  -- 2026 · Épi de maïs (génétique)
update labo_evenements set par = 'Amandine' where id = 311 and par = 'Budget labo';  -- 2023 · Cordon à pinces crocodiles
update labo_evenements set par = 'Mélanie' where id = 313 and par = 'Budget labo';  -- 2022 · Ampoule E10 (culot à vis)
update labo_evenements set par = 'Amandine' where id = 314 and par = 'Budget labo';  -- 2023 · Ampoule E10 (culot à vis)
update labo_evenements set par = 'Amandine' where id = 315 and par = 'Budget labo';  -- 2024 · Ampoule E10 (culot à vis)
update labo_evenements set par = 'Amandine' where id = 316 and par = 'Budget labo';  -- 2025 · Ampoule E10 (culot à vis)
update labo_evenements set par = 'Amandine/Mélanie' where id = 317 and par = 'Budget labo';  -- 2026 · Ampoule E10 (culot à vis)
update labo_evenements set par = 'Mélanie' where id = 319 and par = 'Budget labo';  -- 2022 · Douille E10 sur socle
update labo_evenements set par = 'Amandine' where id = 320 and par = 'Budget labo';  -- 2023 · Douille E10 sur socle
update labo_evenements set par = 'Amandine' where id = 322 and par = 'Budget labo';  -- 2023 · Pile alcaline 4,5 V
update labo_evenements set par = 'Mélanie' where id = 324 and par = 'Budget labo';  -- 2022 · Kit d'électrostatique
update labo_evenements set par = 'Mélanie' where id = 326 and par = 'Budget labo';  -- 2022 · Électroscope à aiguille
update labo_evenements set par = 'Manon' where id = 328 and par = 'Budget labo';  -- 2023 · Rails de Laplace avec aimant en U
update labo_evenements set par = 'Manon' where id = 330 and par = 'Budget labo';  -- 2023 · Paire de diapasons 440 Hz avec caisses de résonance
update labo_evenements set par = 'Manon' where id = 332 and par = 'Budget labo';  -- 2023 · Solénoïde (champ magnétique)
update labo_evenements set par = 'Amandine' where id = 334 and par = 'Budget labo';  -- 2023 · Éprouvette graduée en polypropylène
update labo_evenements set par = 'Amandine' where id = 336 and par = 'Budget labo';  -- 2023 · Bécher forme basse en polypropylène
update labo_evenements set par = 'Amandine' where id = 338 and par = 'Budget labo';  -- 2023 · Balance de cuisine
update labo_evenements set par = 'Manon' where id = 340 and par = 'Budget labo';  -- 2024 · Cuve rhéographique
update labo_evenements set par = 'Manon' where id = 342 and par = 'Budget labo';  -- 2024 · Plaque de visualisation du champ magnétique
update labo_evenements set par = 'Manon' where id = 344 and par = 'Budget labo';  -- 2024 · Aimant néodyme (disque)
update labo_evenements set par = 'Manon' where id = 345 and par = 'Budget labo';  -- 2026 · Aimant néodyme (disque)
update labo_evenements set par = 'Amandine/Mélanie' where id = 347 and par = 'Budget labo';  -- 2024 · Bateau pop-pop
update labo_evenements set par = 'Manon' where id = 349 and par = 'Budget labo';  -- 2025 · Modèle expérimental effet Doppler
update labo_evenements set par = 'Manon' where id = 353 and par = 'Budget labo';  -- 2026 · Ensemble électromagnétisme
update labo_evenements set par = 'Manon' where id = 355 and par = 'Budget labo';  -- 2026 · Accessoire galvanomètre
update labo_evenements set par = 'Laureline' where id = 357 and par = 'Budget labo';  -- 2026 · Fibre optique (5 m)
update labo_evenements set par = 'Laureline' where id = 359 and par = 'Budget labo';  -- 2026 · Pointeur laser
commit;
