-- Correctif du 30/10/2026 : tous les profs peuvent marquer « commandé » (et annuler).
-- À coller une fois dans Supabase > SQL Editor > Run. (Déjà inclus dans 01-structure.sql.)

create or replace function labo_commande(p_code text, p_article bigint, p_action text,
                                         p_quantite int default null, p_prix numeric default null,
                                         p_fournisseur text default null, p_par text default null)
returns labo_articles
language plpgsql security definer set search_path = public as $$
declare a labo_articles;
begin
  -- Commander, annuler, réceptionner : tous les profs.
  perform labo_exiger(p_code);
  if p_action = 'commande' then
    update labo_articles set commande_le = current_date where id = p_article;
  elsif p_action = 'annule' then
    update labo_articles set commande_le = null where id = p_article;
  elsif p_action = 'recu' then
    update labo_articles
       set commande_le = null,
           etat = 'ok',
           quantite = case when suivi = 'nombre'
                           then coalesce(quantite,0) + coalesce(p_quantite,0) else quantite end,
           prix = coalesce(p_prix, prix),
           fournisseur = coalesce(nullif(p_fournisseur,''), fournisseur)
     where id = p_article;
  else
    raise exception 'Action inconnue : %', p_action;
  end if;
  update labo_articles set maj_le = now(), maj_par = p_par where id = p_article;
  insert into labo_evenements(article_id, type, quantite, par, note)
       values (p_article, p_action, p_quantite, p_par,
               case when p_action = 'recu' and p_fournisseur is not null then p_fournisseur end);
  select * into a from labo_articles where id = p_article;
  return a;
end $$;

create or replace function labo_demande(p_code text, p_action text, p_id bigint default null,
                                        p_data jsonb default '{}'::jsonb, p_par text default null)
returns labo_demandes
language plpgsql security definer set search_path = public as $$
declare d labo_demandes; nouvel_id bigint := p_id;
begin
  -- Proposer, commander et réceptionner : tous les profs. Le reste : administratrice.
  perform labo_exiger(p_code, p_action not in ('creer','commande','recu'));
  if p_action = 'creer' then
    insert into labo_demandes(nom, domaine, categorie, quantite, prix, fournisseur, lien, pour, par)
    values (p_data->>'nom', coalesce(p_data->>'domaine','chimie'),
            coalesce(p_data->>'categorie','materiel'), coalesce((p_data->>'quantite')::int,1),
            (p_data->>'prix')::numeric, p_data->>'fournisseur', p_data->>'lien',
            p_data->>'pour', p_par)
    returning id into nouvel_id;
  elsif p_action = 'modifier' then
    update labo_demandes set
      nom = coalesce(p_data->>'nom', nom),
      domaine = coalesce(p_data->>'domaine', domaine),
      categorie = coalesce(p_data->>'categorie', categorie),
      quantite = coalesce((p_data->>'quantite')::int, quantite),
      prix = case when p_data ? 'prix' then (p_data->>'prix')::numeric else prix end,
      fournisseur = case when p_data ? 'fournisseur' then p_data->>'fournisseur' else fournisseur end,
      lien = case when p_data ? 'lien' then p_data->>'lien' else lien end,
      pour = case when p_data ? 'pour' then p_data->>'pour' else pour end
    where id = p_id;
  elsif p_action = 'commande' then
    update labo_demandes set statut = 'commande', commande_le = current_date where id = p_id;
  elsif p_action = 'recu' then
    update labo_demandes set statut = 'recu', recu_le = current_date,
           article_id = coalesce((p_data->>'article_id')::bigint, article_id)
     where id = p_id;
  elsif p_action = 'abandonne' then
    update labo_demandes set statut = 'abandonne' where id = p_id;
  elsif p_action = 'rouvrir' then
    update labo_demandes set statut = 'a_commander', commande_le = null, recu_le = null where id = p_id;
  else
    raise exception 'Action inconnue : %', p_action;
  end if;
  select * into d from labo_demandes where id = nouvel_id;
  return d;
end $$;
