import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

// =====================================================================
// Libellés
// =====================================================================
const DOMAINES = { chimie: 'Chimie', biologie: 'Biologie', physique: 'Physique', commun: 'Commun' };
const CATEGORIES = { produit: 'Produits chimiques', consommable: 'Consommables', verrerie: 'Verrerie', materiel: 'Matériel' };
const ETATS = { ok: 'OK', presque_vide: 'Presque vide', vide: 'Vide', introuvable: 'Introuvable' };
const EVENEMENTS = {
  ok: 'Remis à OK', presque_vide: 'Signalé presque vide', vide: 'Signalé vide', introuvable: 'Signalé introuvable',
  casse: 'Casse ou perte', comptage: 'Vérifié / recompté', commande: 'Commandé', annule: 'Commande annulée',
  recu: 'Reçu', creation: 'Ajouté', modification: 'Modifié', retrait: 'Retiré', import: 'Inventaire de départ',
};
const ORDRE_DOMAINES = ['chimie', 'biologie', 'physique', 'commun'];
const ORDRE_CATEGORIES = ['produit', 'consommable', 'verrerie', 'materiel'];

// =====================================================================
// Accès à la base (API REST de Supabase, sans bibliothèque)
// =====================================================================
async function api(chemin, options = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${chemin}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.message || `Erreur ${r.status}`);
  }
  return r.status === 204 ? null : r.json();
}
const rpc = (fonction, args) => api(`rpc/${fonction}`, { method: 'POST', body: JSON.stringify(args) });

// =====================================================================
// État de l'app
// =====================================================================
const S = {
  lieux: [],
  articles: [],
  demandes: [],
  code: lireStockage('labo_code'),
  role: lireStockage('labo_role'),
  tournee: false,
  filtres: { domaine: '', categorie: '', etat: '', texte: '' },
};

function lireStockage(cle) { try { return localStorage.getItem(cle) || ''; } catch { return ''; } }
function ecrireStockage(cle, v) { try { v ? localStorage.setItem(cle, v) : localStorage.removeItem(cle); } catch { /* navigation privée */ } }

async function chargerTout() {
  const [lieux, articles, demandes] = await Promise.all([
    api('labo_lieux?select=*&order=ordre,nom'),
    api('labo_articles?select=*&actif=eq.true&order=nom,conditionnement'),
    api('labo_demandes?select=*&order=cree_le.desc'),
  ]);
  S.lieux = lieux; S.articles = articles; S.demandes = demandes;
}

// =====================================================================
// Outils
// =====================================================================
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const INDICES = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };
const normaliser = (s) => String(s ?? '').replace(/[₀-₉]/g, (c) => INDICES[c]).normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/[·()[\]]/g, '').toLowerCase();
const euros = (n) => (n == null || isNaN(n)) ? '' : Number(n).toLocaleString('fr-BE', { style: 'currency', currency: 'EUR' });
const dateCourte = (d) => d ? new Date(d).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const lieu = (id) => S.lieux.find((l) => l.id === id);
const article = (id) => S.articles.find((a) => a.id === Number(id));
const estAdmin = () => S.role === 'admin';

function toast(message) {
  const t = document.getElementById('toast');
  t.textContent = message; t.classList.add('visible');
  clearTimeout(toast.minuteur);
  toast.minuteur = setTimeout(() => t.classList.remove('visible'), 2600);
}

function nomComplet(a) {
  return `${esc(a.nom)}${a.conditionnement ? ` <span class="formule">· ${esc(a.conditionnement)}</span>` : ''}`;
}

function texteRecherche(a) {
  const l = lieu(a.lieu_id);
  return normaliser([a.nom, a.formule, a.conditionnement, a.remarque, l?.nom, l?.salle].join(' '));
}

// Faut-il racheter cet article ? Renvoie { raison, quantite } ou null.
function besoin(a) {
  if (!a.actif) return null;
  if (a.suivi === 'nombre' && a.seuil != null && a.quantite != null && a.quantite < a.seuil) {
    return { raison: `Plus que ${a.quantite} sur ${a.cible ?? a.seuil}`, quantite: Math.max((a.cible ?? a.seuil) - a.quantite, 1) };
  }
  if (a.etat === 'vide') return { raison: 'Vide', quantite: 1 };
  if (a.etat === 'presque_vide') return { raison: 'Presque vide', quantite: 1 };
  if (a.etat === 'introuvable') return { raison: 'Introuvable', quantite: 1 };
  return null;
}

function pastilles(a) {
  const p = [];
  if (a.commande_le) p.push('<span class="pastille p-commande">Commandé</span>');
  if (a.suivi === 'nombre') {
    const b = besoin(a);
    p.push(`<span class="pastille ${b ? 'p-vide' : 'p-ok'}">${a.quantite ?? '?'}${a.cible != null ? ` / ${a.cible}` : ''}</span>`);
  } else {
    p.push(`<span class="pastille p-${a.etat}">${ETATS[a.etat]}</span>`);
  }
  if (a.a_verifier) p.push('<span class="pastille p-verifier">à vérifier</span>');
  return p.join(' ');
}

function ligneArticle(a, { avecLieu = true } = {}) {
  const l = lieu(a.lieu_id);
  const ou = avecLieu && l ? `${esc(l.salle)} · ${esc(l.nom)}${a.precision_lieu ? ` · ${esc(a.precision_lieu)}` : ''}`
    : (a.precision_lieu ? esc(a.precision_lieu) : '');
  return `<a class="ligne" href="#/article/${a.id}">
    <div class="corps"><div class="nom">${nomComplet(a)}</div>
      <div class="detail">${[a.formule ? esc(a.formule) : '', ou].filter(Boolean).join(' · ')}</div></div>
    <div class="droite">${pastilles(a)}</div></a>`;
}

function majCompteurCommandes() {
  const n = S.articles.filter((a) => besoin(a) && !a.commande_le).length
    + S.demandes.filter((d) => d.statut === 'a_commander').length;
  const b = document.getElementById('compteur-commandes');
  b.textContent = n; b.hidden = n === 0;
  const r = document.getElementById('compteur-ranger');
  r.textContent = S.articles.filter((a) => a.lieu_id === 'xx').length; r.hidden = r.textContent === '0';
  document.getElementById('onglet-admin').hidden = !estAdmin();
  document.getElementById('bouton-code').textContent = S.role ? (estAdmin() ? '🔓 Admin' : '🔓 Prof') : '🔑 Code';
}

// =====================================================================
// Code d'accès
// =====================================================================
function dialogue(html, { surValider } = {}) {
  const d = document.getElementById('dialogue');
  const f = document.getElementById('dialogue-contenu');
  f.innerHTML = html;
  d.showModal();
  return new Promise((resolve) => {
    f.onsubmit = async (ev) => {
      const bouton = ev.submitter;
      if (bouton?.value === 'annuler') { d.close(); resolve(null); return; }
      ev.preventDefault();
      const donnees = Object.fromEntries(new FormData(f).entries());
      f.querySelectorAll('input[type=checkbox]').forEach((c) => { donnees[c.name] = c.checked; });
      if (!surValider) { d.close(); resolve(donnees); return; }
      const err = f.querySelector('.erreur');
      try {
        if (bouton) bouton.disabled = true;
        const r = await surValider(donnees, bouton?.value);
        d.close(); resolve(r ?? donnees);
      } catch (e) {
        if (err) err.textContent = e.message; else alert(e.message);
      } finally { if (bouton) bouton.disabled = false; }
    };
    d.onclose = () => resolve(null);
  });
}

async function demanderCode() {
  return dialogue(`
    <h3>Code des profs de sciences</h3>
    <p class="sous">Demandé une seule fois sur cet appareil.</p>
    <label class="champ"><span>Code</span><input name="code" autocomplete="off" autocapitalize="off" required autofocus></label>
    <p class="erreur"></p>
    <div class="actions">
      <button class="btn principal" value="ok">Valider</button>
      <button class="btn" value="annuler" formnovalidate>Annuler</button>
      ${S.role ? '<button class="btn" value="oublier" formnovalidate>Se déconnecter</button>' : ''}
    </div>`, {
    surValider: async ({ code }, action) => {
      if (action === 'oublier') { S.code = ''; S.role = ''; }
      else {
        const role = await rpc('labo_role', { p_code: code.trim() });
        if (!role) throw new Error('Code incorrect.');
        S.code = code.trim(); S.role = role;
        toast(role === 'admin' ? 'Bienvenue, mode administratrice.' : 'Merci, c\'est enregistré.');
      }
      ecrireStockage('labo_code', S.code); ecrireStockage('labo_role', S.role);
      majCompteurCommandes(); route();
      return true;
    },
  });
}

// Toute écriture passe par ici : demande le code si besoin, met l'article à jour localement.
async function ecrire(fonction, args) {
  if (!S.code) { const ok = await demanderCode(); if (!ok || !S.code) return null; }
  try {
    return await rpc(fonction, { p_code: S.code, ...args });
  } catch (e) {
    if (/Code incorrect/.test(e.message)) { S.code = ''; S.role = ''; ecrireStockage('labo_code', ''); ecrireStockage('labo_role', ''); majCompteurCommandes(); }
    toast(e.message); throw e;
  }
}

function remplacerArticle(a) {
  const i = S.articles.findIndex((x) => x.id === a.id);
  if (!a.actif) { if (i >= 0) S.articles.splice(i, 1); }
  else if (i >= 0) S.articles[i] = a; else S.articles.push(a);
  majCompteurCommandes();
}
function remplacerDemande(d) {
  const i = S.demandes.findIndex((x) => x.id === d.id);
  if (i >= 0) S.demandes[i] = d; else S.demandes.unshift(d);
  majCompteurCommandes();
}

async function signaler(id, type, quantite = null) {
  const a = await ecrire('labo_signaler', { p_article: Number(id), p_type: type, p_quantite: quantite });
  if (!a) return;
  remplacerArticle(a);
  const b = besoin(a);
  toast(b && !a.commande_le ? 'Merci ! Ajouté à la liste « À commander ».' : 'Merci, c\'est noté.');
  route({ garderScroll: true });
}

// =====================================================================
// Écrans
// =====================================================================
const app = () => document.getElementById('app');

function ecranLabo() {
  const q = S.filtres.texte;
  let html = `<h1>Que cherches-tu ?</h1>
    <input class="recherche" id="recherche" type="search" placeholder="Nom, formule (CuSO4)…, verrerie" value="${esc(q)}" autocomplete="off">`;
  if (q.trim()) {
    const mots = normaliser(q).split(/\s+/).filter(Boolean);
    const res = S.articles.filter((a) => { const t = texteRecherche(a); return mots.every((m) => t.includes(m)); });
    html += `<h2>${res.length} résultat${res.length > 1 ? 's' : ''}</h2>`;
    html += res.length ? `<div class="liste">${res.slice(0, 80).map((a) => ligneArticle(a)).join('')}</div>`
      : `<p class="vide-liste">Rien trouvé. <a href="#/ajouter">Ajouter un article</a> ou <a href="#/commandes">proposer un achat</a>.</p>`;
  } else {
    html += '<p class="sous" style="margin-top:10px">… ou scanne le QR code d\'une armoire, ou choisis un emplacement :</p>';
    const salles = [...new Set(S.lieux.map((l) => l.salle))];
    for (const salle of salles) {
      html += `<h2>${esc(salle)}</h2><div class="grille">`;
      for (const l of S.lieux.filter((x) => x.salle === salle)) {
        const arts = S.articles.filter((a) => a.lieu_id === l.id);
        const alertes = arts.filter((a) => besoin(a)).length;
        html += `<a class="carte" href="#/lieu/${esc(l.id)}"><div class="nom">${esc(l.nom)}</div>
          <div class="petit">${arts.length} article${arts.length > 1 ? 's' : ''}${alertes ? ` · <span class="pastille p-vide">${alertes} à racheter</span>` : ''}</div></a>`;
      }
      html += '</div>';
    }
  }
  app().innerHTML = html;
  const champ = document.getElementById('recherche');
  champ.addEventListener('input', () => {
    S.filtres.texte = champ.value;
    const pos = champ.selectionStart;
    ecranLabo();
    const c = document.getElementById('recherche'); c.focus(); c.setSelectionRange(pos, pos);
  });
}

function ecranLieu(id) {
  const l = lieu(id);
  if (!l) { app().innerHTML = '<p class="vide-liste">Emplacement inconnu.</p>'; return; }
  const arts = S.articles.filter((a) => a.lieu_id === id);
  const groupes = {};
  for (const a of arts) (groupes[a.precision_lieu || ''] ??= []).push(a);
  const cles = Object.keys(groupes).sort((x, y) => x.localeCompare(y, 'fr', { numeric: true }));
  let html = `<a class="retour" href="#/">← Tous les emplacements</a>
    <h1>${esc(l.nom)}</h1><p class="sous">${esc(l.salle)}${l.details ? ` · ${esc(l.details)}` : ''}</p>
    <div class="actions">
      <button class="btn ${S.tournee ? 'principal' : ''}" data-action="tournee">${S.tournee ? '✓ Terminer la tournée' : '📝 Tournée d\'inventaire'}</button>
      <a class="btn" href="#/ajouter/${esc(l.id)}">＋ Ajouter un article ici</a>
    </div>`;
  if (S.tournee) html += '<p class="info">Mode tournée : vérifie chaque article sur place. Un clic suffit, c\'est enregistré tout de suite.</p>';
  if (!arts.length) html += '<p class="vide-liste">Aucun article enregistré ici.</p>';
  for (const k of cles) {
    if (k) html += `<h3>${esc(k)}</h3>`;
    html += '<div class="liste">';
    for (const a of groupes[k]) html += S.tournee ? ligneTournee(a) : ligneArticle(a, { avecLieu: false });
    html += '</div>';
  }
  app().innerHTML = html;
}

function ligneTournee(a) {
  const controles = a.suivi === 'nombre'
    ? `<input type="number" min="0" inputmode="numeric" value="${a.quantite ?? ''}" data-quantite="${a.id}" aria-label="Quantité">
       <button class="btn petit principal" data-action="compter" data-id="${a.id}">✓ C'est le bon nombre</button>`
    : `<button class="btn petit" data-action="signaler" data-type="comptage" data-id="${a.id}">✓ Présent</button>
       <button class="btn petit" data-action="signaler" data-type="presque_vide" data-id="${a.id}">Presque vide</button>
       <button class="btn petit" data-action="signaler" data-type="vide" data-id="${a.id}">Vide</button>
       <button class="btn petit" data-action="signaler" data-type="introuvable" data-id="${a.id}">Introuvable</button>`;
  return `<div class="ligne colonne"><div style="display:flex;gap:10px;align-items:center">
      <a class="corps nom" href="#/article/${a.id}" style="text-decoration:none;color:inherit">${nomComplet(a)}</a>
      <div class="droite">${pastilles(a)}</div></div>
    <div class="tournee">${controles}</div></div>`;
}

async function ecranArticle(id) {
  const a = article(id);
  if (!a) { app().innerHTML = '<p class="vide-liste">Article introuvable (peut-être retiré de l\'inventaire).</p>'; return; }
  const l = lieu(a.lieu_id);
  const b = besoin(a);
  let html = `<a class="retour" href="${l ? `#/lieu/${esc(l.id)}` : '#/'}">← ${l ? esc(l.nom) : 'Retour'}</a>
    <h1>${esc(a.nom)}</h1>
    <p class="sous">${[a.formule, a.conditionnement].filter(Boolean).map(esc).join(' · ')}<br>
      📍 ${l ? `${esc(l.salle)} · ${esc(l.nom)}` : 'Emplacement à préciser'}${a.precision_lieu ? ` · ${esc(a.precision_lieu)}` : ''}</p>
    <div>${pastilles(a)}</div>`;

  if (a.suivi === 'etat') {
    html += '<div class="etats">' + Object.entries(ETATS).map(([k, v]) =>
      `<button type="button" data-action="signaler" data-type="${k}" data-id="${a.id}" class="${a.etat === k ? 'courant' : ''}">${v}</button>`).join('') + '</div>';
  } else {
    html += `<div class="bloc"><div class="grand-nombre">${a.quantite ?? '?'} <span class="formule" style="font-size:1rem">en stock · normal ${a.cible ?? '?'} · racheter sous ${a.seuil ?? '?'}</span></div>
      <h3>Casse ou perte</h3>
      <div class="compteur"><button type="button" data-action="moins">−</button><input id="nb-casse" type="number" min="1" value="1" inputmode="numeric"><button type="button" data-action="plus">＋</button>
        <button class="btn principal" data-action="casse" data-id="${a.id}">Signaler</button></div>
      <h3>Recompter</h3>
      <div class="compteur"><input id="nb-compte" type="number" min="0" value="${a.quantite ?? ''}" inputmode="numeric">
        <button class="btn" data-action="recompter" data-id="${a.id}">Enregistrer le nombre réel</button></div></div>`;
  }

  if (a.commande_le) {
    html += `<div class="info">🛒 Commandé le ${dateCourte(a.commande_le)}.
      <div class="actions"><button class="btn principal" data-action="recu-article" data-id="${a.id}">📦 C'est arrivé</button>
      <button class="btn" data-action="annuler-commande" data-id="${a.id}">Annuler la commande</button></div></div>`;
  } else if (b) {
    html += `<div class="info">Sur la liste « À commander » (${esc(b.raison)}).
      <div class="actions"><button class="btn" data-action="commander-article" data-id="${a.id}">🛒 Je l'ai commandé</button></div></div>`;
  }

  const infos = [];
  if (a.fournisseur) infos.push(`Fournisseur : ${esc(a.fournisseur)}`);
  if (a.prix != null) infos.push(`Dernier prix : ${euros(a.prix)}`);
  if (a.lien) infos.push(`<a href="${esc(a.lien)}" target="_blank" rel="noopener">Page du produit ↗</a>`);
  if (a.remarque) infos.push(esc(a.remarque));
  if (infos.length) html += `<div class="bloc">${infos.join('<br>')}</div>`;

  html += `<div class="actions"><a class="btn" href="#/modifier/${a.id}">✏️ Modifier</a>
    ${estAdmin() ? `<button class="btn" data-action="retirer" data-id="${a.id}">🗑️ Retirer de l'inventaire</button>` : ''}</div>
    <h2>Historique</h2><div class="liste historique" id="historique"><p class="chargement">…</p></div>`;
  app().innerHTML = html;

  try {
    const ev = await api(`labo_evenements?select=*&article_id=eq.${a.id}&order=cree_le.desc&limit=30`);
    const h = document.getElementById('historique');
    if (h) h.innerHTML = ev.length ? ev.map((e) => `<div class="ligne"><div class="corps">${esc(EVENEMENTS[e.type] || e.type)}${e.quantite != null ? ` (${e.quantite})` : ''}
      ${e.note ? `<div class="detail">${esc(e.note)}</div>` : ''}</div><div class="droite detail">${dateCourte(e.cree_le)}</div></div>`).join('')
      : '<p class="vide-liste">Rien pour l\'instant.</p>';
  } catch { /* l'historique n'est pas indispensable */ }
}

// ---------- Formulaire article (ajout / modification) ----------
function ecranFormulaire(id, lieuParDefaut, prerempli = {}) {
  const a = id ? article(id) : { domaine: 'chimie', categorie: 'produit', suivi: 'etat', lieu_id: lieuParDefaut || '', ...prerempli };
  if (id && !a) { app().innerHTML = '<p class="vide-liste">Article introuvable.</p>'; return; }
  const opt = (obj, val) => Object.entries(obj).map(([k, v]) => `<option value="${k}" ${k === val ? 'selected' : ''}>${esc(v)}</option>`).join('');
  const optLieux = '<option value="">— à préciser —</option>' + S.lieux.map((l) =>
    `<option value="${esc(l.id)}" ${l.id === a.lieu_id ? 'selected' : ''}>${esc(l.salle)} · ${esc(l.nom)}</option>`).join('');
  app().innerHTML = `<a class="retour" href="${id ? `#/article/${id}` : '#/'}">← Annuler</a>
    <h1>${id ? 'Modifier' : 'Ajouter un article'}</h1>
    <form id="form-article" class="bloc">
      <label class="champ"><span>Nom *</span><input name="nom" required value="${esc(a.nom)}"></label>
      <div class="deux">
        <label class="champ"><span>Formule</span><input name="formule" value="${esc(a.formule)}" placeholder="CuSO4"></label>
        <label class="champ"><span>Contenance / conditionnement</span><input name="conditionnement" value="${esc(a.conditionnement)}" placeholder="500 g, 250 mL…"></label>
      </div>
      <div class="deux">
        <label class="champ"><span>Domaine</span><select name="domaine">${opt(DOMAINES, a.domaine)}</select></label>
        <label class="champ"><span>Catégorie</span><select name="categorie" id="f-categorie">${opt(CATEGORIES, a.categorie)}</select></label>
      </div>
      <label class="champ"><span>Comment le suivre ?</span><select name="suivi" id="f-suivi">
        <option value="etat" ${a.suivi === 'etat' ? 'selected' : ''}>Par état (OK / presque vide / vide) : produits, consommables</option>
        <option value="nombre" ${a.suivi === 'nombre' ? 'selected' : ''}>En comptant les pièces : verrerie, matériel</option></select></label>
      <div class="deux" id="f-nombres" ${a.suivi === 'nombre' ? '' : 'hidden'}>
        <label class="champ"><span>Quantité actuelle</span><input name="quantite" type="number" min="0" value="${a.quantite ?? ''}"></label>
        <label class="champ"><span>Quantité normale</span><input name="cible" type="number" min="0" value="${a.cible ?? ''}"></label>
        <label class="champ"><span>Racheter sous (vide = automatique)</span><input name="seuil" type="number" min="0" value="${a.seuil ?? ''}"></label>
      </div>
      <label class="champ"><span>Emplacement</span><select name="lieu_id">${optLieux}</select></label>
      <label class="champ"><span>Précision (étage, tiroir, planche…)</span><input name="precision_lieu" value="${esc(a.precision_lieu)}"></label>
      <div class="deux">
        <label class="champ"><span>Fournisseur</span><input name="fournisseur" value="${esc(a.fournisseur)}" placeholder="Sordalab, Conatex…"></label>
        <label class="champ"><span>Prix (€)</span><input name="prix" type="number" step="0.01" min="0" value="${a.prix ?? ''}"></label>
      </div>
      <label class="champ"><span>Lien vers le produit</span><input name="lien" type="url" value="${esc(a.lien)}"></label>
      <label class="champ"><span>Remarque</span><textarea name="remarque" rows="2">${esc(a.remarque)}</textarea></label>
      ${id ? `<label class="case"><input type="checkbox" name="a_verifier" ${a.a_verifier ? 'checked' : ''}> À vérifier sur place</label>` : ''}
      <p class="erreur" id="f-erreur"></p>
      <button class="btn principal">Enregistrer</button>
    </form>`;
  const suivi = document.getElementById('f-suivi');
  const cat = document.getElementById('f-categorie');
  const majSuivi = () => { document.getElementById('f-nombres').hidden = suivi.value !== 'nombre'; };
  suivi.addEventListener('change', majSuivi);
  if (!id) cat.addEventListener('change', () => { suivi.value = ['verrerie', 'materiel'].includes(cat.value) ? 'nombre' : 'etat'; majSuivi(); });

  document.getElementById('form-article').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const f = ev.target;
    const d = Object.fromEntries(new FormData(f).entries());
    if (id) d.a_verifier = f.querySelector('[name=a_verifier]').checked;
    for (const k of ['quantite', 'cible', 'seuil', 'prix']) d[k] = d[k] === '' ? null : Number(d[k]);
    if (d.suivi === 'nombre') {
      if (d.cible == null) d.cible = d.quantite;
      if (d.seuil == null && d.cible != null) d.seuil = d.cible <= 3 ? d.cible : Math.max(1, Math.round(d.cible * 0.75));
    }
    try {
      const r = await ecrire('labo_article_enregistrer', { p_id: id ? Number(id) : null, p_data: d });
      if (!r) return;
      remplacerArticle(r);
      if (prerempli.demande) {
        const dm = await ecrire('labo_demande', { p_action: 'recu', p_id: prerempli.demande, p_data: { article_id: r.id } });
        if (dm) remplacerDemande(dm);
      }
      toast('Enregistré.');
      location.hash = `#/article/${r.id}`;
    } catch (e) { document.getElementById('f-erreur').textContent = e.message; }
  });
}

// ---------- À commander ----------
function listeACommander() {
  return S.articles.filter((a) => besoin(a) && !a.commande_le).map((a) => ({ a, b: besoin(a) }));
}

function ecranCommandes() {
  const renouv = listeACommander();
  const nouveautes = S.demandes.filter((d) => d.statut === 'a_commander');
  const enCommandeA = S.articles.filter((a) => a.commande_le);
  const enCommandeD = S.demandes.filter((d) => d.statut === 'commande');
  const total = renouv.reduce((s, { a, b }) => s + (a.prix ?? 0) * b.quantite, 0)
    + nouveautes.reduce((s, d) => s + (d.prix ?? 0) * d.quantite, 0);

  let html = `<h1>À commander</h1>
    <p class="sous">Se remplit tout seul quand quelque chose est signalé vide, presque vide ou cassé.</p>
    <div class="actions"><button class="btn principal" data-action="nouvelle-demande">＋ Proposer un nouvel achat</button>
    ${estAdmin() ? '<a class="btn" href="#/admin">📄 Générer la commande annuelle</a>' : ''}</div>
    <p class="total">Estimation : ${euros(total)} <span class="formule" style="font-size:.85rem">(d'après les derniers prix connus)</span></p>`;

  html += '<h2>À renouveler</h2>';
  if (!renouv.length) html += '<p class="vide-liste">Rien à renouveler pour l\'instant 🎉</p>';
  for (const dom of ORDRE_DOMAINES) {
    const items = renouv.filter(({ a }) => a.domaine === dom);
    if (!items.length) continue;
    html += `<h3>${DOMAINES[dom]}</h3><div class="liste">`;
    items.sort((x, y) => ORDRE_CATEGORIES.indexOf(x.a.categorie) - ORDRE_CATEGORIES.indexOf(y.a.categorie) || x.a.nom.localeCompare(y.a.nom, 'fr'));
    for (const { a, b } of items) {
      html += `<div class="ligne"><a class="corps" href="#/article/${a.id}" style="text-decoration:none;color:inherit">
          <div class="nom">${nomComplet(a)}</div>
          <div class="detail"><span class="pastille ${b.raison.startsWith('Plus') ? 'p-vide' : `p-${a.etat}`}">${esc(b.raison)}</span>
            · à commander : ${b.quantite}${a.prix != null ? ` · ${euros(a.prix * b.quantite)}` : ''}${a.fournisseur ? ` · ${esc(a.fournisseur)}` : ''}</div></a>
        <div class="droite">${a.lien ? `<a class="btn petit" href="${esc(a.lien)}" target="_blank" rel="noopener">↗</a>` : ''}
          <button class="btn petit" data-action="commander-article" data-id="${a.id}">Commandé</button></div></div>`;
    }
    html += '</div>';
  }

  html += '<h2>Nouveautés proposées</h2>';
  html += nouveautes.length ? `<div class="liste">${nouveautes.map((d) => ligneDemande(d)).join('')}</div>`
    : '<p class="vide-liste">Aucune proposition. Utilise « Proposer un nouvel achat » pour ce qui n\'existe pas encore au labo.</p>';

  if (enCommandeA.length || enCommandeD.length) {
    html += '<h2>En commande · à réceptionner</h2><div class="liste">';
    for (const a of enCommandeA) {
      html += `<div class="ligne"><a class="corps" href="#/article/${a.id}" style="text-decoration:none;color:inherit"><div class="nom">${nomComplet(a)}</div>
        <div class="detail">Commandé le ${dateCourte(a.commande_le)}</div></a>
        <div class="droite"><button class="btn petit principal" data-action="recu-article" data-id="${a.id}">📦 Arrivé</button></div></div>`;
    }
    for (const d of enCommandeD) {
      html += `<div class="ligne"><div class="corps"><div class="nom">${esc(d.nom)} <span class="pastille p-commande">nouveau</span></div>
        <div class="detail">${d.quantite} · commandé le ${dateCourte(d.commande_le)}</div></div>
        <div class="droite"><button class="btn petit principal" data-action="recu-demande" data-id="${d.id}">📦 Arrivé</button></div></div>`;
    }
    html += '</div>';
  }
  app().innerHTML = html;
}

function ligneDemande(d) {
  return `<div class="ligne"><div class="corps"><div class="nom">${esc(d.nom)}</div>
    <div class="detail">${DOMAINES[d.domaine]} · ${d.quantite} pièce${d.quantite > 1 ? 's' : ''}${d.prix != null ? ` · ${euros(d.prix * d.quantite)}` : ''}${d.fournisseur ? ` · ${esc(d.fournisseur)}` : ''}${d.pour ? ` · pour ${esc(d.pour)}` : ''}</div></div>
    <div class="droite">${d.lien ? `<a class="btn petit" href="${esc(d.lien)}" target="_blank" rel="noopener">↗</a>` : ''}
      <button class="btn petit" data-action="commander-demande" data-id="${d.id}">Commandé</button>
      ${estAdmin() ? `<button class="btn petit" data-action="abandonner-demande" data-id="${d.id}" title="Abandonner">✕</button>` : ''}</div></div>`;
}

async function nouvelleDemande() {
  const opt = (obj, val) => Object.entries(obj).map(([k, v]) => `<option value="${k}" ${k === val ? 'selected' : ''}>${esc(v)}</option>`).join('');
  await dialogue(`
    <h3>Proposer un nouvel achat</h3>
    <p class="sous">Pour ce qui n'existe pas encore au labo. (Pour racheter un article existant, signale-le plutôt vide ou cassé.)</p>
    <label class="champ"><span>Quoi ? *</span><input name="nom" required placeholder="Kit d'électrolyse, chlorure d'ammonium 500 g…"></label>
    <div class="deux">
      <label class="champ"><span>Domaine</span><select name="domaine">${opt(DOMAINES, 'chimie')}</select></label>
      <label class="champ"><span>Catégorie</span><select name="categorie">${opt(CATEGORIES, 'materiel')}</select></label>
    </div>
    <div class="deux">
      <label class="champ"><span>Quantité</span><input name="quantite" type="number" min="1" value="1"></label>
      <label class="champ"><span>Prix unitaire estimé (€)</span><input name="prix" type="number" step="0.01" min="0"></label>
    </div>
    <label class="champ"><span>Fournisseur</span><input name="fournisseur" placeholder="Sordalab, Conatex, Equascience…"></label>
    <label class="champ"><span>Lien</span><input name="lien" type="url"></label>
    <label class="champ"><span>Pour quel cours / quel labo ?</span><input name="pour" placeholder="5e chimie, mission chaufferettes…"></label>
    <p class="erreur"></p>
    <div class="actions"><button class="btn principal" value="ok">Ajouter à la liste</button><button class="btn" value="annuler" formnovalidate>Annuler</button></div>`, {
    surValider: async (d) => {
      d.quantite = Number(d.quantite) || 1;
      d.prix = d.prix === '' ? null : Number(d.prix);
      const r = await ecrire('labo_demande', { p_action: 'creer', p_data: d });
      if (r) { remplacerDemande(r); toast('Ajouté à la liste.'); ecranCommandes(); }
      return r;
    },
  });
}

async function recuArticle(id) {
  const a = article(id);
  const b = besoin(a);
  const r = await dialogue(`
    <h3>📦 ${esc(a.nom)} est arrivé</h3>
    ${a.suivi === 'nombre' ? `<label class="champ"><span>Combien de pièces reçues ?</span><input name="quantite" type="number" min="0" value="${b?.quantite ?? 1}" required></label>`
      : '<p class="sous">L\'article repassera à « OK ».</p>'}
    <div class="deux">
      <label class="champ"><span>Prix payé (€, facultatif)</span><input name="prix" type="number" step="0.01" min="0" value="${a.prix ?? ''}"></label>
      <label class="champ"><span>Fournisseur</span><input name="fournisseur" value="${esc(a.fournisseur)}"></label>
    </div>
    <p class="erreur"></p>
    <div class="actions"><button class="btn principal" value="ok">Enregistrer la réception</button><button class="btn" value="annuler" formnovalidate>Annuler</button></div>`, {
    surValider: async (d) => {
      const res = await ecrire('labo_commande', {
        p_article: a.id, p_action: 'recu', p_quantite: d.quantite ? Number(d.quantite) : null,
        p_prix: d.prix === '' ? null : Number(d.prix), p_fournisseur: d.fournisseur || null,
      });
      if (res) remplacerArticle(res);
      return res;
    },
  });
  if (r) { toast('Réception enregistrée, merci !'); route(); }
}

async function recuDemande(id) {
  const d = S.demandes.find((x) => x.id === Number(id));
  const choix = await dialogue(`
    <h3>📦 ${esc(d.nom)} est arrivé</h3>
    <p class="sous">Veux-tu l'ajouter à l'inventaire, pour pouvoir le retrouver et le signaler plus tard ?</p>
    <div class="actions"><button class="btn principal" value="ajouter">Oui, l'ajouter à l'inventaire</button>
    <button class="btn" value="simple">Non, juste noter qu'il est arrivé</button>
    <button class="btn" value="annuler" formnovalidate>Annuler</button></div>`, { surValider: async (_, action) => action });
  if (choix === 'simple') {
    const r = await ecrire('labo_demande', { p_action: 'recu', p_id: d.id });
    if (r) { remplacerDemande(r); toast('Réception enregistrée.'); route(); }
  } else if (choix === 'ajouter') {
    const suivi = ['verrerie', 'materiel'].includes(d.categorie) ? 'nombre' : 'etat';
    // lu par le routeur à l'ouverture du formulaire
    S.prerempli = {
      nom: d.nom, domaine: d.domaine, categorie: d.categorie, suivi, quantite: suivi === 'nombre' ? d.quantite : null,
      cible: suivi === 'nombre' ? d.quantite : null, prix: d.prix, fournisseur: d.fournisseur, lien: d.lien, demande: d.id,
    };
    location.hash = '#/ajouter';
  }
}

// ---------- Inventaire complet ----------
function ecranInventaire() {
  const F = S.filtres;
  const opt = (obj, val, tous) => `<option value="">${tous}</option>` + Object.entries(obj).map(([k, v]) => `<option value="${k}" ${k === val ? 'selected' : ''}>${esc(v)}</option>`).join('');
  const mots = normaliser(F.texte).split(/\s+/).filter(Boolean);
  const res = S.articles.filter((a) => (!F.domaine || a.domaine === F.domaine) && (!F.categorie || a.categorie === F.categorie)
    && (!F.etat || (F.etat === 'verifier' ? a.a_verifier : F.etat === 'racheter' ? besoin(a) : F.etat === 'commande' ? a.commande_le : a.suivi === 'etat' && a.etat === F.etat))
    && mots.every((m) => texteRecherche(a).includes(m)));
  res.sort((x, y) => ORDRE_DOMAINES.indexOf(x.domaine) - ORDRE_DOMAINES.indexOf(y.domaine)
    || ORDRE_CATEGORIES.indexOf(x.categorie) - ORDRE_CATEGORIES.indexOf(y.categorie) || x.nom.localeCompare(y.nom, 'fr'));
  let html = `<h1>Inventaire</h1><p class="sous">${S.articles.length} articles au total.</p>
    <input class="recherche" id="inv-texte" type="search" placeholder="Filtrer…" value="${esc(F.texte)}">
    <div class="filtres">
      <select id="inv-domaine">${opt(DOMAINES, F.domaine, 'Tous les domaines')}</select>
      <select id="inv-categorie">${opt(CATEGORIES, F.categorie, 'Toutes les catégories')}</select>
      <select id="inv-etat">${opt({ racheter: 'À racheter', commande: 'En commande', verifier: 'À vérifier', ok: 'OK', presque_vide: 'Presque vide', vide: 'Vide', introuvable: 'Introuvable' }, F.etat, 'Tous les états')}</select>
    </div>
    <div class="actions"><a class="btn" href="#/ajouter">＋ Ajouter un article</a></div>
    <h2>${res.length} article${res.length > 1 ? 's' : ''}</h2>`;
  let cle = '';
  for (const a of res) {
    const c = `${DOMAINES[a.domaine]} · ${CATEGORIES[a.categorie]}`;
    if (c !== cle) { html += `${cle ? '</div>' : ''}<h3>${c}</h3><div class="liste">`; cle = c; }
    html += ligneArticle(a);
  }
  if (cle) html += '</div>';
  app().innerHTML = html;
  const champ = document.getElementById('inv-texte');
  champ.addEventListener('input', () => { F.texte = champ.value; const p = champ.selectionStart; ecranInventaire(); const c = document.getElementById('inv-texte'); c.focus(); c.setSelectionRange(p, p); });
  for (const k of ['domaine', 'categorie', 'etat']) document.getElementById(`inv-${k}`).addEventListener('change', (e) => { F[k] = e.target.value; ecranInventaire(); });
}

// ---------- Admin ----------
async function ecranAdmin() {
  if (!estAdmin()) { app().innerHTML = '<p class="vide-liste">Réservé à l\'administratrice. <a href="#" data-action="code">Entrer le code</a></p>'; return; }
  const annee = new Date().getMonth() >= 8 ? new Date().getFullYear() + 1 : new Date().getFullYear();
  const aVerifier = S.articles.filter((a) => a.a_verifier).length;
  app().innerHTML = `<h1>Administration</h1>
    <div class="bloc"><h3 style="margin-top:0">📄 Commande annuelle</h3>
      <p class="sous">Crée un fichier Excel au format de ta feuille « Budget » (blocs Biologie, Physique, Chimie, Commun) avec tout ce qui est à renouveler et les nouveautés proposées.</p>
      <div class="actions"><label class="compteur">Année <input id="annee-commande" type="number" value="${annee}"></label>
      <button class="btn principal" data-action="exporter">Générer Budget_${annee}.xlsx</button></div>
      <p class="sous">Une fois la commande passée :</p>
      <button class="btn" data-action="tout-commander">Marquer toute la liste comme « commandée »</button></div>

    <div class="bloc"><h3 style="margin-top:0">🏷️ QR codes des emplacements</h3>
      <p class="sous">À imprimer et coller sur chaque armoire.</p><a class="btn" href="#/qr">Afficher la planche à imprimer</a></div>

    <div class="bloc"><h3 style="margin-top:0">🔍 À vérifier</h3>
      <p class="sous">${aVerifier} articles viennent d'un achat récent ou d'une ligne douteuse de l'ancien inventaire. La tournée d'inventaire les valide un par un.</p>
      <button class="btn" data-action="voir-verifier">Voir la liste</button></div>

    <h2>Emplacements</h2>
    <div class="liste">${S.lieux.map((l) => `<div class="ligne"><div class="corps"><div class="nom">${esc(l.nom)}</div><div class="detail">${esc(l.salle)} · ${esc(l.id)}</div></div>
      <button class="btn petit" data-action="modifier-lieu" data-id="${esc(l.id)}">✏️</button></div>`).join('')}</div>
    <div class="actions"><button class="btn" data-action="modifier-lieu">＋ Nouvel emplacement</button></div>

    <h2>Derniers signalements</h2><div class="liste historique" id="journal"><p class="chargement">…</p></div>`;
  try {
    const ev = await api('labo_evenements?select=*&type=neq.import&order=cree_le.desc&limit=60');
    const j = document.getElementById('journal');
    if (j) j.innerHTML = ev.map((e) => { const a = S.articles.find((x) => x.id === e.article_id); return `<a class="ligne" href="#/article/${e.article_id}"><div class="corps">
      <div class="nom">${a ? nomComplet(a) : 'Article retiré'}</div><div class="detail">${esc(EVENEMENTS[e.type] || e.type)}${e.quantite != null ? ` (${e.quantite})` : ''}${e.note ? ` · ${esc(e.note)}` : ''}</div></div>
      <div class="droite detail">${dateCourte(e.cree_le)}</div></a>`; }).join('') || '<p class="vide-liste">Rien encore.</p>';
  } catch { /* facultatif */ }
}

async function modifierLieu(id) {
  const l = id ? lieu(id) : { id: '', salle: '', nom: '', details: '', ordre: (S.lieux.at(-1)?.ordre ?? 0) + 1 };
  const r = await dialogue(`
    <h3>${id ? 'Modifier l\'emplacement' : 'Nouvel emplacement'}</h3>
    <label class="champ"><span>Identifiant (dans le QR code, sans espace)</span><input name="id" required pattern="[a-z0-9-]+" value="${esc(l.id)}" ${id ? 'readonly' : ''}></label>
    <label class="champ"><span>Salle</span><input name="salle" required value="${esc(l.salle)}" list="salles"></label>
    <datalist id="salles">${[...new Set(S.lieux.map((x) => x.salle))].map((s) => `<option value="${esc(s)}">`).join('')}</datalist>
    <label class="champ"><span>Nom</span><input name="nom" required value="${esc(l.nom)}"></label>
    <label class="champ"><span>Détails (ce qu'on y range)</span><textarea name="details" rows="3">${esc(l.details)}</textarea></label>
    <label class="champ"><span>Ordre d'affichage</span><input name="ordre" type="number" value="${l.ordre}"></label>
    <p class="erreur"></p>
    <div class="actions"><button class="btn principal" value="ok">Enregistrer</button><button class="btn" value="annuler" formnovalidate>Annuler</button></div>`, {
    surValider: (d) => ecrire('labo_lieu_enregistrer', { p_id: d.id, p_salle: d.salle, p_nom: d.nom, p_details: d.details || null, p_ordre: Number(d.ordre) || 0 }),
  });
  if (r) {
    const i = S.lieux.findIndex((x) => x.id === r.id);
    if (i >= 0) S.lieux[i] = r; else S.lieux.push(r);
    S.lieux.sort((x, y) => x.ordre - y.ordre);
    toast('Emplacement enregistré.'); ecranAdmin();
  }
}

function ecranQR() {
  const base = location.href.split('#')[0];
  app().innerHTML = `<div class="pas-imprime"><a class="retour" href="#/admin">← Admin</a><h1>QR codes</h1>
    <p class="sous">Imprime cette page (Ctrl+P). Chaque étiquette ouvre directement le contenu de l'emplacement.</p>
    <button class="btn principal" onclick="print()">🖨️ Imprimer</button></div>
    <div class="planche-qr" style="margin-top:16px">${S.lieux.map((l) => `<div class="etiquette"><div class="qr" data-url="${esc(base)}#/lieu/${esc(l.id)}"></div>
      <div class="salle">${esc(l.salle)}</div><div class="lieu">${esc(l.nom)}</div><div class="salle">Scanne-moi pour signaler un produit vide ou cassé</div></div>`).join('')}</div>`;
  const dessiner = () => document.querySelectorAll('.qr[data-url]').forEach((el) => {
    el.innerHTML = '';
    new window.QRCode(el, { text: el.dataset.url, width: 150, height: 150, correctLevel: window.QRCode.CorrectLevel.M });
  });
  if (window.QRCode) dessiner(); else window.addEventListener('load', dessiner, { once: true });
}

// Fichier Excel au format des feuilles « Budget_AAAA » du fichier de commandes.
function exporterCommande(annee) {
  if (!window.XLSX) { toast('Bibliothèque Excel pas encore chargée, réessaie.'); return; }
  const lignes = [
    ['Dénomination', 'Prix Unitaire', `Commande Été ${annee}`, '', '', '', '', '', '', 'Remarques', 'Responsable', 'Site de commande'],
    ['', '', 'Quantité', 'Coût total'],
  ];
  const fusions = [];
  const totaux = [];
  const blocs = { biologie: 'Biologie', physique: 'Physique', chimie: 'Chimie', commun: 'Commun' };
  const renouv = listeACommander();
  const nouveautes = S.demandes.filter((d) => d.statut === 'a_commander');
  for (const [dom, titre] of Object.entries(blocs)) {
    lignes.push([]);
    lignes.push([titre, '', '', '', '', 'Commande']);
    const debut = lignes.length + 1; // numéro de ligne Excel de la 1re ligne d'article
    const items = renouv.filter(({ a }) => a.domaine === dom)
      .sort((x, y) => ORDRE_CATEGORIES.indexOf(x.a.categorie) - ORDRE_CATEGORIES.indexOf(y.a.categorie) || x.a.nom.localeCompare(y.a.nom, 'fr'));
    let sousTotal = 0;
    const formule = (n, prix, q) => { const v = Math.round((prix ?? 0) * q * 100) / 100; sousTotal = Math.round((sousTotal + v) * 100) / 100; return { t: 'n', v, f: `B${n}*C${n}` }; };
    for (const { a, b } of items) {
      const n = lignes.length + 1;
      lignes.push([`${a.nom}${a.conditionnement ? ` (${a.conditionnement})` : ''}`, a.prix ?? '', b.quantite, formule(n, a.prix, b.quantite),
        '', '', '', '', '', `Renouvellement : ${b.raison.toLowerCase()}`, '', a.lien || a.fournisseur || '']);
    }
    for (const d of nouveautes.filter((x) => x.domaine === dom)) {
      const n = lignes.length + 1;
      lignes.push([d.nom, d.prix ?? '', d.quantite, formule(n, d.prix, d.quantite), '', '', '', '', '',
        `Nouveau${d.pour ? ` · ${d.pour}` : ''}`, '', d.lien || d.fournisseur || '']);
    }
    const fin = lignes.length;
    const n = lignes.length + 1;
    lignes.push([`Total ${titre}`, '', '', fin >= debut ? { t: 'n', v: sousTotal, f: `SUM(D${debut}:D${fin})` } : 0]);
    totaux.push({ cellule: `D${n}`, v: sousTotal });
  }
  lignes.push([], ['Total', '', '', { t: 'n', v: totaux.reduce((s, x) => s + x.v, 0), f: totaux.map((x) => x.cellule).join('+') }]);
  const ws = window.XLSX.utils.aoa_to_sheet(lignes);
  fusions.push({ s: { r: 0, c: 2 }, e: { r: 0, c: 3 } });
  ws['!merges'] = fusions;
  ws['!cols'] = [{ wch: 55 }, { wch: 12 }, { wch: 10 }, { wch: 11 }, {}, {}, {}, {}, {}, { wch: 35 }, { wch: 14 }, { wch: 40 }];
  for (const cellule of Object.keys(ws)) {
    if (/^[BD]\d+$/.test(cellule) && ws[cellule] && (typeof ws[cellule].v === 'number' || ws[cellule].f)) ws[cellule].z = '#,##0.00 €';
  }
  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, `Budget_${annee}`);
  window.XLSX.writeFile(wb, `Budget_${annee} - commande labo.xlsx`);
  toast(`${renouv.length + nouveautes.length} lignes exportées.`);
}

async function toutCommander() {
  const renouv = listeACommander();
  const nouveautes = S.demandes.filter((d) => d.statut === 'a_commander');
  if (!renouv.length && !nouveautes.length) { toast('La liste est vide.'); return; }
  if (!confirm(`Marquer ${renouv.length + nouveautes.length} lignes comme commandées ?`)) return;
  for (const { a } of renouv) { const r = await ecrire('labo_commande', { p_article: a.id, p_action: 'commande' }); if (r) remplacerArticle(r); }
  for (const d of nouveautes) { const r = await ecrire('labo_demande', { p_action: 'commande', p_id: d.id }); if (r) remplacerDemande(r); }
  toast('Tout est marqué comme commandé.');
}

// =====================================================================
// Clics (délégation)
// =====================================================================
document.addEventListener('click', async (ev) => {
  const el = ev.target.closest('[data-action]');
  if (!el) return;
  const { action, id, type } = el.dataset;
  if (el.tagName === 'A') ev.preventDefault();
  try {
    switch (action) {
      case 'code': await demanderCode(); break;
      case 'signaler': await signaler(id, type); break;
      case 'tournee': S.tournee = !S.tournee; route(); break;
      case 'compter': await signaler(id, 'comptage', Number(document.querySelector(`[data-quantite="${id}"]`).value)); break;
      case 'moins': case 'plus': {
        const c = document.getElementById('nb-casse');
        c.value = Math.max(1, (Number(c.value) || 1) + (action === 'plus' ? 1 : -1)); break;
      }
      case 'casse': await signaler(id, 'casse', Math.max(1, Number(document.getElementById('nb-casse').value) || 1)); break;
      case 'recompter': await signaler(id, 'comptage', Number(document.getElementById('nb-compte').value)); break;
      case 'nouvelle-demande': await nouvelleDemande(); break;
      case 'commander-article': {
        const r = await ecrire('labo_commande', { p_article: Number(id), p_action: 'commande' });
        if (r) { remplacerArticle(r); toast('Marqué comme commandé.'); route(); } break;
      }
      case 'annuler-commande': {
        const r = await ecrire('labo_commande', { p_article: Number(id), p_action: 'annule' });
        if (r) { remplacerArticle(r); route(); } break;
      }
      case 'recu-article': await recuArticle(id); break;
      case 'commander-demande': case 'abandonner-demande': {
        const r = await ecrire('labo_demande', { p_action: action === 'commander-demande' ? 'commande' : 'abandonne', p_id: Number(id) });
        if (r) { remplacerDemande(r); route(); } break;
      }
      case 'recu-demande': await recuDemande(id); break;
      case 'retirer':
        if (confirm('Retirer cet article de l\'inventaire ? (Son historique est conservé.)')) {
          await ecrire('labo_article_retirer', { p_id: Number(id) });
          S.articles = S.articles.filter((a) => a.id !== Number(id)); majCompteurCommandes(); history.back();
        }
        break;
      case 'modifier-lieu': await modifierLieu(id); break;
      case 'exporter': exporterCommande(Number(document.getElementById('annee-commande').value)); break;
      case 'tout-commander': await toutCommander(); break;
      case 'voir-verifier': Object.assign(S.filtres, { domaine: '', categorie: '', etat: 'verifier', texte: '' }); location.hash = '#/inventaire'; break;
      default: break;
    }
  } catch (e) { console.error(e); }
});

// =====================================================================
// Routeur
// =====================================================================
function route({ garderScroll = false } = {}) {
  const y = window.scrollY;
  const [, ecran = '', param = ''] = (location.hash || '#/').split('/');
  const p = decodeURIComponent(param);
  const onglet = ecran === 'lieu' && p === 'xx' ? 'ranger' : { '': 'labo', lieu: 'labo', article: 'labo', commandes: 'commandes', inventaire: 'inventaire', admin: 'admin', qr: 'admin' }[ecran];
  document.querySelectorAll('.onglets a').forEach((a) => a.classList.toggle('actif', a.dataset.onglet === onglet));
  if (ecran !== 'lieu') S.tournee = false;
  switch (ecran) {
    case 'lieu': ecranLieu(p); break;
    case 'article': ecranArticle(p); break;
    case 'modifier': ecranFormulaire(p); break;
    case 'ajouter': ecranFormulaire(null, p, S.prerempli || {}); S.prerempli = null; break;
    case 'commandes': ecranCommandes(); break;
    case 'inventaire': ecranInventaire(); break;
    case 'admin': ecranAdmin(); break;
    case 'qr': ecranQR(); break;
    default: ecranLabo();
  }
  window.scrollTo(0, garderScroll ? y : 0);
}

window.addEventListener('hashchange', route);
document.addEventListener('visibilitychange', async () => {
  // Retour sur l'onglet : on recharge, quelqu'un a peut-être signalé quelque chose entre-temps.
  if (document.visibilityState === 'visible' && !document.getElementById('dialogue').open) {
    try { await chargerTout(); majCompteurCommandes(); if (!/^#\/(modifier|ajouter)/.test(location.hash)) route(); } catch { /* hors ligne */ }
  }
});

(async () => {
  try {
    await chargerTout();
    majCompteurCommandes();
    route();
  } catch (e) {
    app().innerHTML = `<p class="vide-liste">Impossible de charger l'inventaire.<br><small>${esc(e.message)}</small></p>`;
  }
})();
