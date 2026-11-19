-- Socle : église, rôles, droits par menu, profils des comptes, données de référence.
-- Les droits sont appliqués par la base (RLS) à partir de role_menu.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- Tables

create table eglise (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  ville text,
  cree_le timestamptz not null default now()
);

create table role (
  code text primary key,
  libelle text not null,
  description text,
  ordre int not null default 100
);

create table role_menu (
  role_code text not null references role(code) on delete cascade,
  menu text not null check (menu in ('accueil', 'fideles', 'bergers', 'adnh', 'admin')),
  acces char(1) not null check (acces in ('r', 'w')),
  primary key (role_code, menu)
);

create table profil (
  id uuid primary key references auth.users(id) on delete cascade,
  eglise_id uuid not null references eglise(id),
  nom text not null,
  email text,
  role_code text not null default 'membre' references role(code),
  fonction text,
  berger_id uuid,               -- clé étrangère ajoutée avec la table berger
  actif boolean not null default true,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now()
);

create table gc (
  id text primary key,
  eglise_id uuid not null references eglise(id),
  nom text not null,
  tribu text,
  ordre int
);

create table classe (
  id text primary key,
  eglise_id uuid not null references eglise(id),
  numero int not null,
  nom text not null
);

-- ---------------------------------------------------------------- Fonctions d'aide

create function mon_profil() returns profil
language sql stable security definer set search_path = public as $$
  select p from profil p where p.id = auth.uid() and p.actif
$$;

create function mon_eglise() returns uuid
language sql stable security definer set search_path = public as $$
  select eglise_id from profil where id = auth.uid() and actif
$$;

create function mon_role() returns text
language sql stable security definer set search_path = public as $$
  select role_code from profil where id = auth.uid() and actif
$$;

create function mon_berger() returns uuid
language sql stable security definer set search_path = public as $$
  select berger_id from profil where id = auth.uid() and actif
$$;

-- peut('bergers', 'r') : vrai si mon rôle a 'r' ou 'w' sur le menu ; peut(…, 'w') : seulement 'w'.
create function peut(p_menu text, p_acces text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((
    select case when p_acces = 'r' then true else rm.acces = 'w' end
    from profil p join role_menu rm on rm.role_code = p.role_code and rm.menu = p_menu
    where p.id = auth.uid() and p.actif
  ), false)
$$;

create function touch() returns trigger
language plpgsql as $$
begin
  new.maj_le := now();
  return new;
end $$;

create trigger profil_touch before update on profil for each row execute function touch();

-- Seul un administrateur change le rôle, le rattachement, l'église ou l'état d'un compte.
-- Les scripts serveur (clé de service, pas d'utilisateur) ne sont pas concernés.
create function profil_garde_champs() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or peut('admin', 'w') then
    return new;
  end if;
  if new.role_code is distinct from old.role_code
     or new.berger_id is distinct from old.berger_id
     or new.actif is distinct from old.actif
     or new.eglise_id is distinct from old.eglise_id
     or new.email is distinct from old.email then
    raise exception 'Seul un administrateur peut modifier ce champ.' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger profil_garde before update on profil for each row execute function profil_garde_champs();

-- ---------------------------------------------------------------- Règles d'accès

alter table eglise enable row level security;
alter table role enable row level security;
alter table role_menu enable row level security;
alter table profil enable row level security;
alter table gc enable row level security;
alter table classe enable row level security;

create policy lecture on eglise for select to authenticated using (id = mon_eglise());

create policy lecture on role for select to authenticated using (mon_eglise() is not null);
create policy ecriture on role for all to authenticated using (peut('admin', 'w')) with check (peut('admin', 'w'));

create policy lecture on role_menu for select to authenticated using (mon_eglise() is not null);
create policy ecriture on role_menu for all to authenticated using (peut('admin', 'w')) with check (peut('admin', 'w'));

create policy lecture on profil for select to authenticated
  using (id = auth.uid() or (eglise_id = mon_eglise() and peut('admin', 'r')));
create policy modif_soi on profil for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy ecriture_admin on profil for all to authenticated
  using (eglise_id = mon_eglise() and peut('admin', 'w'))
  with check (eglise_id = mon_eglise() and peut('admin', 'w'));

create policy lecture on gc for select to authenticated using (eglise_id = mon_eglise());
create policy ecriture on gc for all to authenticated
  using (eglise_id = mon_eglise() and peut('admin', 'w')) with check (eglise_id = mon_eglise() and peut('admin', 'w'));

create policy lecture on classe for select to authenticated using (eglise_id = mon_eglise());
create policy ecriture on classe for all to authenticated
  using (eglise_id = mon_eglise() and peut('admin', 'w')) with check (eglise_id = mon_eglise() and peut('admin', 'w'));

revoke all on all tables in schema public from anon;
alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public revoke execute on functions from anon, public;
revoke execute on all functions in schema public from anon, public;
grant execute on function mon_profil(), mon_eglise(), mon_role(), mon_berger(), peut(text, text) to authenticated;

-- ---------------------------------------------------------------- Données de référence
-- Nécessaires au fonctionnement, en test comme en production. Aucune donnée personnelle.

insert into eglise (id, nom, ville) values ('00000000-0000-0000-0000-000000000001', 'EMCV', 'Abidjan');

insert into role (code, libelle, description, ordre) values
  ('admin', 'Administrateur', 'Pasteur principal ou gestionnaire du logiciel : tous les menus ; seul à fixer les objectifs.', 1),
  ('pasteur', 'Pasteur', 'Tous les menus sauf l''administration ; finances et objectifs en lecture.', 2),
  ('secretariat', 'Secrétariat', 'Fichiers, programmation, cérémonies, réunions, projets et communication.', 3),
  ('conseil', 'Conseil / anciens', 'Réunions et projets ; tableau de bord, recommandations et finances en lecture.', 4),
  ('berger', 'Berger', 'Ses brebis, ses absences et ses cellules.', 5),
  ('adnh', 'Équipe ADNH', 'Accueil, suivi et intégration des nouveaux.', 6),
  ('formateur', 'Formateur', 'Classes, sessions, inscrits et absences.', 7),
  ('resp_dep', 'Responsable de département', 'Son département, le planning de service, ses rapports et ses objectifs.', 8),
  ('resp_gc', 'Responsable de GC', 'Son groupe de communion : membres, présences, passages.', 9),
  ('tresorier', 'Trésorier', 'Dîmes, offrandes, budget, dépenses et patrimoine ; tableau de bord en lecture.', 10),
  ('intercession', 'Équipe d''intercession', 'Requêtes de prière et témoignages.', 11),
  ('moniteur', 'Moniteur (enfants)', 'Enfants inscrits et pointage du dimanche.', 12),
  ('membre', 'Fidèle', 'Annonces, programmation et dépôt de requêtes de prière.', 13);

-- Accueil en lecture pour tous, puis les droits du test repris de l'artefact.
insert into role_menu (role_code, menu, acces) select code, 'accueil', 'r' from role;
insert into role_menu (role_code, menu, acces) values
  ('admin', 'bergers', 'w'), ('pasteur', 'bergers', 'w'), ('secretariat', 'bergers', 'r'), ('berger', 'bergers', 'w'),
  ('admin', 'adnh', 'w'), ('pasteur', 'adnh', 'w'), ('secretariat', 'adnh', 'w'), ('adnh', 'adnh', 'w'),
  ('admin', 'fideles', 'w'), ('pasteur', 'fideles', 'w'), ('secretariat', 'fideles', 'w'), ('conseil', 'fideles', 'r'),
  ('berger', 'fideles', 'r'), ('adnh', 'fideles', 'w'), ('formateur', 'fideles', 'r'), ('resp_gc', 'fideles', 'r'),
  ('tresorier', 'fideles', 'r'),
  ('admin', 'admin', 'w');

insert into gc (id, eglise_id, nom, tribu, ordre)
select v.id, '00000000-0000-0000-0000-000000000001', v.nom, v.tribu, v.ordre from (values
  ('gc01', 'GC 1', '', 1), ('gc02', 'GC 2', '', 2), ('gc03', 'GC 3', '', 3), ('gc04', 'GC 4', '', 4),
  ('gc05', 'GC 5', '', 5), ('gc06', 'GC 6', '', 6), ('gc07', 'GC 7', '', 7), ('gc08', 'GC 8', '', 8),
  ('gc09', 'GC 9', '', 9), ('gc10', 'GC 10', '', 10), ('gc11', 'GC 11', '', 11), ('gc12', 'GC 12', '', 12)
) as v(id, nom, tribu, ordre);

insert into classe (id, eglise_id, numero, nom)
select v.id, '00000000-0000-0000-0000-000000000001', v.numero, v.nom from (values
  ('classe1', 1, 'Membership'), ('classe2', 2, 'Discipleship'), ('classe3', 3, 'Être leader'), ('classe4', 4, 'Départ (bergers)')
) as v(id, numero, nom);
