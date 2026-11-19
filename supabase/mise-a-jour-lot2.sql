-- Mise à jour d'une base déjà installée (lot 1) vers le lot 2. À exécuter UNE fois dans l'éditeur SQL de Supabase.
-- Fichier généré par scripts/seed.mjs : ne pas le modifier à la main.

-- Lot 2 : Cellules, GC, Programmation, Jour de culte.
-- Mêmes principes que le lot 1 : chaque fiche rattachée à une église, droits lus dans role_menu,
-- périmètre du berger (ses cellules) et du responsable de GC (son GC et ses membres).

-- ---------------------------------------------------------------- Menus et droits

alter table role_menu drop constraint role_menu_menu_check;
alter table role_menu add constraint role_menu_menu_check
  check (menu in ('accueil', 'fideles', 'bergers', 'adnh', 'admin', 'cellules', 'gc', 'agenda', 'culte'));

-- Droits repris de l'objet ROLES de l'artefact (app/index.html).
insert into role_menu (role_code, menu, acces) values
  ('admin', 'cellules', 'w'), ('admin', 'gc', 'w'), ('admin', 'agenda', 'w'), ('admin', 'culte', 'w'),
  ('pasteur', 'cellules', 'w'), ('pasteur', 'gc', 'w'), ('pasteur', 'agenda', 'w'), ('pasteur', 'culte', 'w'),
  ('secretariat', 'cellules', 'r'), ('secretariat', 'gc', 'r'), ('secretariat', 'agenda', 'w'), ('secretariat', 'culte', 'w'),
  ('conseil', 'agenda', 'r'),
  ('berger', 'cellules', 'w'), ('berger', 'agenda', 'r'),
  ('adnh', 'cellules', 'r'), ('adnh', 'gc', 'r'), ('adnh', 'agenda', 'r'), ('adnh', 'culte', 'w'),
  ('formateur', 'agenda', 'r'),
  ('resp_dep', 'agenda', 'r'),
  ('resp_gc', 'gc', 'w'), ('resp_gc', 'agenda', 'r'),
  ('tresorier', 'culte', 'r'),
  ('intercession', 'agenda', 'r'),
  ('moniteur', 'agenda', 'r'),
  ('membre', 'agenda', 'r')
on conflict (role_code, menu) do update set acces = excluded.acces;

-- ---------------------------------------------------------------- Responsable de GC

alter table profil add column gc_id text references gc(id) on delete set null;

create function mon_gc() returns text
language sql stable security definer set search_path = public as $$
  select gc_id from profil where id = auth.uid() and actif
$$;

create function est_resp_gc() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(mon_role() = 'resp_gc', false)
$$;
grant execute on function mon_gc(), est_resp_gc() to authenticated;

-- Le rattachement d'un compte à un GC est réservé à l'administrateur, comme le berger.
create or replace function profil_garde_champs() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or peut('admin', 'w') then
    return new;
  end if;
  if new.role_code is distinct from old.role_code
     or new.berger_id is distinct from old.berger_id
     or new.gc_id is distinct from old.gc_id
     or new.actif is distinct from old.actif
     or new.eglise_id is distinct from old.eglise_id
     or new.email is distinct from old.email then
    raise exception 'Seul un administrateur peut modifier ce champ.' using errcode = 'P0001';
  end if;
  return new;
end $$;

-- GC : responsables associés ; lecture limitée à son GC pour un responsable de GC ; écriture par le menu GC.
alter table gc add column responsables text[] not null default array['', '', '', '', ''];

drop policy lecture on gc;
drop policy ecriture on gc;
create policy lecture on gc for select to authenticated
  using (eglise_id = mon_eglise() and (not est_resp_gc() or id = mon_gc()));
create policy creation on gc for insert to authenticated
  with check (eglise_id = mon_eglise() and peut('gc', 'w') and not est_resp_gc());
create policy modification on gc for update to authenticated
  using (eglise_id = mon_eglise() and peut('gc', 'w') and (not est_resp_gc() or id = mon_gc()))
  with check (eglise_id = mon_eglise() and peut('gc', 'w') and (not est_resp_gc() or id = mon_gc()));
create policy suppression on gc for delete to authenticated
  using (eglise_id = mon_eglise() and peut('gc', 'w') and not est_resp_gc());

-- Fidèles : un responsable de GC ne voit que les membres de son GC (s'il n'est relié à aucun GC, rien).
drop policy lecture on fidele;
create policy lecture on fidele for select to authenticated
  using (eglise_id = mon_eglise() and peut('fideles', 'r')
         and (not est_berger() or berger_id = mon_berger())
         and (not est_resp_gc() or gc_id = mon_gc()));

-- ---------------------------------------------------------------- Cellules

create table cellule (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  nom text not null,
  lieu text,
  commune text,
  famille_accueil text,
  berger_id uuid references berger(id) on delete set null,
  jour text check (jour in ('Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche')),
  infos text,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid()
);

create table rapport_cellule (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  cellule_id uuid not null references cellule(id) on delete cascade,
  date date not null,
  presents int check (presents >= 0),
  nouveaux int check (nouveaux >= 0),
  offrande bigint check (offrande >= 0),   -- FCFA, entier
  sujets text,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid()
);

alter table fidele add column cellule_id uuid references cellule(id) on delete set null;
alter table nouveau add column cellule_id uuid references cellule(id) on delete set null;

create trigger cellule_touch before update on cellule for each row execute function touch_auteur();
create trigger rapport_cellule_touch before update on rapport_cellule for each row execute function touch_auteur();

alter table cellule enable row level security;
alter table rapport_cellule enable row level security;

-- Un berger ne voit et ne gère que les cellules qu'il anime.
create policy lecture on cellule for select to authenticated
  using (eglise_id = mon_eglise() and peut('cellules', 'r') and (not est_berger() or berger_id = mon_berger()));
create policy ecriture on cellule for all to authenticated
  using (eglise_id = mon_eglise() and peut('cellules', 'w') and (not est_berger() or berger_id = mon_berger()))
  with check (eglise_id = mon_eglise() and peut('cellules', 'w') and (not est_berger() or berger_id = mon_berger()));

create policy lecture on rapport_cellule for select to authenticated
  using (eglise_id = mon_eglise() and peut('cellules', 'r') and exists (select 1 from cellule c where c.id = cellule_id));
create policy ecriture on rapport_cellule for all to authenticated
  using (eglise_id = mon_eglise() and peut('cellules', 'w') and exists (select 1 from cellule c where c.id = cellule_id))
  with check (eglise_id = mon_eglise() and peut('cellules', 'w') and exists (select 1 from cellule c where c.id = cellule_id));

-- ---------------------------------------------------------------- GC : présences et passages de service

create table gc_presence (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  gc_id text not null references gc(id) on delete cascade,
  date date not null,
  presents int not null default 0,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid(),
  unique (gc_id, date)
);

create table gc_absence (
  presence_id uuid not null references gc_presence(id) on delete cascade,
  fidele_id uuid not null references fidele(id) on delete cascade,
  primary key (presence_id, fidele_id)
);

create table gc_passage (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  gc_id text not null references gc(id) on delete cascade,
  date date not null,
  note text,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid()
);

create trigger gc_presence_touch before update on gc_presence for each row execute function touch_auteur();
create trigger gc_passage_touch before update on gc_passage for each row execute function touch_auteur();

alter table gc_presence enable row level security;
alter table gc_absence enable row level security;
alter table gc_passage enable row level security;

create policy lecture on gc_presence for select to authenticated
  using (eglise_id = mon_eglise() and peut('gc', 'r') and (not est_resp_gc() or gc_id = mon_gc()));
create policy ecriture on gc_presence for all to authenticated
  using (eglise_id = mon_eglise() and peut('gc', 'w') and (not est_resp_gc() or gc_id = mon_gc()))
  with check (eglise_id = mon_eglise() and peut('gc', 'w') and (not est_resp_gc() or gc_id = mon_gc()));

create policy lecture on gc_absence for select to authenticated
  using (exists (select 1 from gc_presence p where p.id = presence_id));
create policy ecriture on gc_absence for all to authenticated
  using (peut('gc', 'w') and exists (select 1 from gc_presence p where p.id = presence_id))
  with check (peut('gc', 'w') and exists (
    select 1 from gc_presence p join fidele f on f.gc_id = p.gc_id
    where p.id = gc_absence.presence_id and f.id = gc_absence.fidele_id));

create policy lecture on gc_passage for select to authenticated
  using (eglise_id = mon_eglise() and peut('gc', 'r') and (not est_resp_gc() or gc_id = mon_gc()));
create policy ecriture on gc_passage for all to authenticated
  using (eglise_id = mon_eglise() and peut('gc', 'w') and (not est_resp_gc() or gc_id = mon_gc()))
  with check (eglise_id = mon_eglise() and peut('gc', 'w') and (not est_resp_gc() or gc_id = mon_gc()));

-- Remplace le relevé de présence d'un GC pour une date ; chaque absent doit être membre du GC.
create function enregistrer_presence_gc(p_gc text, p_date date, p_absents uuid[]) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_presence uuid;
  v_membres int;
begin
  if not peut('gc', 'w') then
    perform refuser('Vous n''avez pas le droit de faire cette action.');
  end if;
  if not exists (select 1 from gc where id = p_gc and eglise_id = mon_eglise()) then
    perform refuser('GC introuvable.');
  end if;
  if est_resp_gc() and p_gc is distinct from mon_gc() then
    perform refuser('Vous ne pouvez relever que les présences de votre GC.');
  end if;
  if exists (
    select 1 from unnest(coalesce(p_absents, '{}')) a(id)
    where not exists (select 1 from fidele f where f.id = a.id and f.gc_id = p_gc)
  ) then
    perform refuser('Chaque absent doit être membre de ce GC.');
  end if;
  select count(*) into v_membres from fidele where gc_id = p_gc;
  insert into gc_presence (eglise_id, gc_id, date, presents)
  values (mon_eglise(), p_gc, p_date, v_membres - coalesce(array_length(p_absents, 1), 0))
  on conflict (gc_id, date) do update set presents = excluded.presents, maj_le = now(), maj_par = auth.uid()
  returning id into v_presence;
  delete from gc_absence where presence_id = v_presence;
  insert into gc_absence (presence_id, fidele_id) select v_presence, a.id from unnest(coalesce(p_absents, '{}')) a(id);
end $$;

-- ---------------------------------------------------------------- Programmation

-- Églises et assemblées suivies dans le calendrier (distinct de la table eglise, qui sépare les données).
create table assemblee (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  nom text not null,
  ville text,
  commune text,
  pasteur text,
  contact text,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid()
);

create table evenement (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  titre text not null,
  type text not null default 'Autre' check (type in ('Culte', 'Veillée de prière', 'Étude biblique', 'Convention', 'Séminaire', 'Retraite', 'Croisade', 'Réunion', 'Formation', 'Autre')),
  assemblee_id uuid references assemblee(id) on delete set null,
  date date not null,
  heure text,
  date_fin date,
  lieu text,
  responsable text,
  frais bigint check (frais >= 0),          -- FCFA, entier
  description text,
  bilan text,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid(),
  check (date_fin is null or date_fin >= date)
);

create trigger assemblee_touch before update on assemblee for each row execute function touch_auteur();
create trigger evenement_touch before update on evenement for each row execute function touch_auteur();

alter table assemblee enable row level security;
alter table evenement enable row level security;

create policy lecture on assemblee for select to authenticated using (eglise_id = mon_eglise() and peut('agenda', 'r'));
create policy ecriture on assemblee for all to authenticated
  using (eglise_id = mon_eglise() and peut('agenda', 'w')) with check (eglise_id = mon_eglise() and peut('agenda', 'w'));
create policy lecture on evenement for select to authenticated using (eglise_id = mon_eglise() and peut('agenda', 'r'));
create policy ecriture on evenement for all to authenticated
  using (eglise_id = mon_eglise() and peut('agenda', 'w')) with check (eglise_id = mon_eglise() and peut('agenda', 'w'));

-- ---------------------------------------------------------------- Jour de culte

create table comptage (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  date date not null,
  culte text not null check (culte in ('Culte du dimanche – 1er service', 'Culte du dimanche – 2e service', 'Culte de semaine', 'Veillée', 'Autre')),
  hommes int check (hommes >= 0),
  femmes int check (femmes >= 0),
  enfants int check (enfants >= 0),
  nouveaux int check (nouveaux >= 0),
  notes text,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid()
);

create table poste_accueil (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  date date not null,
  poste text not null check (poste in ('Entrée principale', 'Placement – nef', 'Placement – balcon', 'Parking', 'Accueil des nouveaux', 'Salle des enfants', 'Sécurité')),
  agent text not null,
  contact text,
  places int check (places >= 0),
  observations text,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid()
);

create trigger comptage_touch before update on comptage for each row execute function touch_auteur();
create trigger poste_accueil_touch before update on poste_accueil for each row execute function touch_auteur();

alter table comptage enable row level security;
alter table poste_accueil enable row level security;

create policy lecture on comptage for select to authenticated using (eglise_id = mon_eglise() and peut('culte', 'r'));
create policy ecriture on comptage for all to authenticated
  using (eglise_id = mon_eglise() and peut('culte', 'w')) with check (eglise_id = mon_eglise() and peut('culte', 'w'));
create policy lecture on poste_accueil for select to authenticated using (eglise_id = mon_eglise() and peut('culte', 'r'));
create policy ecriture on poste_accueil for all to authenticated
  using (eglise_id = mon_eglise() and peut('culte', 'w')) with check (eglise_id = mon_eglise() and peut('culte', 'w'));

-- ---------------------------------------------------------------- Intégration ADNH : la cellule revient

drop function valider_integration(uuid, text, int, uuid);
create function valider_integration(p_nouveau uuid, p_gc text, p_classe int, p_berger uuid, p_cellule uuid default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  n nouveau;
  v_fidele uuid;
begin
  if not peut('adnh', 'w') then
    perform refuser('Vous n''avez pas le droit de faire cette action.');
  end if;
  select * into n from nouveau where id = p_nouveau and eglise_id = mon_eglise();
  if n.id is null then
    perform refuser('Nouveau introuvable.');
  end if;
  if p_gc is null or p_classe is null then
    perform refuser('Choisissez le GC et la classe.');
  end if;
  v_fidele := n.fidele_id;
  if v_fidele is not null and exists (select 1 from fidele where id = v_fidele) then
    update fidele set nom = n.nom, telephone = coalesce(n.contact, telephone), commune = coalesce(n.commune, commune),
      gc_id = p_gc, classe = p_classe, berger_id = coalesce(p_berger, berger_id), cellule_id = coalesce(p_cellule, cellule_id)
    where id = v_fidele;
  else
    insert into fidele (eglise_id, nom, telephone, commune, gc_id, classe, berger_id, cellule_id, statut, origine)
    values (n.eglise_id, n.nom, n.contact, n.commune, p_gc, p_classe, p_berger, p_cellule, 'Nouveau', 'ADNH')
    returning id into v_fidele;
  end if;
  update nouveau set statut = 'intégré', fidele_id = v_fidele, gc_id = p_gc, classe = p_classe, berger_id = p_berger, cellule_id = p_cellule
  where id = p_nouveau;
  return v_fidele;
end $$;

-- L'annuaire donne aussi les noms des cellules (pour afficher la cellule d'un fidèle à tout compte actif).
create or replace view annuaire as
  select b.id, 'berger'::text as type, trim(b.nom || coalesce(' ' || b.prenoms, '')) as nom,
         (select count(*) from fidele f where f.berger_id = b.id)::int as brebis
  from berger b
  where b.eglise_id = mon_eglise() and peut('accueil', 'r')
  union all
  select p.id, 'profil', p.nom, null::int
  from profil p
  where p.eglise_id = mon_eglise() and peut('accueil', 'r')
  union all
  select c.id, 'cellule', c.nom, null::int
  from cellule c
  where c.eglise_id = mon_eglise() and peut('accueil', 'r');

revoke all on annuaire from anon, public;
grant select on annuaire to authenticated;

revoke execute on function enregistrer_presence_gc(text, date, uuid[]), valider_integration(uuid, text, int, uuid, uuid), mon_gc(), est_resp_gc() from anon, public;
grant execute on function enregistrer_presence_gc(text, date, uuid[]), valider_integration(uuid, text, int, uuid, uuid), mon_gc(), est_resp_gc() to authenticated;


-- Données FICTIVES du lot 2 (cellules, GC, programmation, jour de culte).

insert into cellule (id, eglise_id, nom, lieu, commune, famille_accueil, berger_id, jour, infos) values
  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Cellule Riviera', 'Domicile de la famille Kouamé', 'Cocody', 'Famille Traoré', '10000000-0000-0000-0000-000000000001', 'Jeudi', 'Cellule fictive de test'),
  ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Cellule Angré', 'Domicile de la famille Yao', 'Cocody', 'Famille Diomandé', '10000000-0000-0000-0000-000000000001', 'Jeudi', 'Cellule fictive de test'),
  ('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Cellule Niangon', 'Domicile de la famille Brou', 'Yopougon', 'Famille Ouattara', '10000000-0000-0000-0000-000000000002', 'Jeudi', 'Cellule fictive de test'),
  ('50000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Cellule Sogefiha', 'Domicile de la famille Aka', 'Yopougon', 'Famille Brou', '10000000-0000-0000-0000-000000000002', 'Jeudi', 'Cellule fictive de test'),
  ('50000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Cellule Zone 4', 'Domicile de la famille Gnagne', 'Marcory', 'Famille Brou', '10000000-0000-0000-0000-000000000003', 'Jeudi', 'Cellule fictive de test'),
  ('50000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Cellule Abobo-Gare', 'Domicile de la famille Yao', 'Abobo', 'Famille Bamba', '10000000-0000-0000-0000-000000000004', 'Vendredi', 'Cellule fictive de test');

update fidele set cellule_id = '50000000-0000-0000-0000-000000000001' where id in ('20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000011');
update fidele set cellule_id = '50000000-0000-0000-0000-000000000002' where id in ('20000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000012');
update fidele set cellule_id = '50000000-0000-0000-0000-000000000003' where id in ('20000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000017', '20000000-0000-0000-0000-000000000019', '20000000-0000-0000-0000-000000000021');
update fidele set cellule_id = '50000000-0000-0000-0000-000000000004' where id in ('20000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000016', '20000000-0000-0000-0000-000000000018', '20000000-0000-0000-0000-000000000020', '20000000-0000-0000-0000-000000000022');
update fidele set cellule_id = '50000000-0000-0000-0000-000000000005' where id in ('20000000-0000-0000-0000-000000000023', '20000000-0000-0000-0000-000000000024', '20000000-0000-0000-0000-000000000025', '20000000-0000-0000-0000-000000000026', '20000000-0000-0000-0000-000000000027', '20000000-0000-0000-0000-000000000028');
update fidele set cellule_id = '50000000-0000-0000-0000-000000000006' where id in ('20000000-0000-0000-0000-000000000029', '20000000-0000-0000-0000-000000000030', '20000000-0000-0000-0000-000000000031', '20000000-0000-0000-0000-000000000032');

insert into rapport_cellule (id, eglise_id, cellule_id, date, presents, nouveaux, offrande, sujets) values
  ('51000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '2026-11-04', 4, 1, 9000, 'Prière pour les familles et les malades.'),
  ('51000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '2026-11-11', 5, 0, 3000, 'Prière pour les familles et les malades.'),
  ('51000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', '2026-11-04', 6, 0, 8000, 'Prière pour les familles et les malades.'),
  ('51000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', '2026-11-11', 5, 0, 4000, 'Prière pour les familles et les malades.'),
  ('51000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000003', '2026-11-04', 3, 1, 8000, 'Prière pour les familles et les malades.'),
  ('51000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000003', '2026-11-11', 3, 1, 9000, 'Prière pour les familles et les malades.'),
  ('51000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000004', '2026-11-04', 3, 0, 9000, 'Prière pour les familles et les malades.'),
  ('51000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000004', '2026-11-11', 3, 1, 9000, 'Prière pour les familles et les malades.'),
  ('51000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000005', '2026-11-04', 5, 1, 3000, 'Prière pour les familles et les malades.'),
  ('51000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000005', '2026-11-11', 5, 1, 7000, 'Prière pour les familles et les malades.'),
  ('51000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000006', '2026-11-04', 4, 1, 6000, 'Prière pour les familles et les malades.'),
  ('51000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000006', '2026-11-11', 2, 0, 8000, 'Prière pour les familles et les malades.');

update gc set tribu = 'Juda', responsables = array['Zadi Serge', 'Diomandé Patricia', 'Zadi Franck', '', ''] where id = 'gc01';
update gc set tribu = 'Lévi', responsables = array['Bamba Grâce', 'N''Guessan Prisca', 'Aka Arnaud', '', ''] where id = 'gc02';
update gc set tribu = 'Benjamin', responsables = array['Assi Hervé', 'Zadi Jean', 'Diomandé Patricia', '', ''] where id = 'gc03';
update gc set tribu = 'Éphraïm', responsables = array['Gnagne Serge', 'Yao Yannick', 'Assi Franck', '', ''] where id = 'gc04';
update gc set tribu = 'Manassé', responsables = array['Assi Serge', 'Yao Arnaud', 'Kouassi Serge', '', ''] where id = 'gc05';
update gc set tribu = 'Ruben', responsables = array['Yao Ange', 'Touré Yannick', 'Brou Nadège', '', ''] where id = 'gc06';
update gc set tribu = 'Siméon', responsables = array['Touré Serge', 'Traoré Christelle', 'Kouassi Ange', '', ''] where id = 'gc07';
update gc set tribu = 'Issacar', responsables = array['Ouattara Serge', 'Aka Marie', 'Aka Nadège', '', ''] where id = 'gc08';
update gc set tribu = 'Zabulon', responsables = array['Yao Arnaud', 'Koné Christelle', 'Konan Yannick', '', ''] where id = 'gc09';
update gc set tribu = 'Dan', responsables = array['Ehouman Patricia', 'Assi Arnaud', 'Kouamé Prisca', '', ''] where id = 'gc10';
update gc set tribu = 'Nephtali', responsables = array['Aka Nadège', 'Ouattara Marie', 'N''Guessan Ismaël', '', ''] where id = 'gc11';
update gc set tribu = 'Gad', responsables = array['Bamba Fabrice', 'Zadi Nadège', 'Konan Christelle', '', ''] where id = 'gc12';

insert into gc_presence (id, eglise_id, gc_id, date, presents) values
  ('52000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'gc01', '2026-11-15', 1),
  ('52000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'gc02', '2026-11-15', 2),
  ('52000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'gc03', '2026-11-15', 3);
insert into gc_absence (presence_id, fidele_id) values
  ('52000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000008'),
  ('52000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000022'),
  ('52000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002'),
  ('52000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000006'),
  ('52000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000010'),
  ('52000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000013');

insert into gc_passage (id, eglise_id, gc_id, date, note) values
  ('53000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'gc01', '2026-11-08', 'Accueil du culte du dimanche'),
  ('53000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'gc02', '2026-11-15', 'Placement dans la nef'),
  ('53000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'gc03', '2026-11-22', 'Accueil du culte du dimanche'),
  ('53000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'gc04', '2026-11-29', 'Nettoyage du temple');

insert into assemblee (id, eglise_id, nom, ville, commune, pasteur) values
  ('54000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'EMCV Abidjan (siège)', 'Abidjan', 'Cocody', 'Pasteur Traoré'),
  ('54000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'EMCV Yopougon', 'Abidjan', 'Yopougon', 'Pasteur Zadi'),
  ('54000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'EMCV Bouaké', 'Bouaké', 'Centre', 'Pasteur Touré');

insert into evenement (id, eglise_id, titre, type, assemblee_id, date, date_fin, heure, lieu, responsable, description) values
  ('55000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Convention annuelle', 'Convention', '54000000-0000-0000-0000-000000000001', '2026-01-16', '2026-01-18', '08:30', 'Temple principal', 'Pasteur Bamba', 'Activité fictive de test'),
  ('55000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Retraite des responsables', 'Retraite', '54000000-0000-0000-0000-000000000001', '2026-02-20', '2026-02-22', '08:30', 'Salle polyvalente', 'Pasteur Kouassi', 'Activité fictive de test'),
  ('55000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Séminaire des couples', 'Séminaire', '54000000-0000-0000-0000-000000000002', '2026-03-14', null, '08:30', 'Esplanade du temple', 'Pasteur Yao', 'Activité fictive de test'),
  ('55000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Culte de Pâques', 'Culte', '54000000-0000-0000-0000-000000000001', '2026-04-05', null, '08:30', 'Temple principal', 'Pasteur Kouadio', 'Activité fictive de test'),
  ('55000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Croisade d''évangélisation', 'Croisade', '54000000-0000-0000-0000-000000000003', '2026-05-22', '2026-05-24', '08:30', 'Salle polyvalente', 'Pasteur Kouassi', 'Activité fictive de test'),
  ('55000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Veillée de prière', 'Veillée de prière', '54000000-0000-0000-0000-000000000001', '2026-06-26', null, '21:00', 'Esplanade du temple', 'Pasteur N''Guessan', 'Activité fictive de test'),
  ('55000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Séminaire des jeunes', 'Séminaire', '54000000-0000-0000-0000-000000000002', '2026-08-08', null, '08:30', 'Temple principal', 'Pasteur Kouassi', 'Activité fictive de test'),
  ('55000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Rentrée des cellules', 'Réunion', '54000000-0000-0000-0000-000000000001', '2026-09-06', null, '08:30', 'Salle polyvalente', 'Pasteur Gnagne', 'Activité fictive de test'),
  ('55000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Formation des bergers', 'Formation', '54000000-0000-0000-0000-000000000001', '2026-10-10', null, '08:30', 'Esplanade du temple', 'Pasteur Traoré', 'Activité fictive de test'),
  ('55000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Veillée de prière', 'Veillée de prière', '54000000-0000-0000-0000-000000000002', '2026-11-27', null, '21:00', 'Temple principal', 'Pasteur Diomandé', 'Activité fictive de test'),
  ('55000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Étude biblique', 'Étude biblique', '54000000-0000-0000-0000-000000000001', '2026-12-02', null, '08:30', 'Salle polyvalente', 'Pasteur Zadi', 'Activité fictive de test'),
  ('55000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Veillée de Noël', 'Veillée de prière', '54000000-0000-0000-0000-000000000001', '2026-12-24', null, '21:00', 'Esplanade du temple', 'Pasteur Traoré', 'Activité fictive de test'),
  ('55000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Culte de Noël', 'Culte', '54000000-0000-0000-0000-000000000001', '2026-12-25', null, '08:30', 'Temple principal', 'Pasteur Coulibaly', 'Activité fictive de test'),
  ('55000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'Culte de fin d''année', 'Culte', '54000000-0000-0000-0000-000000000003', '2026-12-31', null, '08:30', 'Salle polyvalente', 'Pasteur Kouamé', 'Activité fictive de test');

insert into comptage (id, eglise_id, date, culte, hommes, femmes, enfants, nouveaux) values
  ('56000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-09-27', 'Culte du dimanche – 1er service', 316, 461, 117, 3),
  ('56000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2026-10-04', 'Culte du dimanche – 1er service', 294, 461, 115, 3),
  ('56000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '2026-10-11', 'Culte du dimanche – 1er service', 307, 444, 115, 1),
  ('56000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '2026-10-18', 'Culte du dimanche – 1er service', 296, 433, 113, 3),
  ('56000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '2026-10-25', 'Culte du dimanche – 1er service', 291, 442, 117, 2),
  ('56000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '2026-11-01', 'Culte du dimanche – 1er service', 307, 440, 136, 5),
  ('56000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '2026-11-08', 'Culte du dimanche – 1er service', 299, 421, 126, 4),
  ('56000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '2026-11-15', 'Culte du dimanche – 1er service', 302, 465, 115, 7);

insert into poste_accueil (id, eglise_id, date, poste, agent, contact, places) values
  ('57000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-11-15', 'Entrée principale', 'Koffi Fabrice', '+225 07 00 00 00 55', null),
  ('57000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2026-11-15', 'Parking', 'Kouadio Prisca', '+225 07 00 00 00 56', 64),
  ('57000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '2026-11-15', 'Accueil des nouveaux', 'Coulibaly Esther', '+225 07 00 00 00 57', null),
  ('57000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '2026-11-15', 'Salle des enfants', 'Konan Mariam', '+225 07 00 00 00 58', null);
