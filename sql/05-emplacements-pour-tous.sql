-- Correctif du 01/11/2026 : tous les profs peuvent créer un emplacement.
-- Modifier un emplacement existant reste réservé à l'administratrice.
-- À coller une fois dans Supabase > SQL Editor > Run. (Déjà inclus dans 01-structure.sql.)

create or replace function labo_lieu_enregistrer(p_code text, p_id text, p_salle text, p_nom text,
                                                 p_details text default null, p_ordre int default 0)
returns labo_lieux
language plpgsql security definer set search_path = public as $$
declare l labo_lieux;
begin
  perform labo_exiger(p_code, exists (select 1 from labo_lieux where id = p_id));
  insert into labo_lieux(id, salle, nom, details, ordre)
       values (p_id, p_salle, p_nom, p_details, p_ordre)
  on conflict (id) do update
     set salle = excluded.salle, nom = excluded.nom, details = excluded.details, ordre = excluded.ordre;
  select * into l from labo_lieux where id = p_id;
  return l;
end $$;
