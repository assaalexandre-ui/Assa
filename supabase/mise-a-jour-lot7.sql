-- Mise à jour d'une base déjà au lot 6 vers le lot 7. À exécuter UNE fois dans l'éditeur SQL de Supabase.
-- Fichier généré par scripts/seed.mjs : ne pas le modifier à la main.

-- Lot 7 : Évangélisation, Sacrements et cérémonies, Paramètres de l'église, Dernières modifications.

alter table role_menu drop constraint role_menu_menu_check;
alter table role_menu add constraint role_menu_menu_check
  check (menu in ('accueil', 'fideles', 'bergers', 'adnh', 'admin', 'cellules', 'gc', 'agenda', 'culte',
                  'formations', 'departements', 'reunions', 'organigramme',
                  'priere', 'enfants', 'rdv', 'evenements',
                  'pilotage', 'stats', 'objectifs', 'projets',
                  'dons', 'budget', 'communication', 'patrimoine',
                  'evangelisation', 'ceremonies'));

-- Droits repris de l'artefact.
insert into role_menu (role_code, menu, acces) values
  ('admin', 'evangelisation', 'w'), ('admin', 'ceremonies', 'w'),
  ('pasteur', 'evangelisation', 'w'), ('pasteur', 'ceremonies', 'w'),
  ('secretariat', 'evangelisation', 'w'), ('secretariat', 'ceremonies', 'w')
on conflict (role_code, menu) do update set acces = excluded.acces;

-- ---------------------------------------------------------------- Évangélisation

create table sortie (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  date date not null,
  lieu text not null,
  commune text,
  equipe text,
  participants int check (participants >= 0),
  rencontres int check (rencontres >= 0),
  contacts text,          -- une personne par ligne : nom – téléphone
  bilan text,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid()
);
create trigger sortie_touch before update on sortie for each row execute function touch_auteur();

-- Contacts transmis à l'ADNH : la ligne de la sortie et le nouveau créé.
create table contact_transmis (
  sortie_id uuid not null references sortie(id) on delete cascade,
  ligne int not null check (ligne >= 0),
  nouveau_id uuid references nouveau(id) on delete set null,
  transmis_le timestamptz not null default now(),
  transmis_par uuid default auth.uid(),
  primary key (sortie_id, ligne)
);

alter table sortie enable row level security;
alter table contact_transmis enable row level security;
create policy lecture on sortie for select to authenticated using (eglise_id = mon_eglise() and peut('evangelisation', 'r'));
create policy ecriture on sortie for all to authenticated
  using (eglise_id = mon_eglise() and peut('evangelisation', 'w')) with check (eglise_id = mon_eglise() and peut('evangelisation', 'w'));
create policy lecture on contact_transmis for select to authenticated
  using (peut('evangelisation', 'r') and exists (select 1 from sortie s where s.id = sortie_id));

-- Normalise un numéro ivoirien en « +225 XX XX XX XX XX » (comme l'application) ; sinon le renvoie nettoyé.
create function telephone_ci(p text) returns text
language sql immutable set search_path = public as $$
  select case
    when length(d) = 13 and left(d, 3) = '225' then '+225 ' || regexp_replace(right(d, 10), '(\d{2})(?=\d)', '\1 ', 'g')
    when length(d) = 10 then '+225 ' || regexp_replace(d, '(\d{2})(?=\d)', '\1 ', 'g')
    else nullif(trim(p), '')
  end
  from (select regexp_replace(coalesce(p, ''), '\D', '', 'g') as d) x
$$;

-- Transmet un contact recueilli à l'ADNH : crée la fiche « nouveau » et note la transmission (une seule fois).
create function transmettre_contact(p_sortie uuid, p_ligne int) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  s sortie;
  l text;
  tel text;
  nom text;
  n uuid;
begin
  if not (peut('evangelisation', 'w') or peut('adnh', 'w')) then
    perform refuser('Vous n''avez pas le droit de faire cette action.');
  end if;
  select * into s from sortie where id = p_sortie and eglise_id = mon_eglise();
  if s.id is null then
    perform refuser('Sortie introuvable.');
  end if;
  if exists (select 1 from contact_transmis where sortie_id = p_sortie and ligne = p_ligne) then
    perform refuser('Ce contact a déjà été transmis à l''ADNH.');
  end if;
  select x into l from (
    select trim(t.x) as x, row_number() over (order by t.n) - 1 as i
      from regexp_split_to_table(coalesce(s.contacts, ''), E'\n') with ordinality as t(x, n)
     where trim(t.x) <> ''
  ) t where t.i = p_ligne;
  if l is null then
    perform refuser('Contact introuvable.');
  end if;
  tel := substring(l from '(\+?[0-9][0-9 .]{7,})\s*$');
  nom := trim(both ' -–—:,' from regexp_replace(l, '\+?[0-9][0-9 .]{7,}\s*$', ''));
  insert into nouveau (eglise_id, date_venue, nom, contact, commune, origine)
  values (mon_eglise(), current_date, coalesce(nullif(nom, ''), l), telephone_ci(tel), s.commune, 'Évangélisation · ' || s.lieu)
  returning id into n;
  insert into contact_transmis (sortie_id, ligne, nouveau_id) values (p_sortie, p_ligne, n);
  return n;
end $$;

-- ---------------------------------------------------------------- Sacrements et cérémonies

create table ceremonie (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  type text not null check (type in ('Baptême', 'Sainte-Cène', 'Mariage', 'Présentation d''enfant', 'Consécration', 'Obsèques')),
  date date not null,
  personnes text not null,
  officiant text,
  lieu text,
  notes text,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid()
);
create trigger ceremonie_touch before update on ceremonie for each row execute function touch_auteur();
alter table ceremonie enable row level security;
create policy lecture on ceremonie for select to authenticated using (eglise_id = mon_eglise() and peut('ceremonies', 'r'));
create policy ecriture on ceremonie for all to authenticated
  using (eglise_id = mon_eglise() and peut('ceremonies', 'w')) with check (eglise_id = mon_eglise() and peut('ceremonies', 'w'));

-- ---------------------------------------------------------------- Paramètres de l'église

alter table eglise add column nom_complet text;
alter table eglise add column pasteur text;
alter table eglise add column telephone text;
alter table eglise add column adresse text;
alter table eglise add column commune text;
alter table eglise add column email text;
alter table eglise add column horaires text;
alter table eglise add column maj_le timestamptz;
alter table eglise add column maj_par uuid;

-- Seul l'administrateur modifie les informations de l'église (le nom court reste fixé à l'installation).
create policy modification on eglise for update to authenticated
  using (id = mon_eglise() and peut('admin', 'w')) with check (id = mon_eglise() and peut('admin', 'w'));
create trigger eglise_touch before update on eglise for each row execute function touch_auteur();

-- ---------------------------------------------------------------- Dernières modifications

-- Les 60 dernières fiches créées ou modifiées, toutes tables confondues, avec l'auteur. Réservé à l'administration.
create function dernieres_modifications(p_limite int default 60) returns table (quand timestamptz, fiche text, menu text, par text)
language plpgsql stable security definer set search_path = public as $$
declare
  e uuid := mon_eglise();
begin
  if not peut('admin', 'r') then
    perform refuser('Vous n''avez pas le droit de voir le journal des modifications.');
  end if;
  return query
  with m as (
    select maj_le, maj_par, trim(nom || ' ' || coalesce(prenoms, '')) as fiche, 'Fidèles'::text as menu from fidele where eglise_id = e
    union all select maj_le, maj_par, nom, 'ADNH' from nouveau where eglise_id = e
    union all select maj_le, maj_par, trim(nom || ' ' || coalesce(prenoms, '')), 'Bergers' from berger where eglise_id = e
    union all select maj_le, maj_par, nom, 'Cellules' from cellule where eglise_id = e
    union all select maj_le, maj_par, titre, 'Programmation' from evenement where eglise_id = e
    union all select maj_le, maj_par, culte || ' du ' || to_char(date, 'DD/MM/YYYY'), 'Jour de culte' from comptage where eglise_id = e
    union all select maj_le, maj_par, nom, 'Départements' from departement where eglise_id = e
    union all select maj_le, maj_par, objet, 'Réunions' from reunion where eglise_id = e
    union all select maj_le, maj_par, titre, 'Tâches du conseil' from tache where eglise_id = e
    union all select maj_le, maj_par, left(sujet, 60), 'Requêtes de prière' from priere where eglise_id = e and (equipe_priere() or visibilite <> 'Confidentielle')
    union all select maj_le, maj_par, nom, 'Enfants' from enfant where eglise_id = e
    union all select maj_le, maj_par, personne, 'Rendez-vous pastoraux' from rdv where eglise_id = e
    union all select maj_le, maj_par, libelle, 'Objectifs' from objectif where eglise_id = e
    union all select maj_le, maj_par, nom, 'Projets' from projet where eglise_id = e
    union all select maj_le, maj_par, to_char(montant, 'FM999G999G999') || ' F · ' || to_char(date, 'DD/MM/YYYY'), 'Dîmes et offrandes' from don where eglise_id = e
    union all select maj_le, maj_par, objet, 'Budget et dépenses' from depense where eglise_id = e
    union all select maj_le, maj_par, titre, 'Communication' from annonce where eglise_id = e
    union all select maj_le, maj_par, article, 'Patrimoine' from article where eglise_id = e
    union all select maj_le, maj_par, lieu, 'Évangélisation' from sortie where eglise_id = e
    union all select maj_le, maj_par, type || ' · ' || personnes, 'Sacrements et cérémonies' from ceremonie where eglise_id = e
    union all select maj_le, maj_par, nom, 'Paramètres de l''église' from eglise where id = e and maj_le is not null
  )
  select m.maj_le, m.fiche, m.menu, coalesce(p.nom, '—')
    from m left join profil p on p.id = m.maj_par
   where m.maj_le is not null
   order by m.maj_le desc
   limit least(greatest(p_limite, 1), 200);
end $$;

revoke execute on function transmettre_contact(uuid, int), dernieres_modifications(int) from anon, public;
grant execute on function transmettre_contact(uuid, int), dernieres_modifications(int), telephone_ci(text) to authenticated;


-- Données FICTIVES du lot 7 (évangélisation, cérémonies, paramètres de l'église).

insert into sortie (id, eglise_id, date, lieu, commune, equipe, participants, rencontres, contacts, bilan) values
  ('87000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-09-12', 'Marché de Treichville', 'Treichville', 'Équipe A', 12, 45, 'Koffi Fabrice – 07 00 00 01 13
Kouadio Ange – 07 00 00 01 14
Diomandé Esther – 07 00 00 01 15', 'Sortie fictive de test'),
  ('87000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2026-10-03', 'Gare de Yopougon', 'Yopougon', 'Équipe B', 9, 38, 'Assi Ismaël – 07 00 00 01 16
Aka Ismaël – 07 00 00 01 17', 'Sortie fictive de test'),
  ('87000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '2026-10-24', 'Quartier Angré', 'Cocody', 'Équipe A', 14, 52, 'N''Guessan Patricia – 07 00 00 01 18
Bamba Ruth – 07 00 00 01 19
Ehouman Mariam – 07 00 00 01 20
Koffi Fabrice – 07 00 00 01 21', 'Sortie fictive de test'),
  ('87000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '2026-11-07', 'Abobo-Gare', 'Abobo', 'Équipe C', 8, 30, 'Aka Franck – 07 00 00 01 22
Aka Serge – 07 00 00 01 23', 'Sortie fictive de test'),
  ('87000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '2026-11-21', 'Marché de Koumassi', 'Koumassi', 'Équipe B', 11, 41, 'Kouadio Fabrice – 07 00 00 01 24
Assi Ruth – 07 00 00 01 25
Coulibaly Arnaud – 07 00 00 01 26', 'Sortie fictive de test');

insert into ceremonie (id, eglise_id, type, date, personnes, officiant, lieu, notes) values
  ('88000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Baptême', '2026-08-30', 'Touré Franck, Bamba Serge, Kouadio Franck, Aka Prisca, Kouadio Ismaël, Traoré Jean', 'Pasteur Aka', 'Temple principal', 'Fiche fictive de test'),
  ('88000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Baptême', '2026-11-15', 'Konan Esther, Assi Aïcha, Kouassi Yannick, Yao Mariam', 'Pasteur Gnagne', 'Temple principal', 'Fiche fictive de test'),
  ('88000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Sainte-Cène', '2026-10-04', 'Assemblée réunie', 'Pasteur Konan', 'Temple principal', 'Fiche fictive de test'),
  ('88000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Sainte-Cène', '2026-11-01', 'Assemblée réunie', 'Pasteur Traoré', 'Temple principal', 'Fiche fictive de test'),
  ('88000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Mariage', '2026-09-19', 'Brou Aïcha et Touré Hervé', 'Pasteur Brou', 'Temple principal', 'Fiche fictive de test'),
  ('88000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Présentation d''enfant', '2026-10-11', 'Assi Fabrice', 'Pasteur Zadi', 'Temple principal', 'Fiche fictive de test'),
  ('88000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Consécration', '2026-10-25', 'Assi Marie, Assi Mariam', 'Pasteur Koné', 'Temple principal', 'Fiche fictive de test'),
  ('88000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Obsèques', '2026-11-08', 'Brou Aïcha', 'Pasteur Traoré', 'Temple principal', 'Fiche fictive de test');

update eglise set nom_complet = 'Église Missionnaire Christ Vivant', pasteur = 'Pasteur principal (fictif)', telephone = '+225 07 00 00 00 99', adresse = 'Adresse du temple (fictive)', commune = 'Cocody', email = 'contact@exemple.org', horaires = 'Dimanche : 1er culte 7 h 30, 2e culte 10 h
Mercredi : étude biblique 18 h 30
Vendredi : veillée 22 h' where id = '00000000-0000-0000-0000-000000000001';


notify pgrst, 'reload schema';
