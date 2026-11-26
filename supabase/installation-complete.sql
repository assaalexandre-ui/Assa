-- Installation complète de la base EMCV (version de test), à exécuter UNE fois sur un projet Supabase vide.
-- Fichier généré par scripts/installation-sql.mjs : ne pas le modifier à la main.

-- ===== 20261119000001_socle.sql =====
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


-- ===== 20261119000002_metier.sql =====
-- Tables métier du test : bergers, fidèles, nouveaux (ADNH), appels, relevés d'absences.
-- Chaque fiche est rattachée à une église ; les droits viennent de role_menu (fonction peut).

-- Renseigne la date et l'auteur de chaque modification.
create function touch_auteur() returns trigger
language plpgsql as $$
begin
  new.maj_le := now();
  new.maj_par := coalesce(auth.uid(), new.maj_par);
  return new;
end $$;

create table berger (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  nom text not null,
  prenoms text,
  contact text,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid()
);

alter table profil add constraint profil_berger_fk foreign key (berger_id) references berger(id) on delete set null;

create table fidele (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  nom text not null,
  prenoms text,
  sexe text check (sexe in ('Homme', 'Femme')),
  date_naissance date,
  telephone text,
  commune text,
  quartier text,
  statut text not null default 'Membre' check (statut in ('Nouveau', 'Membre', 'Ouvrier', 'Responsable', 'Inactif')),
  berger_id uuid references berger(id) on delete set null,
  gc_id text references gc(id),
  classe int,
  notes text,
  origine text,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid()
);
create index fidele_berger_idx on fidele(berger_id);

create table nouveau (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  date_venue date not null,
  nom text not null,
  contact text,
  commune text,
  origine text,
  statut text not null default 'en suivi' check (statut in ('en suivi', 'intégré')),
  gc_id text references gc(id),
  classe int,
  berger_id uuid references berger(id) on delete set null,
  fidele_id uuid references fidele(id) on delete set null,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid()
);

create table appel (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  nouveau_id uuid not null references nouveau(id) on delete cascade,
  date date not null default current_date,
  resultat text not null check (resultat in ('Joint', 'Pas de réponse', 'Rappeler plus tard', 'Numéro erroné')),
  note text,
  auteur_id uuid default auth.uid(),
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid()
);
create index appel_nouveau_idx on appel(nouveau_id);

create table releve_absence (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  berger_id uuid not null references berger(id) on delete cascade,
  semaine text not null check (semaine ~ '^\d{4}-W\d{2}$'),
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid(),
  unique (berger_id, semaine)
);

create table absence (
  releve_id uuid not null references releve_absence(id) on delete cascade,
  fidele_id uuid not null references fidele(id) on delete cascade,
  primary key (releve_id, fidele_id)
);

create trigger berger_touch before update on berger for each row execute function touch_auteur();
create trigger fidele_touch before update on fidele for each row execute function touch_auteur();
create trigger nouveau_touch before update on nouveau for each row execute function touch_auteur();
create trigger appel_touch before update on appel for each row execute function touch_auteur();
create trigger releve_touch before update on releve_absence for each row execute function touch_auteur();

-- ---------------------------------------------------------------- Limite de 15 brebis par berger

create function limite_brebis() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.berger_id is null or (tg_op = 'UPDATE' and new.berger_id is not distinct from old.berger_id) then
    return new;
  end if;
  perform 1 from berger where id = new.berger_id for update;  -- évite deux ajouts simultanés
  if (select count(*) from fidele where berger_id = new.berger_id and id <> new.id) >= 15 then
    raise exception 'Ce berger suit déjà 15 brebis.' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger fidele_limite before insert or update of berger_id on fidele
  for each row execute function limite_brebis();

-- ---------------------------------------------------------------- Règles d'accès

alter table berger enable row level security;
alter table fidele enable row level security;
alter table nouveau enable row level security;
alter table appel enable row level security;
alter table releve_absence enable row level security;
alter table absence enable row level security;

-- Un compte « berger » ne voit que sa fiche et ses brebis ; sans fiche reliée, il ne voit rien.
create function est_berger() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(mon_role() = 'berger', false)
$$;
grant execute on function est_berger() to authenticated;

-- Bergers
create policy lecture on berger for select to authenticated
  using (eglise_id = mon_eglise() and peut('bergers', 'r') and (not est_berger() or id = mon_berger()));
create policy creation on berger for insert to authenticated
  with check (eglise_id = mon_eglise() and peut('bergers', 'w') and not est_berger());
create policy modification on berger for update to authenticated
  using (eglise_id = mon_eglise() and peut('bergers', 'w') and (not est_berger() or id = mon_berger()))
  with check (eglise_id = mon_eglise() and peut('bergers', 'w') and (not est_berger() or id = mon_berger()));
create policy suppression on berger for delete to authenticated
  using (eglise_id = mon_eglise() and peut('bergers', 'w') and not est_berger());

-- Fidèles
create policy lecture on fidele for select to authenticated
  using (eglise_id = mon_eglise() and peut('fideles', 'r') and (not est_berger() or berger_id = mon_berger()));
create policy creation on fidele for insert to authenticated
  with check (eglise_id = mon_eglise() and peut('fideles', 'w'));
create policy modification on fidele for update to authenticated
  using (eglise_id = mon_eglise() and (peut('fideles', 'w') or (est_berger() and peut('bergers', 'w') and berger_id = mon_berger())))
  with check (eglise_id = mon_eglise() and (peut('fideles', 'w') or (est_berger() and peut('bergers', 'w') and berger_id = mon_berger())));
create policy suppression on fidele for delete to authenticated
  using (eglise_id = mon_eglise() and peut('fideles', 'w'));

-- Nouveaux et appels (ADNH)
create policy lecture on nouveau for select to authenticated using (eglise_id = mon_eglise() and peut('adnh', 'r'));
create policy ecriture on nouveau for all to authenticated
  using (eglise_id = mon_eglise() and peut('adnh', 'w')) with check (eglise_id = mon_eglise() and peut('adnh', 'w'));

create policy lecture on appel for select to authenticated using (eglise_id = mon_eglise() and peut('adnh', 'r'));
create policy ecriture on appel for all to authenticated
  using (eglise_id = mon_eglise() and peut('adnh', 'w')) with check (eglise_id = mon_eglise() and peut('adnh', 'w'));

-- Relevés d'absences
create policy lecture on releve_absence for select to authenticated
  using (eglise_id = mon_eglise() and peut('bergers', 'r') and (not est_berger() or berger_id = mon_berger()));
create policy ecriture on releve_absence for all to authenticated
  using (eglise_id = mon_eglise() and peut('bergers', 'w') and (not est_berger() or berger_id = mon_berger()))
  with check (eglise_id = mon_eglise() and peut('bergers', 'w') and (not est_berger() or berger_id = mon_berger()));

create policy lecture on absence for select to authenticated
  using (exists (select 1 from releve_absence r where r.id = releve_id));
create policy ecriture on absence for all to authenticated
  using (peut('bergers', 'w') and exists (select 1 from releve_absence r where r.id = releve_id))
  with check (peut('bergers', 'w') and exists (select 1 from releve_absence r where r.id = releve_id));


-- ===== 20261119000003_fonctions.sql =====
-- Fonctions appelées par l'application : actions du berger sur ses brebis, relevé des absences,
-- intégration d'un nouveau (ADNH), annuaire des noms et protection du dernier accès administrateur.
-- Elles s'exécutent avec des droits étendus mais vérifient elles-mêmes rôle, église et périmètre.

create function refuser(p_message text) returns void
language plpgsql as $$
begin
  raise exception '%', p_message using errcode = 'P0001';
end $$;

-- Vérifie que l'appelant peut agir sur les brebis de ce berger.
create function controle_berger(p_berger uuid) returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if not peut('bergers', 'w') then
    perform refuser('Vous n''avez pas le droit de faire cette action.');
  end if;
  if est_berger() then
    if mon_berger() is null then
      perform refuser('Votre compte n''est pas relié à une fiche de berger.');
    end if;
    if p_berger is distinct from mon_berger() then
      perform refuser('Vous ne pouvez agir que sur vos propres brebis.');
    end if;
  end if;
  if not exists (select 1 from berger where id = p_berger and eglise_id = mon_eglise()) then
    perform refuser('Berger introuvable.');
  end if;
end $$;

-- Fidèles sans berger : identifiant et nom seulement (jamais le contact).
create function fideles_sans_berger() returns table (id uuid, nom text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not peut('bergers', 'w') then
    perform refuser('Vous n''avez pas le droit de faire cette action.');
  end if;
  if est_berger() and mon_berger() is null then
    perform refuser('Votre compte n''est pas relié à une fiche de berger.');
  end if;
  return query
    select f.id, trim(f.nom || coalesce(' ' || f.prenoms, ''))
    from fidele f
    where f.eglise_id = mon_eglise() and f.berger_id is null
    order by f.nom, f.prenoms;
end $$;

create function rattacher_brebis(p_fidele uuid, p_berger uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform controle_berger(p_berger);
  if not exists (select 1 from fidele where id = p_fidele and eglise_id = mon_eglise()) then
    perform refuser('Fidèle introuvable.');
  end if;
  if exists (select 1 from fidele where id = p_fidele and berger_id is not null) then
    perform refuser('Ce fidèle a déjà un berger.');
  end if;
  update fidele set berger_id = p_berger where id = p_fidele;
end $$;

create function creer_brebis(p_berger uuid, p_fiche jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  perform controle_berger(p_berger);
  if coalesce(trim(p_fiche ->> 'nom'), '') = '' then
    perform refuser('Le nom est obligatoire.');
  end if;
  insert into fidele (eglise_id, nom, prenoms, sexe, date_naissance, telephone, commune, quartier, statut, gc_id, classe, notes, berger_id)
  values (
    mon_eglise(), trim(p_fiche ->> 'nom'), nullif(p_fiche ->> 'prenoms', ''), nullif(p_fiche ->> 'sexe', ''),
    nullif(p_fiche ->> 'date_naissance', '')::date, nullif(p_fiche ->> 'telephone', ''), nullif(p_fiche ->> 'commune', ''),
    nullif(p_fiche ->> 'quartier', ''), coalesce(nullif(p_fiche ->> 'statut', ''), 'Membre'), nullif(p_fiche ->> 'gc_id', ''),
    nullif(p_fiche ->> 'classe', '')::int, nullif(p_fiche ->> 'notes', ''), p_berger
  )
  returning id into v_id;
  return v_id;
end $$;

-- Remplace le relevé d'absences d'un berger pour une semaine ISO (ex. 2026-W47).
create function enregistrer_releve(p_berger uuid, p_semaine text, p_absents uuid[]) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_releve uuid;
begin
  perform controle_berger(p_berger);
  if exists (
    select 1 from unnest(coalesce(p_absents, '{}')) a(id)
    where not exists (select 1 from fidele f where f.id = a.id and f.berger_id = p_berger)
  ) then
    perform refuser('Chaque absent doit être une brebis de ce berger.');
  end if;
  insert into releve_absence (eglise_id, berger_id, semaine) values (mon_eglise(), p_berger, p_semaine)
  on conflict (berger_id, semaine) do update set maj_le = now(), maj_par = auth.uid()
  returning id into v_releve;
  delete from absence where releve_id = v_releve;
  insert into absence (releve_id, fidele_id) select v_releve, a.id from unnest(coalesce(p_absents, '{}')) a(id);
end $$;

-- Intégration d'un nouveau : crée ou met à jour sa fiche fidèle, en une seule transaction.
create function valider_integration(p_nouveau uuid, p_gc text, p_classe int, p_berger uuid) returns uuid
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
      gc_id = p_gc, classe = p_classe, berger_id = coalesce(p_berger, berger_id)
    where id = v_fidele;
  else
    insert into fidele (eglise_id, nom, telephone, commune, gc_id, classe, berger_id, statut, origine)
    values (n.eglise_id, n.nom, n.contact, n.commune, p_gc, p_classe, p_berger, 'Nouveau', 'ADNH')
    returning id into v_fidele;
  end if;
  update nouveau set statut = 'intégré', fidele_id = v_fidele, gc_id = p_gc, classe = p_classe, berger_id = p_berger
  where id = p_nouveau;
  return v_fidele;
end $$;

-- Annuaire : seulement les noms (et le nombre de brebis d'un berger), pour tout compte actif de l'église.
create view annuaire as
  select b.id, 'berger'::text as type, trim(b.nom || coalesce(' ' || b.prenoms, '')) as nom,
         (select count(*) from fidele f where f.berger_id = b.id)::int as brebis
  from berger b
  where b.eglise_id = mon_eglise() and peut('accueil', 'r')
  union all
  select p.id, 'profil', p.nom, null::int
  from profil p
  where p.eglise_id = mon_eglise() and peut('accueil', 'r');

revoke all on annuaire from anon, public;
grant select on annuaire to authenticated;

-- Un administrateur ne peut pas se retirer à lui-même le rôle d'administrateur ni désactiver son compte.
create function garde_admin() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and old.id = auth.uid() and old.role_code = 'admin'
     and (tg_op = 'DELETE' or new.role_code <> 'admin' or not new.actif) then
    raise exception 'Vous ne pouvez pas retirer votre propre accès administrateur.' using errcode = 'P0001';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;

create trigger profil_garde_admin before update or delete on profil for each row execute function garde_admin();

revoke execute on function refuser(text), controle_berger(uuid), fideles_sans_berger(), rattacher_brebis(uuid, uuid),
  creer_brebis(uuid, jsonb), enregistrer_releve(uuid, text, uuid[]), valider_integration(uuid, text, int, uuid) from anon, public;
grant execute on function fideles_sans_berger(), rattacher_brebis(uuid, uuid), creer_brebis(uuid, jsonb),
  enregistrer_releve(uuid, text, uuid[]), valider_integration(uuid, text, int, uuid) to authenticated;


-- ===== 20261119000004_absence_perimetre.sql =====
-- Une absence ne peut concerner qu'une brebis du berger du relevé
-- (sinon, par l'API directe, un berger pouvait marquer absente la brebis d'un autre).
drop policy ecriture on absence;
create policy ecriture on absence for all to authenticated
  using (peut('bergers', 'w') and exists (select 1 from releve_absence r where r.id = releve_id))
  with check (
    peut('bergers', 'w')
    and exists (select 1 from releve_absence r where r.id = releve_id)
    and exists (
      select 1 from fidele f join releve_absence r on r.id = absence.releve_id
      where f.id = absence.fidele_id and f.berger_id = r.berger_id
    )
  );


-- ===== 20261120000001_lot2.sql =====
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


-- ===== 20261121000001_lot3.sql =====
-- Lot 3 : Formations, Départements, Réunions, Organigramme.
-- Droits repris de l'artefact ; périmètre du responsable de département (son département, ses créneaux, ses rapports).

-- ---------------------------------------------------------------- Menus et droits

alter table role_menu drop constraint role_menu_menu_check;
alter table role_menu add constraint role_menu_menu_check
  check (menu in ('accueil', 'fideles', 'bergers', 'adnh', 'admin', 'cellules', 'gc', 'agenda', 'culte',
                  'formations', 'departements', 'reunions', 'organigramme'));

insert into role_menu (role_code, menu, acces) values
  ('admin', 'formations', 'w'), ('admin', 'departements', 'w'), ('admin', 'reunions', 'w'), ('admin', 'organigramme', 'w'),
  ('pasteur', 'formations', 'w'), ('pasteur', 'departements', 'w'), ('pasteur', 'reunions', 'w'), ('pasteur', 'organigramme', 'w'),
  ('secretariat', 'formations', 'w'), ('secretariat', 'departements', 'w'), ('secretariat', 'reunions', 'w'), ('secretariat', 'organigramme', 'w'),
  ('conseil', 'departements', 'r'), ('conseil', 'reunions', 'w'), ('conseil', 'organigramme', 'r'),
  ('berger', 'organigramme', 'r'),
  ('adnh', 'formations', 'r'), ('adnh', 'organigramme', 'r'),
  ('formateur', 'formations', 'w'),
  ('resp_dep', 'departements', 'w'), ('resp_dep', 'organigramme', 'r'),
  ('resp_gc', 'organigramme', 'r')
on conflict (role_code, menu) do update set acces = excluded.acces;

-- ---------------------------------------------------------------- Formations

alter table classe add column role text;
alter table classe add column duree int check (duree > 0);

-- Les classes se modifient par le menu Formations (et plus seulement par l'administrateur).
drop policy ecriture on classe;
create policy ecriture on classe for all to authenticated
  using (eglise_id = mon_eglise() and peut('formations', 'w')) with check (eglise_id = mon_eglise() and peut('formations', 'w'));

create table session_formation (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  classe int not null,
  date_debut date not null,
  date_fin date not null,
  formateur text,
  lieu text,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid(),
  check (date_fin >= date_debut)
);

create table inscription_formation (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references session_formation(id) on delete cascade,
  fidele_id uuid not null references fidele(id) on delete cascade,
  absences int not null default 0 check (absences >= 0),
  valide boolean not null default false,
  unique (session_id, fidele_id)
);

create trigger session_formation_touch before update on session_formation for each row execute function touch_auteur();

alter table session_formation enable row level security;
alter table inscription_formation enable row level security;

create policy lecture on session_formation for select to authenticated using (eglise_id = mon_eglise() and peut('formations', 'r'));
create policy ecriture on session_formation for all to authenticated
  using (eglise_id = mon_eglise() and peut('formations', 'w')) with check (eglise_id = mon_eglise() and peut('formations', 'w'));
create policy lecture on inscription_formation for select to authenticated
  using (exists (select 1 from session_formation s where s.id = session_id));
create policy ecriture on inscription_formation for all to authenticated
  using (peut('formations', 'w') and exists (select 1 from session_formation s where s.id = session_id))
  with check (peut('formations', 'w') and exists (select 1 from session_formation s where s.id = session_id));

-- Valider (ou annuler) une classe : à la validation, le fidèle passe à la classe suivante si elle existe.
-- Fonction à droits étendus car le formateur ne modifie pas les fiches des fidèles.
create function valider_inscription(p_inscription uuid, p_valide boolean) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_classe int;
  v_fidele uuid;
begin
  if not peut('formations', 'w') then
    perform refuser('Vous n''avez pas le droit de faire cette action.');
  end if;
  select s.classe, i.fidele_id into v_classe, v_fidele
  from inscription_formation i join session_formation s on s.id = i.session_id
  where i.id = p_inscription and s.eglise_id = mon_eglise();
  if v_fidele is null then
    perform refuser('Inscription introuvable.');
  end if;
  update inscription_formation set valide = p_valide where id = p_inscription;
  if p_valide then
    update fidele set classe = case
      when exists (select 1 from classe c where c.eglise_id = mon_eglise() and c.numero = v_classe + 1) then v_classe + 1
      else v_classe end
    where id = v_fidele;
  end if;
end $$;

-- ---------------------------------------------------------------- Départements

alter table profil add column departement_id text;

create function mon_departement() returns text
language sql stable security definer set search_path = public as $$
  select departement_id from profil where id = auth.uid() and actif
$$;
create function est_resp_dep() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(mon_role() = 'resp_dep', false)
$$;
grant execute on function mon_departement(), est_resp_dep() to authenticated;

create table departement (
  id text primary key,
  eglise_id uuid not null default mon_eglise() references eglise(id),
  nom text not null,
  groupe text not null default 'service' check (groupe in ('service', 'autre')),
  responsable text,
  contact text,
  jour text,
  membres text[] not null default '{}',
  besoins text,
  ordre int,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid()
);
alter table profil add constraint profil_departement_fk foreign key (departement_id) references departement(id) on delete set null;

create table planning_service (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  date date not null,
  activite text not null,
  departement_id text not null references departement(id) on delete cascade,
  poste text,
  personne text,
  contact text,
  confirme boolean not null default false,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid()
);

create table rapport_departement (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  departement_id text not null references departement(id) on delete cascade,
  periode text not null check (periode ~ '^\d{4}-\d{2}$'),
  activites text,
  resultats text,
  difficultes text,
  effectif int check (effectif >= 0),
  statut text not null default 'Soumis' check (statut in ('Soumis', 'Validé', 'À revoir')),
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid()
);

create trigger departement_touch before update on departement for each row execute function touch_auteur();
create trigger planning_service_touch before update on planning_service for each row execute function touch_auteur();
create trigger rapport_departement_touch before update on rapport_departement for each row execute function touch_auteur();

alter table departement enable row level security;
alter table planning_service enable row level security;
alter table rapport_departement enable row level security;

-- Un responsable de département ne voit que le sien (sans rattachement, il ne voit rien).
create policy lecture on departement for select to authenticated
  using (eglise_id = mon_eglise() and peut('departements', 'r') and (not est_resp_dep() or id = mon_departement()));
create policy creation on departement for insert to authenticated
  with check (eglise_id = mon_eglise() and peut('departements', 'w') and not est_resp_dep());
create policy modification on departement for update to authenticated
  using (eglise_id = mon_eglise() and peut('departements', 'w') and (not est_resp_dep() or id = mon_departement()))
  with check (eglise_id = mon_eglise() and peut('departements', 'w') and (not est_resp_dep() or id = mon_departement()));
create policy suppression on departement for delete to authenticated
  using (eglise_id = mon_eglise() and peut('departements', 'w') and not est_resp_dep());

create policy lecture on planning_service for select to authenticated
  using (eglise_id = mon_eglise() and peut('departements', 'r') and (not est_resp_dep() or departement_id = mon_departement()));
create policy ecriture on planning_service for all to authenticated
  using (eglise_id = mon_eglise() and peut('departements', 'w') and (not est_resp_dep() or departement_id = mon_departement()))
  with check (eglise_id = mon_eglise() and peut('departements', 'w') and (not est_resp_dep() or departement_id = mon_departement()));

create policy lecture on rapport_departement for select to authenticated
  using (eglise_id = mon_eglise() and peut('departements', 'r') and (not est_resp_dep() or departement_id = mon_departement()));
create policy ecriture on rapport_departement for all to authenticated
  using (eglise_id = mon_eglise() and peut('departements', 'w') and (not est_resp_dep() or departement_id = mon_departement()))
  with check (eglise_id = mon_eglise() and peut('departements', 'w') and (not est_resp_dep() or departement_id = mon_departement()));

-- Le rattachement d'un compte à un département est réservé à l'administrateur.
create or replace function profil_garde_champs() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or peut('admin', 'w') then
    return new;
  end if;
  if new.role_code is distinct from old.role_code
     or new.berger_id is distinct from old.berger_id
     or new.gc_id is distinct from old.gc_id
     or new.departement_id is distinct from old.departement_id
     or new.actif is distinct from old.actif
     or new.eglise_id is distinct from old.eglise_id
     or new.email is distinct from old.email then
    raise exception 'Seul un administrateur peut modifier ce champ.' using errcode = 'P0001';
  end if;
  return new;
end $$;

-- Les 12 départements de référence (data/seed/departements.json). Libellés incomplets du Word conservés tels quels.
insert into departement (id, eglise_id, nom, groupe, ordre)
select v.id, '00000000-0000-0000-0000-000000000001', v.nom, v.groupe, v.ordre from (values
  ('d01', 'Accueil et ordre', 'service', 1), ('d02', 'Protocole et sécurité', 'service', 2),
  ('d03', 'Entretien et hygiène', 'service', 3), ('d04', 'Médias et audiovisuel', 'service', 4),
  ('d05', 'Sono et régie', 'service', 5), ('d06', 'Patrimoine et gestion des biens', 'service', 6),
  ('d07', 'Groupe de louange', 'service', 7), ('d08', 'École du dimanche', 'service', 8),
  ('d09', 'Département des femmes', 'autre', 9), ('d10', 'Départements sociaux : œuvres caritatives', 'autre', 10),
  ('d11', 'Département de la Sainte', 'autre', 11), ('d12', 'Département budget et trésorerie', 'autre', 12)
) as v(id, nom, groupe, ordre);

-- ---------------------------------------------------------------- Réunions et tâches du conseil

create table reunion (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  date date not null,
  instance text not null check (instance in ('Conseil', 'Pasteurs', 'Responsables', 'Assemblée générale', 'Autre')),
  assemblee_id uuid references assemblee(id) on delete set null,
  lieu text,
  objet text not null,
  presents text,
  discussions text,   -- un point par ligne
  decisions text,     -- une décision par ligne
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid()
);

create table tache (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  titre text not null,
  responsable text not null,
  echeance date,
  statut text not null default 'À faire' check (statut in ('À faire', 'En cours', 'Terminée')),
  reunion_id uuid references reunion(id) on delete set null,
  notes text,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid()
);

create trigger reunion_touch before update on reunion for each row execute function touch_auteur();
create trigger tache_touch before update on tache for each row execute function touch_auteur();

alter table reunion enable row level security;
alter table tache enable row level security;

create policy lecture on reunion for select to authenticated using (eglise_id = mon_eglise() and peut('reunions', 'r'));
create policy ecriture on reunion for all to authenticated
  using (eglise_id = mon_eglise() and peut('reunions', 'w')) with check (eglise_id = mon_eglise() and peut('reunions', 'w'));
create policy lecture on tache for select to authenticated using (eglise_id = mon_eglise() and peut('reunions', 'r'));
create policy ecriture on tache for all to authenticated
  using (eglise_id = mon_eglise() and peut('reunions', 'w')) with check (eglise_id = mon_eglise() and peut('reunions', 'w'));

-- ---------------------------------------------------------------- Organigramme

create table responsable (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  fonction text not null,
  nom text not null,
  contact text,
  whatsapp text,
  niveau text check (niveau in ('Direction', 'Pasteurs', 'Conseil', 'Responsables de ministère')),
  ordre int,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid()
);

create trigger responsable_touch before update on responsable for each row execute function touch_auteur();
alter table responsable enable row level security;
create policy lecture on responsable for select to authenticated using (eglise_id = mon_eglise() and peut('organigramme', 'r'));
create policy ecriture on responsable for all to authenticated
  using (eglise_id = mon_eglise() and peut('organigramme', 'w')) with check (eglise_id = mon_eglise() and peut('organigramme', 'w'));

revoke execute on function valider_inscription(uuid, boolean), mon_departement(), est_resp_dep() from anon, public;
grant execute on function valider_inscription(uuid, boolean) to authenticated;


-- ===== 20261122000001_lot4.sql =====
-- Lot 4 : Requêtes de prière, Enfants, Rendez-vous pastoraux, Événements.
-- Nouveauté par rapport à l'artefact : la visibilité des requêtes de prière est appliquée par la base.

alter table role_menu drop constraint role_menu_menu_check;
alter table role_menu add constraint role_menu_menu_check
  check (menu in ('accueil', 'fideles', 'bergers', 'adnh', 'admin', 'cellules', 'gc', 'agenda', 'culte',
                  'formations', 'departements', 'reunions', 'organigramme',
                  'priere', 'enfants', 'rdv', 'evenements'));

-- Droits repris de l'artefact.
insert into role_menu (role_code, menu, acces) values
  ('admin', 'priere', 'w'), ('admin', 'enfants', 'w'), ('admin', 'rdv', 'w'), ('admin', 'evenements', 'w'),
  ('pasteur', 'priere', 'w'), ('pasteur', 'enfants', 'w'), ('pasteur', 'rdv', 'w'), ('pasteur', 'evenements', 'w'),
  ('secretariat', 'enfants', 'r'), ('secretariat', 'rdv', 'w'), ('secretariat', 'evenements', 'w'),
  ('berger', 'priere', 'w'),
  ('tresorier', 'evenements', 'w'),
  ('intercession', 'priere', 'w'),
  ('moniteur', 'enfants', 'w'),
  ('membre', 'priere', 'w')
on conflict (role_code, menu) do update set acces = excluded.acces;

-- ---------------------------------------------------------------- Requêtes de prière

create table priere (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  date date not null default current_date,
  demandeur text,
  contact text,
  visibilite text not null default 'Équipe d''intercession' check (visibilite in ('Confidentielle', 'Équipe d''intercession', 'Publique')),
  sujet text not null,
  statut text not null default 'Reçue' check (statut in ('Reçue', 'En prière', 'Exaucée')),
  temoignage text,
  auteur_id uuid default auth.uid(),
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid()
);
create trigger priere_touch before update on priere for each row execute function touch_auteur();

-- L'équipe qui voit tout : administrateur, pasteur, intercession.
create function equipe_priere() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(mon_role() in ('admin', 'pasteur', 'intercession'), false)
$$;
grant execute on function equipe_priere() to authenticated;

alter table priere enable row level security;
create policy lecture on priere for select to authenticated
  using (eglise_id = mon_eglise() and peut('priere', 'r')
         and (equipe_priere() or visibilite = 'Publique' or auteur_id = auth.uid()));
create policy depot on priere for insert to authenticated
  with check (eglise_id = mon_eglise() and peut('priere', 'w') and auteur_id = auth.uid());
create policy suivi on priere for update to authenticated
  using (eglise_id = mon_eglise() and peut('priere', 'w') and (equipe_priere() or auteur_id = auth.uid()))
  with check (eglise_id = mon_eglise() and peut('priere', 'w') and (equipe_priere() or auteur_id = auth.uid()));
create policy suppression on priere for delete to authenticated
  using (eglise_id = mon_eglise() and peut('priere', 'w') and (equipe_priere() or auteur_id = auth.uid()));

-- ---------------------------------------------------------------- Enfants

create table enfant (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  nom text not null,
  date_naissance date,
  groupe text check (groupe in ('0–3 ans', '4–6 ans', '7–9 ans', '10–12 ans', '13 ans et plus')),
  parent text not null,
  contact text,
  code text,          -- code de récupération remis au parent
  notes text,         -- allergies ou remarques
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid()
);

create table pointage_enfant (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  enfant_id uuid not null references enfant(id) on delete cascade,
  date date not null,
  arrivee boolean not null default false,
  sortie boolean not null default false,
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid(),
  unique (enfant_id, date)
);

create trigger enfant_touch before update on enfant for each row execute function touch_auteur();
alter table enfant enable row level security;
alter table pointage_enfant enable row level security;

create policy lecture on enfant for select to authenticated using (eglise_id = mon_eglise() and peut('enfants', 'r'));
create policy ecriture on enfant for all to authenticated
  using (eglise_id = mon_eglise() and peut('enfants', 'w')) with check (eglise_id = mon_eglise() and peut('enfants', 'w'));
create policy lecture on pointage_enfant for select to authenticated using (eglise_id = mon_eglise() and peut('enfants', 'r'));
create policy ecriture on pointage_enfant for all to authenticated
  using (eglise_id = mon_eglise() and peut('enfants', 'w')) with check (eglise_id = mon_eglise() and peut('enfants', 'w'));

-- Pointe l'arrivée ou la sortie d'un enfant (bascule). Un enfant ne sort que s'il est arrivé.
create function pointer_enfant(p_enfant uuid, p_date date, p_quoi text) returns void
language plpgsql security definer set search_path = public as $$
declare
  p pointage_enfant;
begin
  if not peut('enfants', 'w') then
    perform refuser('Vous n''avez pas le droit de faire cette action.');
  end if;
  if not exists (select 1 from enfant where id = p_enfant and eglise_id = mon_eglise()) then
    perform refuser('Enfant introuvable.');
  end if;
  select * into p from pointage_enfant where enfant_id = p_enfant and date = p_date;
  if p_quoi = 'arrivee' then
    if p.id is null then
      insert into pointage_enfant (eglise_id, enfant_id, date, arrivee) values (mon_eglise(), p_enfant, p_date, true);
    else
      update pointage_enfant set arrivee = not p.arrivee, sortie = case when p.arrivee then false else p.sortie end, maj_le = now(), maj_par = auth.uid() where id = p.id;
    end if;
  elsif p_quoi = 'sortie' then
    if p.id is null or not p.arrivee then
      perform refuser('Pointez d''abord l''arrivée de l''enfant.');
    end if;
    update pointage_enfant set sortie = not p.sortie, maj_le = now(), maj_par = auth.uid() where id = p.id;
  else
    perform refuser('Action inconnue.');
  end if;
end $$;

-- ---------------------------------------------------------------- Rendez-vous pastoraux

create table rdv (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  date date not null,
  heure text,
  personne text not null,
  contact text,
  type text not null default 'Bureau' check (type in ('Bureau', 'Visite à domicile', 'Visite à l''hôpital', 'Appel')),
  pasteur text,
  motif text,
  statut text not null default 'Prévu' check (statut in ('Prévu', 'Fait', 'Reporté', 'Annulé')),
  notes text,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid()
);
create trigger rdv_touch before update on rdv for each row execute function touch_auteur();
alter table rdv enable row level security;
create policy lecture on rdv for select to authenticated using (eglise_id = mon_eglise() and peut('rdv', 'r'));
create policy ecriture on rdv for all to authenticated
  using (eglise_id = mon_eglise() and peut('rdv', 'w')) with check (eglise_id = mon_eglise() and peut('rdv', 'w'));

-- ---------------------------------------------------------------- Événements : inscriptions et transport

create table inscription_evenement (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  evenement_id uuid not null references evenement(id) on delete cascade,
  nom text not null,
  contact text,
  montant bigint check (montant >= 0),     -- FCFA, entier
  canal text check (canal in ('Espèces', 'Orange Money', 'MTN MoMo', 'Moov Money', 'Wave', 'Virement', 'Chèque')),
  car text,
  depart text,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid()
);
create trigger inscription_evenement_touch before update on inscription_evenement for each row execute function touch_auteur();
alter table inscription_evenement enable row level security;
create policy lecture on inscription_evenement for select to authenticated using (eglise_id = mon_eglise() and peut('evenements', 'r'));
create policy ecriture on inscription_evenement for all to authenticated
  using (eglise_id = mon_eglise() and peut('evenements', 'w')) with check (eglise_id = mon_eglise() and peut('evenements', 'w'));

-- Le menu Événements lit les activités programmées, même sans accès au menu Programmation (trésorier).
drop policy lecture on evenement;
create policy lecture on evenement for select to authenticated
  using (eglise_id = mon_eglise() and (peut('agenda', 'r') or peut('evenements', 'r')));

revoke execute on function pointer_enfant(uuid, date, text), equipe_priere() from anon, public;
grant execute on function pointer_enfant(uuid, date, text) to authenticated;


-- ===== 20261123000001_lot5.sql =====
-- Lot 5 : Supervision, Statistiques, Objectifs à atteindre, Projets.
-- Les statistiques et les mesures automatiques des objectifs sont calculées par la base (chiffres agrégés, sans noms),
-- pour que le conseil ou le trésorier les voient sans lire le fichier des fidèles.

alter table role_menu drop constraint role_menu_menu_check;
alter table role_menu add constraint role_menu_menu_check
  check (menu in ('accueil', 'fideles', 'bergers', 'adnh', 'admin', 'cellules', 'gc', 'agenda', 'culte',
                  'formations', 'departements', 'reunions', 'organigramme',
                  'priere', 'enfants', 'rdv', 'evenements',
                  'pilotage', 'stats', 'objectifs', 'projets'));

-- Droits repris de l'artefact.
insert into role_menu (role_code, menu, acces) values
  ('admin', 'pilotage', 'w'), ('admin', 'stats', 'w'), ('admin', 'objectifs', 'w'), ('admin', 'projets', 'w'),
  ('pasteur', 'pilotage', 'w'), ('pasteur', 'stats', 'w'), ('pasteur', 'objectifs', 'r'), ('pasteur', 'projets', 'w'),
  ('secretariat', 'pilotage', 'r'), ('secretariat', 'stats', 'r'), ('secretariat', 'objectifs', 'r'), ('secretariat', 'projets', 'w'),
  ('conseil', 'pilotage', 'r'), ('conseil', 'stats', 'r'), ('conseil', 'objectifs', 'r'), ('conseil', 'projets', 'w'),
  ('resp_dep', 'pilotage', 'r'), ('resp_dep', 'objectifs', 'r'), ('resp_dep', 'projets', 'r'),
  ('tresorier', 'pilotage', 'r'), ('tresorier', 'stats', 'r'), ('tresorier', 'objectifs', 'r'), ('tresorier', 'projets', 'r')
on conflict (role_code, menu) do update set acces = excluded.acces;

-- ---------------------------------------------------------------- Supervision

-- Le menu Supervision lit les départements, leurs créneaux et leurs rapports (trésorier compris).
drop policy lecture on departement;
create policy lecture on departement for select to authenticated
  using (eglise_id = mon_eglise() and (peut('departements', 'r') or peut('pilotage', 'r')) and (not est_resp_dep() or id = mon_departement()));
drop policy lecture on planning_service;
create policy lecture on planning_service for select to authenticated
  using (eglise_id = mon_eglise() and (peut('departements', 'r') or peut('pilotage', 'r')) and (not est_resp_dep() or departement_id = mon_departement()));
drop policy lecture on rapport_departement;
create policy lecture on rapport_departement for select to authenticated
  using (eglise_id = mon_eglise() and (peut('departements', 'r') or peut('pilotage', 'r')) and (not est_resp_dep() or departement_id = mon_departement()));

-- Valider un rapport de département, ou le renvoyer « À revoir ».
create function statuer_rapport(p_rapport uuid, p_statut text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not peut('pilotage', 'w') then
    perform refuser('Vous n''avez pas le droit de faire cette action.');
  end if;
  if p_statut not in ('Soumis', 'Validé', 'À revoir') then
    perform refuser('Statut inconnu.');
  end if;
  update rapport_departement set statut = p_statut, maj_le = now(), maj_par = auth.uid()
   where id = p_rapport and eglise_id = mon_eglise();
  if not found then
    perform refuser('Rapport introuvable.');
  end if;
end $$;

-- ---------------------------------------------------------------- Objectifs à atteindre

create table objectif (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  libelle text not null,
  but text,
  mesure text not null default 'manuel' check (mesure in ('manuel', 'fideles', 'nouveaux', 'appeles', 'integres', 'presence',
                                                          'suivis', 'formation', 'valides', 'cellules', 'rapports')),
  cible bigint not null check (cible >= 0),
  realise bigint check (realise >= 0),     -- saisie manuelle uniquement
  date_debut date,
  date_fin date not null,
  departement_id text references departement(id) on delete set null,
  responsable text,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid(),
  check (date_debut is null or date_fin >= date_debut)
);
create trigger objectif_touch before update on objectif for each row execute function touch_auteur();
alter table objectif enable row level security;

-- Lecture : menus Objectifs ou Supervision. Un responsable de département voit les objectifs généraux et ceux du sien.
create policy lecture on objectif for select to authenticated
  using (eglise_id = mon_eglise() and (peut('objectifs', 'r') or peut('pilotage', 'r'))
         and (not est_resp_dep() or departement_id is null or departement_id = mon_departement()));
-- Écriture : les objectifs sont fixés par l'administrateur (seul à avoir le menu en modification).
create policy ecriture on objectif for all to authenticated
  using (eglise_id = mon_eglise() and peut('objectifs', 'w')) with check (eglise_id = mon_eglise() and peut('objectifs', 'w'));

-- Valeur d'une mesure automatique sur une période (bornes facultatives). Renvoie un chiffre, jamais de nom.
create function mesure_objectif(p_mesure text, p_debut date, p_fin date) returns bigint
language plpgsql stable security definer set search_path = public as $$
declare
  e uuid := mon_eglise();
  a date := coalesce(p_debut, '0001-01-01');
  b date := coalesce(p_fin, '9999-12-31');
  v bigint;
begin
  if not (peut('objectifs', 'r') or peut('pilotage', 'r')) then
    return null;
  end if;
  case p_mesure
    when 'fideles' then select count(*) into v from fidele where eglise_id = e;
    when 'nouveaux' then select count(*) into v from nouveau where eglise_id = e and date_venue between a and b;
    when 'appeles' then select count(*) into v from nouveau n where eglise_id = e and date_venue between a and b
                          and exists (select 1 from appel x where x.nouveau_id = n.id);
    when 'integres' then select count(*) into v from nouveau where eglise_id = e and date_venue between a and b and statut = 'intégré';
    when 'presence' then select coalesce(round(avg(coalesce(hommes, 0) + coalesce(femmes, 0) + coalesce(enfants, 0))), 0) into v
                          from comptage where eglise_id = e and date between a and b;
    when 'suivis' then select count(*) into v from fidele where eglise_id = e and berger_id is not null;
    when 'formation' then select count(*) into v from fidele where eglise_id = e and classe is not null;
    when 'valides' then select count(*) into v from inscription_formation i join session_formation s on s.id = i.session_id
                          where s.eglise_id = e and s.date_fin between a and b and i.valide;
    when 'cellules' then select count(*) into v from cellule where eglise_id = e;
    when 'rapports' then select count(*) into v from rapport_cellule where eglise_id = e and date between a and b;
    else v := null;
  end case;
  return v;
end $$;

-- Objectifs avec leur résultat et leur statut. La vue respecte les règles d'accès de la table objectif.
create view objectif_suivi with (security_invoker = true) as
select o.*, r.valeur,
       case when o.cible > 0 and r.valeur >= o.cible then 'Atteint'
            when o.date_fin < current_date then 'Non atteint'
            else 'En cours' end as statut
  from objectif o
  cross join lateral (select case when o.mesure = 'manuel' then coalesce(o.realise, 0)
                                  else coalesce(mesure_objectif(o.mesure, o.date_debut, o.date_fin), 0) end as valeur) r;
grant select on objectif_suivi to authenticated;

-- ---------------------------------------------------------------- Projets

create table projet (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  nom text not null,
  description text,
  responsable text not null,
  departement_id text references departement(id) on delete set null,
  date_debut date not null,
  echeance date not null,
  priorite text not null default 'Moyenne' check (priorite in ('Haute', 'Moyenne', 'Basse')),
  statut text not null default 'À lancer' check (statut in ('À lancer', 'En cours', 'En pause', 'Terminé')),
  budget bigint check (budget >= 0),     -- FCFA, entier
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid(),
  check (echeance >= date_debut)
);

create table projet_action (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  projet_id uuid not null references projet(id) on delete cascade,
  titre text not null,
  responsable text,
  echeance date,
  statut text not null default 'À faire' check (statut in ('À faire', 'En cours', 'Fait')),
  notes text,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid()
);
create index projet_action_projet_idx on projet_action(projet_id);

create table projet_journal (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  projet_id uuid not null references projet(id) on delete cascade,
  date date not null default current_date,
  type text not null default 'Note' check (type in ('Note', 'Décision', 'Difficulté', 'Réunion')),
  texte text not null,
  auteur_id uuid default auth.uid(),
  cree_le timestamptz not null default now()
);
create index projet_journal_projet_idx on projet_journal(projet_id);

create trigger projet_touch before update on projet for each row execute function touch_auteur();
create trigger projet_action_touch before update on projet_action for each row execute function touch_auteur();
alter table projet enable row level security;
alter table projet_action enable row level security;
alter table projet_journal enable row level security;

create policy lecture on projet for select to authenticated using (eglise_id = mon_eglise() and peut('projets', 'r'));
create policy ecriture on projet for all to authenticated
  using (eglise_id = mon_eglise() and peut('projets', 'w')) with check (eglise_id = mon_eglise() and peut('projets', 'w'));
create policy lecture on projet_action for select to authenticated using (eglise_id = mon_eglise() and peut('projets', 'r'));
create policy ecriture on projet_action for all to authenticated
  using (eglise_id = mon_eglise() and peut('projets', 'w')) with check (eglise_id = mon_eglise() and peut('projets', 'w'));
create policy lecture on projet_journal for select to authenticated using (eglise_id = mon_eglise() and peut('projets', 'r'));
-- Le journal ne se réécrit pas : on ajoute, et l'auteur peut retirer sa propre note.
create policy ajout on projet_journal for insert to authenticated
  with check (eglise_id = mon_eglise() and peut('projets', 'w') and auteur_id = auth.uid());
create policy retrait on projet_journal for delete to authenticated
  using (eglise_id = mon_eglise() and peut('projets', 'w') and (auteur_id = auth.uid() or peut('admin', 'w')));

-- ---------------------------------------------------------------- Statistiques

-- Tous les indicateurs du menu Statistiques en un appel. Chiffres agrégés uniquement (aucun contact, aucun nom de fidèle).
create function statistiques(p_jour date default current_date) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  e uuid := mon_eglise();
  v_annee text := to_char(p_jour, 'YYYY');
  v_mois text := to_char(p_jour, 'YYYY-MM');
  v_semaine text := to_char(p_jour, 'IYYY-"W"IW');
  r jsonb;
begin
  if not peut('stats', 'r') then
    perform refuser('Vous n''avez pas le droit de voir les statistiques.');
  end if;

  with m as (
    select to_char(d, 'YYYY-MM') as mois from generate_series(date_trunc('month', p_jour) - interval '11 months', date_trunc('month', p_jour), interval '1 month') d
  ), s as (
    select to_char(p_jour - 7 * i, 'IYYY-"W"IW') as semaine, 7 - i as ordre from generate_series(0, 7) i
  )
  select jsonb_build_object(
    'croissance', jsonb_build_object(
      'fideles', (select count(*) from fidele where eglise_id = e),
      'presence4', (select round(avg(t)) from (select coalesce(hommes, 0) + coalesce(femmes, 0) + coalesce(enfants, 0) as t
                     from comptage where eglise_id = e and date <= p_jour order by date desc limit 4) x),
      'nouveauxAnnee', (select count(*) from nouveau where eglise_id = e and to_char(date_venue, 'YYYY') = v_annee),
      'nouveauxMois', (select count(*) from nouveau where eglise_id = e and to_char(date_venue, 'YYYY-MM') = v_mois),
      'nouveauxParMois', (select jsonb_agg(jsonb_build_array(m.mois, (select count(*) from nouveau where eglise_id = e and to_char(date_venue, 'YYYY-MM') = m.mois)) order by m.mois) from m),
      'presenceParMois', (select jsonb_agg(jsonb_build_array(m.mois, coalesce((select round(avg(coalesce(hommes, 0) + coalesce(femmes, 0) + coalesce(enfants, 0)))
                            from comptage where eglise_id = e and to_char(date, 'YYYY-MM') = m.mois), 0)) order by m.mois) from m),
      'parStatut', (select coalesce(jsonb_agg(jsonb_build_array(statut, c) order by c desc), '[]') from (select statut, count(*) c from fidele where eglise_id = e group by statut) x),
      'parCommune', (select coalesce(jsonb_agg(jsonb_build_array(commune, c) order by c desc, commune), '[]') from (select commune, count(*) c from fidele where eglise_id = e and coalesce(commune, '') <> '' group by commune order by c desc, commune limit 10) x)
    ),
    'integration', jsonb_build_object(
      'nouveaux', (select count(*) from nouveau where eglise_id = e),
      'integres', (select count(*) from nouveau where eglise_id = e and statut = 'intégré'),
      'jamaisAppeles', (select count(*) from nouveau n where eglise_id = e and statut <> 'intégré' and not exists (select 1 from appel a where a.nouveau_id = n.id)),
      'bergers', (select count(*) from berger where eglise_id = e),
      'releves', (select count(*) from releve_absence where eglise_id = e and semaine = v_semaine),
      'semaine', v_semaine,
      'sansBerger', (select count(*) from fidele where eglise_id = e and berger_id is null),
      'integresParMois', (select jsonb_agg(jsonb_build_array(m.mois, (select count(*) from nouveau where eglise_id = e and statut = 'intégré' and to_char(date_venue, 'YYYY-MM') = m.mois)) order by m.mois) from m),
      'absencesParSemaine', (select jsonb_agg(jsonb_build_array(s.semaine, (select count(*) from absence a join releve_absence r on r.id = a.releve_id
                              where r.eglise_id = e and r.semaine = s.semaine)) order by s.ordre) from s),
      'presenceGc', (select coalesce(jsonb_agg(jsonb_build_array(g.nom, coalesce(t.taux, 0)) order by g.ordre), '[]') from gc g
                     left join lateral (select round(100.0 * p.presents / nullif(p.presents + (select count(*) from gc_absence ga where ga.presence_id = p.id), 0)) as taux
                                          from gc_presence p where p.gc_id = g.id order by p.date desc limit 1) t on true
                     where g.eglise_id = e),
      'brebisParBerger', (select coalesce(jsonb_agg(jsonb_build_array(trim(b.nom || ' ' || coalesce(b.prenoms, '')), (select count(*) from fidele f where f.berger_id = b.id))), '[]')
                          from berger b where b.eglise_id = e)
    ),
    'formations', jsonb_build_object(
      'enFormation', (select count(*) from fidele where eglise_id = e and classe is not null),
      'sessionsEnCours', (select count(*) from session_formation where eglise_id = e and date_debut <= p_jour and date_fin >= p_jour),
      'valides', (select count(*) from inscription_formation i join session_formation s on s.id = i.session_id where s.eglise_id = e and i.valide),
      'absences', (select coalesce(sum(i.absences), 0) from inscription_formation i join session_formation s on s.id = i.session_id where s.eglise_id = e),
      'parClasse', (select coalesce(jsonb_agg(jsonb_build_array('Classe ' || c.numero || ' : ' || c.nom, (select count(*) from fidele f where f.eglise_id = e and f.classe = c.numero)) order by c.numero), '[]')
                    from classe c where c.eglise_id = e),
      'sessions', (select coalesce(jsonb_agg(jsonb_build_object('classe', s.classe, 'nomClasse', c.nom, 'debut', s.date_debut, 'fin', s.date_fin,
                     'inscrits', (select count(*) from inscription_formation i where i.session_id = s.id),
                     'valides', (select count(*) from inscription_formation i where i.session_id = s.id and i.valide),
                     'absences', (select coalesce(sum(absences), 0) from inscription_formation i where i.session_id = s.id)) order by s.date_debut desc), '[]')
                   from session_formation s left join classe c on c.eglise_id = s.eglise_id and c.numero = s.classe where s.eglise_id = e)
    )
  ) into r;
  return r;
end $$;

revoke execute on function statuer_rapport(uuid, text), mesure_objectif(text, date, date), statistiques(date) from anon, public;
grant execute on function statuer_rapport(uuid, text), mesure_objectif(text, date, date), statistiques(date) to authenticated;


-- ===== 20261124000001_lot6.sql =====
-- Lot 6 : Dîmes et offrandes, Budget et dépenses, Communication, Patrimoine.
-- Règle des quatre yeux appliquée par la base : la personne qui saisit un encaissement ou une dépense ne peut pas le valider.

alter table role_menu drop constraint role_menu_menu_check;
alter table role_menu add constraint role_menu_menu_check
  check (menu in ('accueil', 'fideles', 'bergers', 'adnh', 'admin', 'cellules', 'gc', 'agenda', 'culte',
                  'formations', 'departements', 'reunions', 'organigramme',
                  'priere', 'enfants', 'rdv', 'evenements',
                  'pilotage', 'stats', 'objectifs', 'projets',
                  'dons', 'budget', 'communication', 'patrimoine'));

-- Droits repris de l'artefact.
insert into role_menu (role_code, menu, acces) values
  ('admin', 'dons', 'w'), ('admin', 'budget', 'w'), ('admin', 'communication', 'w'), ('admin', 'patrimoine', 'w'),
  ('pasteur', 'dons', 'r'), ('pasteur', 'budget', 'r'), ('pasteur', 'communication', 'w'), ('pasteur', 'patrimoine', 'w'),
  ('secretariat', 'communication', 'w'), ('secretariat', 'patrimoine', 'r'),
  ('conseil', 'dons', 'r'), ('conseil', 'budget', 'r'),
  ('berger', 'communication', 'r'),
  ('resp_dep', 'patrimoine', 'r'),
  ('tresorier', 'dons', 'w'), ('tresorier', 'budget', 'w'), ('tresorier', 'patrimoine', 'w'),
  ('membre', 'communication', 'r')
on conflict (role_code, menu) do update set acces = excluded.acces;

-- ---------------------------------------------------------------- Dîmes et offrandes

create table fonds (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  nom text not null,
  type text not null default 'Fonds permanent' check (type in ('Fonds permanent', 'Campagne')),
  objectif bigint check (objectif >= 0),     -- FCFA, entier
  fin date,
  description text,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid()
);

create table don (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  date date not null,
  fonds_id uuid not null references fonds(id) on delete restrict,
  montant bigint not null check (montant > 0),     -- FCFA, entier
  canal text not null default 'Espèces' check (canal in ('Espèces', 'Orange Money', 'MTN MoMo', 'Moov Money', 'Wave', 'Virement', 'Chèque')),
  fidele_id uuid references fidele(id) on delete set null,     -- vide : collecte
  reference text,
  statut text not null default 'Saisi' check (statut in ('Saisi', 'Validé')),
  notes text,
  cree_par uuid default auth.uid(),
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid()
);
create index don_date_idx on don(date);
create index don_fidele_idx on don(fidele_id);

-- ---------------------------------------------------------------- Budget et dépenses

create table ligne_budget (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  annee int not null check (annee between 2000 and 2100),
  poste text not null,
  departement_id text references departement(id) on delete set null,
  montant bigint not null check (montant >= 0),
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid()
);

create table depense (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  date date not null,
  objet text not null,
  montant bigint not null check (montant > 0),
  ligne_budget_id uuid references ligne_budget(id) on delete set null,
  projet_id uuid references projet(id) on delete set null,
  demandeur text,
  beneficiaire text,
  canal text check (canal in ('Espèces', 'Orange Money', 'MTN MoMo', 'Moov Money', 'Wave', 'Virement', 'Chèque')),
  statut text not null default 'Demandée' check (statut in ('Demandée', 'Validée', 'Payée', 'Refusée')),
  notes text,
  cree_par uuid default auth.uid(),
  valide_par uuid,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid()
);
create index depense_date_idx on depense(date);
create index depense_projet_idx on depense(projet_id);

-- Quatre yeux : un encaissement est saisi puis validé par une autre personne ;
-- une dépense est demandée, puis validée (ou refusée) par une autre personne que celle qui l'a saisie.
create function controle_quatre_yeux() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return new;     -- données de test chargées par l'installation
  end if;
  if tg_table_name = 'don' then
    if tg_op = 'INSERT' and new.statut <> 'Saisi' then
      perform refuser('Un encaissement est d''abord saisi, puis validé par une autre personne.');
    end if;
    if tg_op = 'UPDATE' then
      new.cree_par := old.cree_par;
      if new.statut = 'Validé' and old.statut <> 'Validé' and old.cree_par = auth.uid() then
        perform refuser('La validation doit être faite par une autre personne que celle qui a saisi l''encaissement.');
      end if;
    end if;
  else
    if tg_op = 'INSERT' and new.statut <> 'Demandée' then
      perform refuser('Une dépense est d''abord demandée, puis validée par une autre personne.');
    end if;
    if tg_op = 'UPDATE' then
      new.cree_par := old.cree_par;
      new.valide_par := old.valide_par;
      if new.statut <> old.statut and old.statut = 'Demandée' and new.statut in ('Validée', 'Payée', 'Refusée') then
        if old.cree_par = auth.uid() then
          perform refuser('La personne qui a saisi la dépense ne peut pas la valider ni la refuser.');
        end if;
        new.valide_par := auth.uid();
      end if;
    end if;
  end if;
  return new;
end $$;

create trigger don_quatre_yeux before insert or update on don for each row execute function controle_quatre_yeux();
create trigger depense_quatre_yeux before insert or update on depense for each row execute function controle_quatre_yeux();
create trigger fonds_touch before update on fonds for each row execute function touch_auteur();
create trigger don_touch before update on don for each row execute function touch_auteur();
create trigger ligne_budget_touch before update on ligne_budget for each row execute function touch_auteur();
create trigger depense_touch before update on depense for each row execute function touch_auteur();

alter table fonds enable row level security;
alter table don enable row level security;
alter table ligne_budget enable row level security;
alter table depense enable row level security;

create policy lecture on fonds for select to authenticated using (eglise_id = mon_eglise() and peut('dons', 'r'));
create policy ecriture on fonds for all to authenticated
  using (eglise_id = mon_eglise() and peut('dons', 'w')) with check (eglise_id = mon_eglise() and peut('dons', 'w'));
create policy lecture on don for select to authenticated using (eglise_id = mon_eglise() and peut('dons', 'r'));
create policy ecriture on don for all to authenticated
  using (eglise_id = mon_eglise() and peut('dons', 'w')) with check (eglise_id = mon_eglise() and peut('dons', 'w'));
create policy lecture on ligne_budget for select to authenticated using (eglise_id = mon_eglise() and peut('budget', 'r'));
create policy ecriture on ligne_budget for all to authenticated
  using (eglise_id = mon_eglise() and peut('budget', 'w')) with check (eglise_id = mon_eglise() and peut('budget', 'w'));
create policy lecture on depense for select to authenticated using (eglise_id = mon_eglise() and peut('budget', 'r'));
create policy ecriture on depense for all to authenticated
  using (eglise_id = mon_eglise() and peut('budget', 'w')) with check (eglise_id = mon_eglise() and peut('budget', 'w'));

-- Dépenses validées ou payées par projet (montants seulement), pour le menu Projets sans accès au budget.
create function depenses_projets() returns table (projet_id uuid, depense bigint)
language sql stable security definer set search_path = public as $$
  select d.projet_id, sum(d.montant)::bigint from depense d
   where d.eglise_id = mon_eglise() and d.projet_id is not null and d.statut in ('Validée', 'Payée') and peut('projets', 'r')
   group by d.projet_id
$$;

-- ---------------------------------------------------------------- Communication

create table annonce (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  titre text not null,
  date date not null default current_date,
  jusquau date,
  texte text not null,
  publie boolean not null default true,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid(),
  check (jusquau is null or jusquau >= date)
);
create trigger annonce_touch before update on annonce for each row execute function touch_auteur();
alter table annonce enable row level security;
-- Les annonces publiées s'affichent sur l'Accueil de tout compte actif ; les brouillons, à ceux qui gèrent la communication.
create policy lecture on annonce for select to authenticated
  using (eglise_id = mon_eglise() and ((publie and peut('accueil', 'r')) or peut('communication', 'w')));
create policy ecriture on annonce for all to authenticated
  using (eglise_id = mon_eglise() and peut('communication', 'w')) with check (eglise_id = mon_eglise() and peut('communication', 'w'));

-- ---------------------------------------------------------------- Patrimoine

create table article (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  article text not null,
  categorie text check (categorie in ('Sono et instruments', 'Mobilier', 'Informatique', 'Véhicule', 'Bâtiment', 'Autre')),
  quantite int not null default 1 check (quantite >= 0),
  affectation text,
  etat text not null default 'Bon' check (etat in ('Bon', 'À réparer', 'Hors service')),
  valeur bigint check (valeur >= 0),
  date_achat date,
  notes text,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid()
);

create table entretien (
  id uuid primary key default gen_random_uuid(),
  eglise_id uuid not null default mon_eglise() references eglise(id),
  date date not null,
  article_id uuid not null references article(id) on delete cascade,
  intervention text not null,
  prestataire text,
  cout bigint check (cout >= 0),
  prochaine date,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  maj_par uuid default auth.uid()
);
create trigger article_touch before update on article for each row execute function touch_auteur();
create trigger entretien_touch before update on entretien for each row execute function touch_auteur();
alter table article enable row level security;
alter table entretien enable row level security;
create policy lecture on article for select to authenticated using (eglise_id = mon_eglise() and peut('patrimoine', 'r'));
create policy ecriture on article for all to authenticated
  using (eglise_id = mon_eglise() and peut('patrimoine', 'w')) with check (eglise_id = mon_eglise() and peut('patrimoine', 'w'));
create policy lecture on entretien for select to authenticated using (eglise_id = mon_eglise() and peut('patrimoine', 'r'));
create policy ecriture on entretien for all to authenticated
  using (eglise_id = mon_eglise() and peut('patrimoine', 'w')) with check (eglise_id = mon_eglise() and peut('patrimoine', 'w'));

-- ---------------------------------------------------------------- Objectifs : mesure « montant encaissé »

alter table objectif drop constraint objectif_mesure_check;
alter table objectif add constraint objectif_mesure_check
  check (mesure in ('manuel', 'fideles', 'nouveaux', 'appeles', 'integres', 'presence', 'suivis', 'formation', 'valides', 'cellules', 'rapports', 'dons'));

create or replace function mesure_objectif(p_mesure text, p_debut date, p_fin date) returns bigint
language plpgsql stable security definer set search_path = public as $$
declare
  e uuid := mon_eglise();
  a date := coalesce(p_debut, '0001-01-01');
  b date := coalesce(p_fin, '9999-12-31');
  v bigint;
begin
  if not (peut('objectifs', 'r') or peut('pilotage', 'r')) then
    return null;
  end if;
  case p_mesure
    when 'fideles' then select count(*) into v from fidele where eglise_id = e;
    when 'nouveaux' then select count(*) into v from nouveau where eglise_id = e and date_venue between a and b;
    when 'appeles' then select count(*) into v from nouveau n where eglise_id = e and date_venue between a and b
                          and exists (select 1 from appel x where x.nouveau_id = n.id);
    when 'integres' then select count(*) into v from nouveau where eglise_id = e and date_venue between a and b and statut = 'intégré';
    when 'presence' then select coalesce(round(avg(coalesce(hommes, 0) + coalesce(femmes, 0) + coalesce(enfants, 0))), 0) into v
                          from comptage where eglise_id = e and date between a and b;
    when 'suivis' then select count(*) into v from fidele where eglise_id = e and berger_id is not null;
    when 'formation' then select count(*) into v from fidele where eglise_id = e and classe is not null;
    when 'valides' then select count(*) into v from inscription_formation i join session_formation s on s.id = i.session_id
                          where s.eglise_id = e and s.date_fin between a and b and i.valide;
    when 'cellules' then select count(*) into v from cellule where eglise_id = e;
    when 'rapports' then select count(*) into v from rapport_cellule where eglise_id = e and date between a and b;
    when 'dons' then select coalesce(sum(montant), 0) into v from don where eglise_id = e and date between a and b;
    else v := null;
  end case;
  return v;
end $$;

-- ---------------------------------------------------------------- Statistiques › Finances

-- Indicateurs financiers agrégés : réservés à qui a le menu Statistiques ET le menu Dîmes et offrandes.
create function statistiques_finances(p_jour date default current_date) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  e uuid := mon_eglise();
  v_annee text := to_char(p_jour, 'YYYY');
  r jsonb;
begin
  if not (peut('stats', 'r') and peut('dons', 'r')) then
    perform refuser('Vous n''avez pas le droit de voir les statistiques financières.');
  end if;
  with m as (
    select to_char(d, 'YYYY-MM') as mois from generate_series(date_trunc('month', p_jour) - interval '11 months', date_trunc('month', p_jour), interval '1 month') d
  )
  select jsonb_build_object(
    'encaisse', (select coalesce(sum(montant), 0) from don where eglise_id = e and to_char(date, 'YYYY') = v_annee),
    'depense', (select coalesce(sum(montant), 0) from depense where eglise_id = e and to_char(date, 'YYYY') = v_annee and statut in ('Validée', 'Payée')),
    'mobileMoney', (select coalesce(sum(montant), 0) from don where eglise_id = e and to_char(date, 'YYYY') = v_annee and canal in ('Orange Money', 'MTN MoMo', 'Moov Money', 'Wave')),
    'encaissementsParMois', (select jsonb_agg(jsonb_build_array(m.mois, (select coalesce(sum(montant), 0) from don where eglise_id = e and to_char(date, 'YYYY-MM') = m.mois)) order by m.mois) from m),
    'depensesParMois', (select jsonb_agg(jsonb_build_array(m.mois, (select coalesce(sum(montant), 0) from depense where eglise_id = e and to_char(date, 'YYYY-MM') = m.mois and statut in ('Validée', 'Payée'))) order by m.mois) from m),
    'parFonds', (select coalesce(jsonb_agg(jsonb_build_array(f.nom, t) order by t desc), '[]') from (select fonds_id, sum(montant) t from don where eglise_id = e and to_char(date, 'YYYY') = v_annee group by fonds_id) x join fonds f on f.id = x.fonds_id),
    'parCanal', (select coalesce(jsonb_agg(jsonb_build_array(canal, t) order by t desc), '[]') from (select canal, sum(montant) t from don where eglise_id = e and to_char(date, 'YYYY') = v_annee group by canal) x)
  ) into r;
  return r;
end $$;

revoke execute on function controle_quatre_yeux(), depenses_projets(), statistiques_finances(date) from anon, public;
grant execute on function depenses_projets(), statistiques_finances(date) to authenticated;


-- ===== 20261126000001_lot7.sql =====
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


-- ===== 20261127000001_lot8.sql =====
-- Lot 8 : Recommandations (règles automatiques) et Rapports (complet ou partiel, PDF).
-- Les recommandations sont calculées par l'application à partir d'un résumé chiffré fourni par la base :
-- le conseil y a accès sans pouvoir lire le fichier des fidèles. Aucun nom de fidèle ni numéro n'y figure.

alter table role_menu drop constraint role_menu_menu_check;
alter table role_menu add constraint role_menu_menu_check
  check (menu in ('accueil', 'fideles', 'bergers', 'adnh', 'admin', 'cellules', 'gc', 'agenda', 'culte',
                  'formations', 'departements', 'reunions', 'organigramme',
                  'priere', 'enfants', 'rdv', 'evenements',
                  'pilotage', 'stats', 'objectifs', 'projets',
                  'dons', 'budget', 'communication', 'patrimoine',
                  'evangelisation', 'ceremonies',
                  'reco', 'rapports'));

-- Droits repris de l'artefact.
insert into role_menu (role_code, menu, acces) values
  ('admin', 'reco', 'w'), ('admin', 'rapports', 'w'),
  ('pasteur', 'reco', 'w'), ('pasteur', 'rapports', 'w'),
  ('secretariat', 'rapports', 'r'),
  ('conseil', 'reco', 'r'), ('conseil', 'rapports', 'r'),
  ('tresorier', 'rapports', 'r')
on conflict (role_code, menu) do update set acces = excluded.acces;

-- Résumé chiffré pour les recommandations. Les noms de cellules, de tâches et de projets y figurent (pas de fidèles).
-- La partie finances n'est remplie que pour qui lit les dîmes ou le budget.
create function donnees_recommandations(p_jour date default current_date) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  e uuid := mon_eglise();
  v_mois text := to_char(p_jour, 'YYYY-MM');
  v_semaine text := to_char(p_jour, 'IYYY-"W"IW');
  fin jsonb := null;
begin
  if not peut('reco', 'r') then
    perform refuser('Vous n''avez pas le droit de voir les recommandations.');
  end if;
  if peut('dons', 'r') or peut('budget', 'r') then
    select jsonb_build_object(
      'encaisseMois', (select coalesce(sum(montant), 0) from don where eglise_id = e and to_char(date, 'YYYY-MM') = v_mois),
      'moyenne3Mois', (select coalesce(sum(montant), 0) / 3.0 from don where eglise_id = e
                         and date >= date_trunc('month', p_jour) - interval '3 months' and date < date_trunc('month', p_jour)),
      'encaisseAnnee', (select coalesce(sum(montant), 0) from don where eglise_id = e and to_char(date, 'YYYY') = to_char(p_jour, 'YYYY')),
      'mobileAnnee', (select coalesce(sum(montant), 0) from don where eglise_id = e and to_char(date, 'YYYY') = to_char(p_jour, 'YYYY')
                        and canal in ('Orange Money', 'MTN MoMo', 'Moov Money', 'Wave')),
      'donsAnnee', (select count(*) from don where eglise_id = e and to_char(date, 'YYYY') = to_char(p_jour, 'YYYY')),
      'donsNonValides', (select count(*) from don where eglise_id = e and statut <> 'Validé'),
      'depensesEnAttente', (select count(*) from depense where eglise_id = e and statut = 'Demandée' and date <= p_jour - 7),
      'lignesDepassees', (select count(*) from ligne_budget l where l.eglise_id = e
                            and (select coalesce(sum(d.montant), 0) from depense d where d.ligne_budget_id = l.id and d.statut in ('Validée', 'Payée')) > l.montant)
    ) into fin;
  end if;
  return jsonb_build_object(
    'jour', p_jour,
    'presence', (select jsonb_build_object(
        'recents', coalesce(avg(t) filter (where rang <= 4), 0), 'nbRecents', count(*) filter (where rang <= 4),
        'precedents', coalesce(avg(t) filter (where rang between 5 and 8), 0), 'nbPrecedents', count(*) filter (where rang between 5 and 8),
        'total', count(*))
      from (select coalesce(hommes, 0) + coalesce(femmes, 0) + coalesce(enfants, 0) as t, row_number() over (order by date desc) as rang
              from comptage where eglise_id = e and date <= p_jour) c),
    'nouveaux', (select count(*) from nouveau where eglise_id = e),
    'integres', (select count(*) from nouveau where eglise_id = e and statut = 'intégré'),
    'jamaisAppeles72h', (select count(*) from nouveau n where eglise_id = e and statut <> 'intégré' and date_venue <= p_jour - 3
                           and not exists (select 1 from appel a where a.nouveau_id = n.id)),
    'injoignables', (select count(*) from nouveau n where eglise_id = e and statut <> 'intégré'
                       and (select count(*) from appel a where a.nouveau_id = n.id and a.resultat in ('Pas de réponse', 'Numéro erroné')) >= 2),
    'bergers', (select count(*) from berger where eglise_id = e),
    'relevesSemaine', (select count(*) from releve_absence where eglise_id = e and semaine = v_semaine),
    'semaine', v_semaine,
    'sansBerger', (select count(*) from fidele where eglise_id = e and berger_id is null),
    'bergersSurcharges', (select count(*) from berger b where eglise_id = e and (select count(*) from fidele f where f.berger_id = b.id) > 15),
    'cellulesSansRapport', (select coalesce(jsonb_agg(nom order by nom), '[]') from cellule c where eglise_id = e
                              and not exists (select 1 from rapport_cellule r where r.cellule_id = c.id and r.date >= p_jour - 14)),
    'departements', (select count(*) from departement where eglise_id = e),
    'departementsSansRapport', (select count(*) from departement d where eglise_id = e
                                  and not exists (select 1 from rapport_departement r where r.departement_id = d.id and r.periode = v_mois)),
    'departementsVides', (select count(*) from departement where eglise_id = e and cardinality(membres) = 0),
    'inscritsAbsents', (select count(*) from inscription_formation i join session_formation s on s.id = i.session_id
                          where s.eglise_id = e and s.date_fin >= p_jour and i.absences >= 3),
    'tachesEnRetard', (select coalesce(jsonb_agg(titre order by echeance), '[]') from tache where eglise_id = e and statut <> 'Terminée' and echeance < p_jour),
    'actionsEnRetard', (select count(*) from projet_action a join projet p on p.id = a.projet_id where p.eglise_id = e and a.statut <> 'Fait' and a.echeance < p_jour),
    'projets', (select coalesce(jsonb_agg(jsonb_build_object(
        'nom', p.nom, 'statut', p.statut, 'echeance', p.echeance, 'budget', p.budget,
        'depense', (select coalesce(sum(d.montant), 0) from depense d where d.projet_id = p.id and d.statut in ('Validée', 'Payée')),
        'actions', (select count(*) from projet_action a where a.projet_id = p.id),
        'faites', (select count(*) from projet_action a where a.projet_id = p.id and a.statut = 'Fait')) order by p.echeance), '[]')
      from projet p where p.eglise_id = e),
    'gcIncomplets', (select count(*) from gc where eglise_id = e and (tribu is null or (select count(*) from unnest(responsables) r where trim(r) <> '') < 5)),
    'articlesAReparer', (select count(*) from article where eglise_id = e and etat = 'À réparer'),
    'entretiensDepasses', (select count(*) from entretien where eglise_id = e and prochaine < p_jour),
    'objectifs', (select coalesce(jsonb_agg(jsonb_build_object(
        'libelle', libelle, 'mesure', mesure, 'cible', cible, 'valeur', valeur, 'debut', date_debut, 'fin', date_fin, 'statut', statut) order by date_fin), '[]')
      from objectif_suivi where eglise_id = e),
    'finances', fin
  );
end $$;

revoke execute on function donnees_recommandations(date) from anon, public;
grant execute on function donnees_recommandations(date) to authenticated;


-- ===== seed.sql (données FICTIVES) =====
-- Données FICTIVES de test, générées par scripts/seed.mjs. Ne pas y saisir de vraies personnes.

insert into berger (id, eglise_id, nom, prenoms, contact) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Koffi', 'Jean-Marc', '+225 07 00 00 00 01'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Yao', 'Christelle', '+225 07 00 00 00 02'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Bamba', 'Ismaël', '+225 07 00 00 00 03'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'N''Guessan', 'Ruth', '+225 07 00 00 00 04');

insert into fidele (id, eglise_id, nom, prenoms, sexe, date_naissance, telephone, commune, quartier, statut, berger_id, gc_id, classe, notes, origine) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Kouamé', 'Esther', 'Femme', '1977-04-26', '+225 07 00 00 00 05', 'Plateau', 'Akouédo', 'Responsable', '10000000-0000-0000-0000-000000000001', 'gc09', 1, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Assi', 'Ismaël', 'Homme', '1976-05-09', '+225 07 00 00 00 06', 'Bingerville', 'Riviera', 'Responsable', '10000000-0000-0000-0000-000000000001', 'gc02', 1, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Koffi', 'Franck', 'Homme', '1984-10-07', '+225 07 00 00 00 07', 'Koumassi', 'Akouédo', 'Ouvrier', '10000000-0000-0000-0000-000000000001', 'gc08', 1, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Aka', 'Nadège', 'Femme', '1964-07-09', '+225 07 00 00 00 08', 'Adjamé', 'Zone 4', 'Ouvrier', '10000000-0000-0000-0000-000000000001', 'gc11', 1, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Kouassi', 'Prisca', 'Femme', '1995-06-20', '+225 07 00 00 00 09', 'Marcory', 'Zone 4', 'Membre', '10000000-0000-0000-0000-000000000001', 'gc09', 1, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Assi', 'Franck', 'Homme', '2001-11-02', '+225 07 00 00 00 10', 'Cocody', 'Akouédo', 'Membre', '10000000-0000-0000-0000-000000000001', 'gc02', 3, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Ehouman', 'Arnaud', 'Homme', '1995-02-03', '+225 07 00 00 00 11', 'Abobo', 'Sogefiha', 'Ouvrier', '10000000-0000-0000-0000-000000000001', 'gc10', 4, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Kouamé', 'Christelle', 'Femme', '1995-11-19', '+225 07 00 00 00 12', 'Abobo', 'Zone 4', 'Ouvrier', '10000000-0000-0000-0000-000000000001', 'gc01', 3, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Konan', 'Ruth', 'Femme', '2005-06-04', '+225 07 00 00 00 13', 'Abobo', 'Zone 4', 'Ouvrier', '10000000-0000-0000-0000-000000000001', 'gc07', 2, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Touré', 'Franck', 'Homme', '1967-01-19', '+225 07 00 00 00 14', 'Bingerville', 'Angré', 'Ouvrier', '10000000-0000-0000-0000-000000000001', 'gc03', 2, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Bamba', 'Mariam', 'Femme', '1978-02-02', '+225 07 00 00 00 15', 'Koumassi', 'Riviera', 'Membre', '10000000-0000-0000-0000-000000000001', 'gc04', 4, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Konan', 'Grâce', 'Femme', '2006-02-23', '+225 07 00 00 00 16', 'Adjamé', 'Angré', 'Membre', '10000000-0000-0000-0000-000000000001', 'gc10', 4, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Diomandé', 'Prisca', 'Femme', '1981-02-28', '+225 07 00 00 00 17', 'Abobo', 'Riviera', 'Membre', '10000000-0000-0000-0000-000000000002', 'gc03', 2, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'Gnagne', 'Christelle', 'Femme', '1969-01-26', '+225 07 00 00 00 18', 'Abobo', 'Belleville', 'Membre', '10000000-0000-0000-0000-000000000002', 'gc04', 2, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', 'Bamba', 'Mariam', 'Femme', '1961-04-13', '+225 07 00 00 00 19', 'Koumassi', 'Akouédo', 'Membre', '10000000-0000-0000-0000-000000000002', 'gc06', 1, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', 'Kouamé', 'Ismaël', 'Homme', '2006-12-18', '+225 07 00 00 00 20', 'Yopougon', 'Abobo-Gare', 'Membre', '10000000-0000-0000-0000-000000000002', 'gc07', 1, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', 'Assi', 'Christelle', 'Femme', '1982-06-07', '+225 07 00 00 00 21', 'Port-Bouët', 'Williamsville', 'Membre', '10000000-0000-0000-0000-000000000002', 'gc07', 3, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001', 'Coulibaly', 'Patricia', 'Femme', '1962-12-10', '+225 07 00 00 00 22', 'Plateau', 'Akouédo', 'Ouvrier', '10000000-0000-0000-0000-000000000002', 'gc03', 4, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000001', 'Coulibaly', 'Patricia', 'Femme', '1966-06-19', '+225 07 00 00 00 23', 'Cocody', 'Riviera', 'Membre', '10000000-0000-0000-0000-000000000002', 'gc04', 3, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'Touré', 'Serge', 'Homme', '1968-12-03', '+225 07 00 00 00 24', 'Plateau', 'Sogefiha', 'Membre', '10000000-0000-0000-0000-000000000002', 'gc08', 4, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'Yao', 'Christelle', 'Femme', '1964-11-14', '+225 07 00 00 00 25', 'Treichville', 'Niangon', 'Responsable', '10000000-0000-0000-0000-000000000002', 'gc11', 3, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', 'Ehouman', 'Aïcha', 'Femme', '2006-05-05', '+225 07 00 00 00 26', 'Treichville', 'Zone 4', 'Membre', '10000000-0000-0000-0000-000000000002', 'gc01', 4, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', 'Kouassi', 'Serge', 'Homme', '1968-02-27', '+225 07 00 00 00 27', 'Cocody', 'Williamsville', 'Responsable', '10000000-0000-0000-0000-000000000003', 'gc01', 2, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', 'Brou', 'Franck', 'Homme', '1968-02-26', '+225 07 00 00 00 28', 'Bingerville', 'Belleville', 'Responsable', '10000000-0000-0000-0000-000000000003', 'gc09', 4, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000001', 'Assi', 'Aïcha', 'Femme', '1989-11-15', '+225 07 00 00 00 29', 'Marcory', 'Williamsville', 'Membre', '10000000-0000-0000-0000-000000000003', 'gc06', 1, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000001', 'Ehouman', 'Esther', 'Femme', '2007-06-08', '+225 07 00 00 00 30', 'Yopougon', 'Akouédo', 'Membre', '10000000-0000-0000-0000-000000000003', 'gc04', 4, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000001', 'Diomandé', 'Prisca', 'Femme', '1977-08-21', '+225 07 00 00 00 31', 'Abobo', 'Sogefiha', 'Membre', '10000000-0000-0000-0000-000000000003', 'gc09', 4, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000001', 'N''Guessan', 'Hervé', 'Homme', '1995-08-07', '+225 07 00 00 00 32', 'Marcory', 'Vridi', 'Membre', '10000000-0000-0000-0000-000000000003', 'gc03', 2, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000000001', 'Gnagne', 'Ange', 'Homme', '1995-03-02', '+225 07 00 00 00 33', 'Yopougon', 'Williamsville', 'Membre', '10000000-0000-0000-0000-000000000004', 'gc02', 2, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', 'Traoré', 'Aïcha', 'Femme', '1996-05-28', '+225 07 00 00 00 34', 'Port-Bouët', 'Williamsville', 'Responsable', '10000000-0000-0000-0000-000000000004', 'gc02', 2, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000001', 'Coulibaly', 'Jean', 'Homme', '1984-12-02', '+225 07 00 00 00 35', 'Marcory', 'Vridi', 'Responsable', '10000000-0000-0000-0000-000000000004', 'gc08', 1, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001', 'Koné', 'Didier', 'Homme', '2006-11-23', '+225 07 00 00 00 36', 'Port-Bouët', 'Riviera', 'Membre', '10000000-0000-0000-0000-000000000004', 'gc06', 4, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000001', 'Yao', 'Yannick', 'Homme', '1965-01-05', '+225 07 00 00 00 45', 'Yopougon', 'Riviera', 'Nouveau', null, 'gc03', 2, 'Fiche fictive de test', 'ADNH'),
  ('20000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000001', 'Kouassi', 'Ange', 'Femme', '1970-05-22', '+225 07 00 00 00 46', 'Abobo', 'Akouédo', 'Nouveau', null, 'gc07', 2, 'Fiche fictive de test', 'ADNH'),
  ('20000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000001', 'Gnagne', 'Ismaël', 'Homme', '1988-06-07', '+225 07 00 00 00 47', 'Adjamé', 'Akouédo', 'Nouveau', null, 'gc11', 2, 'Fiche fictive de test', 'ADNH'),
  ('20000000-0000-0000-0000-000000000036', '00000000-0000-0000-0000-000000000001', 'Bamba', 'Jean', 'Homme', '1960-11-02', '+225 07 00 00 00 40', 'Abobo', 'Zone 4', 'Responsable', null, 'gc10', 2, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000037', '00000000-0000-0000-0000-000000000001', 'Konan', 'Nadège', 'Femme', '1980-09-10', '+225 07 00 00 00 41', 'Port-Bouët', 'Zone 4', 'Responsable', null, 'gc11', 4, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000038', '00000000-0000-0000-0000-000000000001', 'Koné', 'Arnaud', 'Homme', '1976-10-04', '+225 07 00 00 00 42', 'Treichville', 'Riviera', 'Membre', null, 'gc11', 2, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000039', '00000000-0000-0000-0000-000000000001', 'Kouamé', 'Mariam', 'Femme', '1989-04-20', '+225 07 00 00 00 43', 'Adjamé', 'Sogefiha', 'Membre', null, 'gc10', 4, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000001', 'Zadi', 'Jean', 'Homme', '1963-07-25', '+225 07 00 00 00 44', 'Marcory', 'Niangon', 'Membre', null, 'gc11', 4, 'Fiche fictive de test', null);

insert into nouveau (id, eglise_id, date_venue, nom, contact, commune, origine, statut, gc_id, classe, fidele_id) values
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-08-02', 'Yao Yannick', '+225 07 00 00 00 45', 'Yopougon', 'Culte du dimanche', 'intégré', 'gc03', 2, '20000000-0000-0000-0000-000000000033'),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2026-08-07', 'Kouassi Ange', '+225 07 00 00 00 46', 'Abobo', 'Culte du dimanche', 'intégré', 'gc07', 2, '20000000-0000-0000-0000-000000000034'),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '2026-08-12', 'Gnagne Ismaël', '+225 07 00 00 00 47', 'Adjamé', 'Culte du dimanche', 'intégré', 'gc11', 2, '20000000-0000-0000-0000-000000000035'),
  ('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '2026-09-17', 'Kouassi Serge', '+225 07 00 00 00 48', 'Port-Bouët', 'Culte du dimanche', 'en suivi', null, null, null),
  ('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '2026-09-05', 'Coulibaly Prisca', '+225 07 00 00 00 49', 'Bingerville', 'Culte du dimanche', 'en suivi', null, null, null),
  ('30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '2026-09-10', 'Aka Jean', '+225 07 00 00 00 50', 'Yopougon', 'Culte du dimanche', 'en suivi', null, null, null),
  ('30000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '2026-10-15', 'Gnagne Christelle', '+225 07 00 00 00 51', 'Port-Bouët', 'Culte du dimanche', 'en suivi', null, null, null),
  ('30000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '2026-10-03', 'Koné Christelle', '+225 07 00 00 00 52', 'Marcory', 'Culte du dimanche', 'en suivi', null, null, null),
  ('30000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', '2026-10-08', 'Ouattara Hervé', '+225 07 00 00 00 53', 'Bingerville', 'Culte du dimanche', 'en suivi', null, null, null),
  ('30000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '2026-11-13', 'N''Guessan Jean', '+225 07 00 00 00 54', 'Plateau', 'Culte du dimanche', 'en suivi', null, null, null);

insert into appel (id, eglise_id, nouveau_id, date, resultat, note) values
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '2026-08-04', 'Joint', 'A confirmé sa venue au culte.'),
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '2026-08-09', 'Joint', 'A confirmé sa venue au culte.'),
  ('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', '2026-08-14', 'Joint', 'A confirmé sa venue au culte.'),
  ('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', '2026-09-19', 'Pas de réponse', 'À rappeler en semaine.'),
  ('40000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', '2026-09-07', 'Rappeler plus tard', 'À rappeler en semaine.');

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

-- Données FICTIVES du lot 3 (formations, départements, réunions, organigramme).

insert into session_formation (id, eglise_id, classe, date_debut, date_fin, formateur, lieu) values
  ('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1, '2026-09-07', '2026-12-13', 'Formateur Ouattara', 'Salle de formation'),
  ('60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 2, '2027-01-11', '2027-04-18', 'Formateur Aka', 'Salle de formation'),
  ('60000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 3, '2026-03-02', '2026-06-14', 'Formateur Ouattara', 'Salle de formation');

insert into inscription_formation (id, session_id, fidele_id, absences, valide) values
  ('61000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 0, false),
  ('61000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 1, false),
  ('61000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 2, false),
  ('61000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 1, false),
  ('61000000-0000-0000-0000-000000000005', '60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 2, false),
  ('61000000-0000-0000-0000-000000000006', '60000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000009', 2, false),
  ('61000000-0000-0000-0000-000000000007', '60000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000010', 0, false),
  ('61000000-0000-0000-0000-000000000008', '60000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000013', 2, false),
  ('61000000-0000-0000-0000-000000000009', '60000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000014', 2, false),
  ('61000000-0000-0000-0000-000000000010', '60000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000023', 0, false),
  ('61000000-0000-0000-0000-000000000011', '60000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000006', 0, true),
  ('61000000-0000-0000-0000-000000000012', '60000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000008', 1, true),
  ('61000000-0000-0000-0000-000000000013', '60000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000017', 0, true),
  ('61000000-0000-0000-0000-000000000014', '60000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000019', 2, true),
  ('61000000-0000-0000-0000-000000000015', '60000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000021', 0, false);

update departement set responsable = 'Koffi Mariam', contact = '+225 07 00 00 00 59', jour = 'Mardi soir', membres = array['Kouassi Serge', 'Bamba Didier', 'Koffi Serge', 'Diomandé Fabrice'] where id = 'd01';
update departement set responsable = 'Koffi Arnaud', contact = '+225 07 00 00 00 60', jour = 'Mardi soir', membres = array['Gnagne Hervé', 'Kouadio Serge', 'Kouadio Ismaël', 'Traoré Ange'] where id = 'd02';
update departement set responsable = 'Bamba Didier', contact = '+225 07 00 00 00 61', jour = 'Mardi soir', membres = array['Ouattara Ismaël', 'Assi Ange'] where id = 'd03';
update departement set responsable = 'Kouamé Yannick', contact = '+225 07 00 00 00 62', jour = 'Samedi matin', membres = array['Koffi Hervé', 'Ehouman Franck', 'Kouadio Hervé', 'Traoré Jean', 'Aka Serge'] where id = 'd04';
update departement set responsable = 'Traoré Ruth', contact = '+225 07 00 00 00 63', jour = 'Jeudi soir', membres = array['Koné Jean', 'Gnagne Mariam', 'Kouamé Yannick', 'Konan Marie', 'Zadi Ruth'] where id = 'd05';
update departement set responsable = 'Konan Franck', contact = '+225 07 00 00 00 64', jour = 'Mardi soir', membres = array['Kouadio Mariam', 'Koffi Fabrice', 'Ehouman Patricia', 'Koné Grâce', 'Ouattara Mariam'] where id = 'd06';
update departement set responsable = 'Zadi Grâce', contact = '+225 07 00 00 00 65', jour = 'Jeudi soir', membres = array['Koffi Fabrice', 'Aka Ange', 'Gnagne Ange', 'Assi Marie'] where id = 'd07';
update departement set responsable = 'Kouassi Fabrice', contact = '+225 07 00 00 00 66', jour = 'Mardi soir', membres = array['Aka Ruth', 'Kouadio Serge', 'Kouassi Patricia'] where id = 'd08';
update departement set responsable = 'Aka Ruth', contact = '+225 07 00 00 00 67', jour = 'Mardi soir', membres = array['Assi Aïcha', 'Bamba Jean', 'Gnagne Aïcha'] where id = 'd09';
update departement set responsable = 'Gnagne Patricia', contact = '+225 07 00 00 00 68', jour = 'Samedi matin', membres = array['Zadi Yannick', 'Zadi Fabrice', 'Zadi Fabrice', 'Koffi Ruth', 'Kouadio Didier'] where id = 'd10';
update departement set responsable = 'Brou Aïcha', contact = '+225 07 00 00 00 69', jour = 'Samedi matin', membres = array['N''Guessan Nadège', 'Yao Ruth'] where id = 'd11';
update departement set responsable = 'Kouadio Mariam', contact = '+225 07 00 00 00 70', jour = 'Samedi matin', membres = array['Ouattara Arnaud', 'Zadi Ange', 'Konan Christelle', 'Assi Fabrice'] where id = 'd12';

insert into planning_service (id, eglise_id, date, activite, departement_id, poste, personne, contact, confirme) values
  ('62000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-11-22', 'Culte du dimanche', 'd01', 'Entrée principale', 'Koffi Franck', '+225 07 00 00 00 71', true),
  ('62000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2026-11-22', 'Culte du dimanche', 'd04', 'Caméra 1', 'Assi Patricia', '+225 07 00 00 00 72', true),
  ('62000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '2026-11-22', 'Culte du dimanche', 'd05', 'Console son', 'N''Guessan Esther', '+225 07 00 00 00 73', false),
  ('62000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '2026-11-29', 'Culte du dimanche', 'd01', 'Placement', 'Traoré Nadège', '+225 07 00 00 00 74', true),
  ('62000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '2026-11-29', 'Culte du dimanche', 'd07', 'Chant', 'Yao Didier', '+225 07 00 00 00 75', true),
  ('62000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '2026-11-29', 'Culte du dimanche', 'd08', 'Classe des 6-9 ans', 'Assi Jean', '+225 07 00 00 00 76', false);

insert into rapport_departement (id, eglise_id, departement_id, periode, activites, resultats, difficultes, effectif, statut) values
  ('63000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'd04', '2026-10', 'Service assuré à chaque culte du mois.', 'Équipe au complet trois dimanches sur quatre.', 'Besoin de deux volontaires supplémentaires.', 6, 'Validé'),
  ('63000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'd04', '2026-11', 'Service assuré à chaque culte du mois.', 'Équipe au complet trois dimanches sur quatre.', 'Besoin de deux volontaires supplémentaires.', 5, 'Soumis'),
  ('63000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'd07', '2026-11', 'Service assuré à chaque culte du mois.', 'Équipe au complet trois dimanches sur quatre.', 'Besoin de deux volontaires supplémentaires.', 11, 'Soumis'),
  ('63000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'd08', '2026-10', 'Service assuré à chaque culte du mois.', 'Équipe au complet trois dimanches sur quatre.', 'Besoin de deux volontaires supplémentaires.', 6, 'À revoir');

insert into reunion (id, eglise_id, date, instance, assemblee_id, lieu, objet, presents, discussions, decisions) values
  ('64000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-09-08', 'Conseil', '54000000-0000-0000-0000-000000000001', 'Bureau pastoral', 'Rentrée des cellules', 'Membres du conseil (fictifs)', 'Calendrier de rentrée
Répartition des bergers', 'Rentrée des cellules le 6 septembre'),
  ('64000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2026-10-13', 'Responsables', '54000000-0000-0000-0000-000000000001', 'Bureau pastoral', 'Préparation de la convention 2027', 'Membres du conseil (fictifs)', 'Lieu et budget
Transport des participants', 'Réserver la salle avant fin novembre
Frais d''inscription fixés à 5 000 FCFA'),
  ('64000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '2026-11-10', 'Conseil', '54000000-0000-0000-0000-000000000001', 'Bureau pastoral', 'Budget 2027', 'Membres du conseil (fictifs)', 'Prévisions de dépenses
Travaux du temple', 'Adopter le budget en décembre'),
  ('64000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '2026-11-17', 'Pasteurs', '54000000-0000-0000-0000-000000000001', 'Bureau pastoral', 'Suivi des nouveaux', 'Membres du conseil (fictifs)', 'Taux d''intégration
Appels non faits', 'Appeler chaque nouveau dans la semaine');

insert into tache (id, eglise_id, titre, responsable, echeance, statut, reunion_id) values
  ('65000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Réserver la salle de la convention', 'Aka Ruth', '2026-11-30', 'En cours', '64000000-0000-0000-0000-000000000002'),
  ('65000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Publier les frais d''inscription', 'Kouadio Fabrice', '2026-11-15', 'À faire', '64000000-0000-0000-0000-000000000002'),
  ('65000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Préparer le projet de budget', 'Kouassi Grâce', '2026-12-05', 'En cours', '64000000-0000-0000-0000-000000000003'),
  ('65000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Obtenir les devis des travaux', 'N''Guessan Yannick', '2026-11-12', 'À faire', '64000000-0000-0000-0000-000000000003'),
  ('65000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Envoyer la liste des nouveaux aux bergers', 'Brou Prisca', '2026-11-20', 'Terminée', '64000000-0000-0000-0000-000000000004'),
  ('65000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Former deux nouveaux bergers', 'Traoré Patricia', '2026-10-30', 'Terminée', '64000000-0000-0000-0000-000000000001');

insert into responsable (id, eglise_id, fonction, nom, contact, whatsapp, niveau, ordre) values
  ('66000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Pasteur principal', 'Konan Fabrice', '+225 07 00 00 00 77', '+225 07 00 00 00 77', 'Direction', 1),
  ('66000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Pasteur adjoint', 'Ehouman Hervé', '+225 07 00 00 00 78', '+225 07 00 00 00 78', 'Pasteurs', 2),
  ('66000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Pasteur des jeunes', 'Coulibaly Franck', '+225 07 00 00 00 79', '+225 07 00 00 00 79', 'Pasteurs', 3),
  ('66000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Ancien', 'Koné Nadège', '+225 07 00 00 00 80', '+225 07 00 00 00 80', 'Conseil', 4),
  ('66000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Ancien', 'Koffi Fabrice', '+225 07 00 00 00 81', '+225 07 00 00 00 81', 'Conseil', 5),
  ('66000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Secrétaire du conseil', 'Ouattara Aïcha', '+225 07 00 00 00 82', '+225 07 00 00 00 82', 'Conseil', 6),
  ('66000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Responsable de la louange', 'Assi Serge', '+225 07 00 00 00 83', '+225 07 00 00 00 83', 'Responsables de ministère', 7),
  ('66000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Responsable de l''ADNH', 'N''Guessan Fabrice', '+225 07 00 00 00 84', '+225 07 00 00 00 84', 'Responsables de ministère', 8);

-- Données FICTIVES du lot 4 (requêtes de prière, enfants, rendez-vous pastoraux, événements).

insert into priere (id, eglise_id, date, demandeur, visibilite, sujet, statut, temoignage) values
  ('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-11-02', 'Diomandé Didier', 'Publique', 'Pour la convention de janvier.', 'En prière', null),
  ('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2026-11-05', 'Yao Arnaud', 'Équipe d''intercession', 'Pour un travail stable.', 'Reçue', null),
  ('70000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '2026-11-08', 'Gnagne Grâce', 'Confidentielle', 'Situation familiale difficile.', 'En prière', null),
  ('70000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '2026-11-09', 'Gnagne Fabrice', 'Publique', 'Pour la santé de ma mère.', 'Exaucée', 'Ma mère est sortie de l''hôpital, gloire à Dieu.'),
  ('70000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '2026-11-12', 'Ouattara Didier', 'Équipe d''intercession', 'Pour la réussite aux examens.', 'Reçue', null),
  ('70000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '2026-11-15', 'Bamba Yannick', 'Confidentielle', 'Décision importante à prendre.', 'Reçue', null),
  ('70000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '2026-10-20', 'Koné Yannick', 'Publique', 'Pour un logement.', 'Exaucée', 'Nous avons trouvé un logement à Cocody.'),
  ('70000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '2026-11-17', 'Assi Grâce', 'Publique', 'Pour les nouveaux de l''église.', 'En prière', null);

insert into enfant (id, eglise_id, nom, groupe, parent, contact, code, notes) values
  ('71000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Bamba Arnaud', '0–3 ans', 'Touré Mariam', '+225 07 00 00 00 85', 'JJXX', 'Fiche fictive de test'),
  ('71000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Koné Hervé', '4–6 ans', 'Ouattara Ange', '+225 07 00 00 00 86', 'R8X8', 'Fiche fictive de test'),
  ('71000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Ehouman Esther', '7–9 ans', 'Konan Nadège', '+225 07 00 00 00 87', 'SZ5X', 'Fiche fictive de test'),
  ('71000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Konan Christelle', '10–12 ans', 'Traoré Aïcha', '+225 07 00 00 00 88', 'AQN7', 'Fiche fictive de test'),
  ('71000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'N''Guessan Christelle', '13 ans et plus', 'Konan Grâce', '+225 07 00 00 00 89', 'E2WF', 'Fiche fictive de test'),
  ('71000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Zadi Serge', '0–3 ans', 'Coulibaly Arnaud', '+225 07 00 00 00 90', 'LYT8', 'Fiche fictive de test'),
  ('71000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'N''Guessan Nadège', '4–6 ans', 'Ouattara Ange', '+225 07 00 00 00 91', 'XHMJ', 'Fiche fictive de test'),
  ('71000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'N''Guessan Hervé', '7–9 ans', 'Aka Ange', '+225 07 00 00 00 92', '2BE2', 'Fiche fictive de test'),
  ('71000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Ehouman Ismaël', '10–12 ans', 'Bamba Franck', '+225 07 00 00 00 93', 'ZJ2J', 'Fiche fictive de test'),
  ('71000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Kouamé Esther', '13 ans et plus', 'Ehouman Esther', '+225 07 00 00 00 94', 'ZAZT', 'Fiche fictive de test');

insert into pointage_enfant (id, eglise_id, enfant_id, date, arrivee, sortie) values
  ('72000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', '2026-11-15', true, true),
  ('72000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000002', '2026-11-15', true, true),
  ('72000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000003', '2026-11-15', true, true),
  ('72000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000004', '2026-11-15', true, true),
  ('72000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000005', '2026-11-15', true, true),
  ('72000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000006', '2026-11-15', true, false),
  ('72000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000007', '2026-11-15', true, false);

insert into rdv (id, eglise_id, date, heure, personne, contact, type, pasteur, motif, statut) values
  ('73000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-11-10', '10:00', 'Famille Diomandé', '+225 07 00 00 00 95', 'Bureau', 'Pasteur Bamba', 'Conseil conjugal', 'Fait'),
  ('73000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2026-11-13', '10:00', 'Famille Diomandé', '+225 07 00 00 00 96', 'Visite à l''hôpital', 'Pasteur Kouamé', 'Visite après une opération', 'Fait'),
  ('73000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '2026-11-18', '10:00', 'Famille Kouadio', '+225 07 00 00 00 97', 'Visite à domicile', 'Pasteur Assi', 'Présentation d''un nouveau-né', 'Reporté'),
  ('73000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '2026-11-26', '10:00', 'Famille Konan', '+225 07 00 00 00 98', 'Bureau', 'Pasteur Coulibaly', 'Préparation au mariage', 'Prévu'),
  ('73000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '2026-11-28', '10:00', 'Famille Aka', '+225 07 00 00 00 99', 'Appel', 'Pasteur Gnagne', 'Suivi d''un nouveau', 'Prévu'),
  ('73000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '2026-12-03', '10:00', 'Famille Yao', '+225 07 00 00 01 00', 'Visite à domicile', 'Pasteur Kouadio', 'Visite de soutien', 'Prévu');

insert into evenement (id, eglise_id, titre, type, assemblee_id, date, date_fin, heure, lieu, responsable, frais, description) values
  ('55000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', 'Convention annuelle 2027', 'Convention', '54000000-0000-0000-0000-000000000001', '2027-01-15', '2027-01-17', '08:30', 'Esplanade du temple', 'Pasteur Touré', 5000, 'Activité fictive de test');

insert into inscription_evenement (id, eglise_id, evenement_id, nom, contact, montant, canal, car, depart) values
  ('74000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-000000000015', 'Yao Ruth', '+225 07 00 00 01 01', 5000, 'Orange Money', 'Car 1', 'Cocody'),
  ('74000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-000000000015', 'Gnagne Franck', '+225 07 00 00 01 02', 5000, 'Espèces', 'Car 2', 'Yopougon'),
  ('74000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-000000000015', 'Touré Nadège', '+225 07 00 00 01 03', 5000, 'Wave', 'Car 1', 'Cocody'),
  ('74000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-000000000015', 'Koné Ange', '+225 07 00 00 01 04', 2000, 'MTN MoMo', 'Car 2', 'Yopougon'),
  ('74000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-000000000015', 'Koffi Ange', '+225 07 00 00 01 05', 5000, 'Orange Money', 'Car 1', 'Cocody'),
  ('74000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-000000000015', 'Kouassi Mariam', '+225 07 00 00 01 06', 5000, 'Wave', 'Car 2', 'Yopougon'),
  ('74000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-000000000015', 'Kouassi Yannick', '+225 07 00 00 01 07', 5000, 'Espèces', 'Car 1', 'Cocody'),
  ('74000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-000000000015', 'Koné Arnaud', '+225 07 00 00 01 08', 2000, 'Espèces', 'Car 2', 'Yopougon'),
  ('74000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-000000000015', 'Diomandé Grâce', '+225 07 00 00 01 09', 5000, 'Orange Money', 'Car 1', 'Cocody'),
  ('74000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-000000000015', 'Zadi Grâce', '+225 07 00 00 01 10', 5000, 'Espèces', 'Car 2', 'Yopougon'),
  ('74000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-000000000015', 'Touré Prisca', '+225 07 00 00 01 11', 5000, 'Wave', 'Car 1', 'Cocody'),
  ('74000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-000000000015', 'Zadi Hervé', '+225 07 00 00 01 12', 2000, 'Espèces', 'Car 2', 'Yopougon');

-- Données FICTIVES du lot 5 (objectifs, projets).

insert into objectif (id, eglise_id, libelle, but, mesure, cible, realise, date_debut, date_fin, departement_id, responsable) values
  ('75000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Accueillir 40 nouveaux venus en 2026', 'Faire grandir l''église par l''accueil.', 'nouveaux', 40, null, '2026-01-01', '2026-12-31', null, 'Responsable Aka'),
  ('75000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Intégrer la moitié des nouveaux', 'Que chaque nouveau trouve sa place.', 'integres', 5, null, '2026-01-01', '2026-12-31', null, 'Responsable Gnagne'),
  ('75000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Confier chaque fidèle à un berger', 'Aucun fidèle sans suivi.', 'suivis', 40, null, '2026-01-01', '2026-12-31', null, 'Responsable Ehouman'),
  ('75000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Six cellules actives', 'Couvrir les communes d''Abidjan.', 'cellules', 6, null, '2026-01-01', '2026-12-31', null, 'Responsable Aka'),
  ('75000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Former 8 opérateurs caméra', 'Assurer la diffusion des cultes.', 'manuel', 8, 5, '2026-01-01', '2026-12-31', 'd04', 'Responsable Aka'),
  ('75000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Deux nouveaux chants par mois', 'Renouveler la louange.', 'manuel', 12, 12, '2026-06-01', '2026-11-30', 'd07', 'Responsable Gnagne'),
  ('75000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Présence moyenne de 350 au 1er semestre', 'Mesurer la fidélité aux cultes.', 'presence', 350, null, '2026-01-01', '2026-06-30', null, 'Responsable Ouattara');

insert into projet (id, eglise_id, nom, description, departement_id, date_debut, echeance, priorite, statut, budget, responsable) values
  ('76000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Réfection de la toiture du temple', 'Remplacer les tôles abîmées avant la saison des pluies.', 'd06', '2026-10-01', '2027-03-31', 'Haute', 'En cours', 4500000, 'Frère Brou'),
  ('76000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Convention annuelle 2027', 'Organisation, hébergement et transport des participants.', null, '2026-09-15', '2027-01-17', 'Haute', 'En cours', 3000000, 'Frère Assi'),
  ('76000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Équipement de la régie vidéo', 'Deuxième caméra et ordinateur de diffusion.', 'd04', '2026-11-01', '2027-02-28', 'Moyenne', 'À lancer', 1800000, 'Frère Brou'),
  ('76000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Rentrée de l''école du dimanche', 'Nouveaux supports et formation des moniteurs.', 'd08', '2026-08-01', '2026-10-15', 'Basse', 'Terminé', 350000, 'Frère Bamba');

insert into projet_action (id, eglise_id, projet_id, titre, echeance, statut, responsable) values
  ('77000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000001', 'Obtenir trois devis', '2026-11-10', 'Fait', 'Ouattara Franck'),
  ('77000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000001', 'Choisir l''entreprise', '2026-11-18', 'En cours', 'Brou Didier'),
  ('77000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000001', 'Collecte spéciale pour la toiture', '2026-11-23', 'À faire', 'N''Guessan Jean'),
  ('77000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000001', 'Début des travaux', '2027-01-12', 'À faire', 'Konan Ruth'),
  ('77000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000002', 'Réserver l''esplanade', '2026-10-01', 'Fait', 'Traoré Ruth'),
  ('77000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000002', 'Louer les cars', '2026-11-27', 'À faire', 'Traoré Serge'),
  ('77000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000002', 'Ouvrir les inscriptions', '2026-11-05', 'Fait', 'Ehouman Patricia'),
  ('77000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000002', 'Programme des orateurs', '2026-12-15', 'À faire', 'Brou Fabrice'),
  ('77000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000003', 'Comparer les caméras', '2026-11-20', 'À faire', 'Ehouman Fabrice'),
  ('77000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000003', 'Présenter le budget au conseil', '2026-12-05', 'À faire', 'Konan Christelle'),
  ('77000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000004', 'Commander les supports', '2026-08-20', 'Fait', 'Aka Patricia'),
  ('77000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000004', 'Former les moniteurs', '2026-09-26', 'Fait', 'Ouattara Patricia');

insert into projet_journal (id, eglise_id, projet_id, date, type, texte) values
  ('78000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000001', '2026-10-05', 'Décision', 'Le conseil valide le lancement du projet.'),
  ('78000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000001', '2026-11-12', 'Difficulté', 'Un devis dépasse le budget prévu de 15 %.'),
  ('78000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000002', '2026-11-05', 'Note', 'Les inscriptions sont ouvertes.'),
  ('78000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000004', '2026-10-15', 'Note', 'Projet terminé dans les temps.');

-- Données FICTIVES du lot 6 (finances, communication, patrimoine).

insert into fonds (id, eglise_id, nom, type, objectif, fin, description) values
  ('80000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Dîmes', 'Fonds permanent', null, null, 'Fonds fictif de test'),
  ('80000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Offrandes', 'Fonds permanent', null, null, 'Fonds fictif de test'),
  ('80000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Construction du temple', 'Campagne', 15000000, '2027-06-30', 'Fonds fictif de test'),
  ('80000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Missions', 'Fonds permanent', null, null, 'Fonds fictif de test');

insert into don (id, eglise_id, date, fonds_id, montant, canal, fidele_id, reference, statut) values
  ('81000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2025-12-03', '80000000-0000-0000-0000-000000000002', 164000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2025-12-03', '80000000-0000-0000-0000-000000000003', 25000, 'Orange Money', null, 'TX000002', 'Validé'),
  ('81000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '2025-12-10', '80000000-0000-0000-0000-000000000002', 206000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '2025-12-10', '80000000-0000-0000-0000-000000000003', 38000, 'Wave', null, 'TX000004', 'Validé'),
  ('81000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '2025-12-17', '80000000-0000-0000-0000-000000000002', 229000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '2025-12-17', '80000000-0000-0000-0000-000000000003', 45000, 'MTN MoMo', null, 'TX000006', 'Validé'),
  ('81000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '2025-12-24', '80000000-0000-0000-0000-000000000002', 205000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '2025-12-24', '80000000-0000-0000-0000-000000000003', 67000, 'MTN MoMo', null, 'TX000008', 'Validé'),
  ('81000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', '2025-12-05', '80000000-0000-0000-0000-000000000001', 15000, 'Moov Money', '20000000-0000-0000-0000-000000000015', 'TX000009', 'Validé'),
  ('81000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '2025-12-10', '80000000-0000-0000-0000-000000000001', 26000, 'MTN MoMo', '20000000-0000-0000-0000-000000000027', 'TX000010', 'Validé'),
  ('81000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '2025-12-15', '80000000-0000-0000-0000-000000000001', 38000, 'MTN MoMo', '20000000-0000-0000-0000-000000000010', 'TX000011', 'Validé'),
  ('81000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '2025-12-20', '80000000-0000-0000-0000-000000000001', 15000, 'Espèces', '20000000-0000-0000-0000-000000000033', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', '2026-01-03', '80000000-0000-0000-0000-000000000002', 153000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', '2026-01-03', '80000000-0000-0000-0000-000000000003', 41000, 'Wave', null, 'TX000014', 'Validé'),
  ('81000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', '2026-01-10', '80000000-0000-0000-0000-000000000002', 191000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', '2026-01-17', '80000000-0000-0000-0000-000000000002', 217000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', '2026-01-17', '80000000-0000-0000-0000-000000000003', 66000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001', '2026-01-24', '80000000-0000-0000-0000-000000000002', 204000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000001', '2026-01-05', '80000000-0000-0000-0000-000000000001', 21000, 'Espèces', '20000000-0000-0000-0000-000000000013', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', '2026-01-10', '80000000-0000-0000-0000-000000000001', 30000, 'Espèces', '20000000-0000-0000-0000-000000000025', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', '2026-01-15', '80000000-0000-0000-0000-000000000001', 27000, 'Espèces', '20000000-0000-0000-0000-000000000008', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', '2026-01-20', '80000000-0000-0000-0000-000000000001', 17000, 'Wave', '20000000-0000-0000-0000-000000000016', 'TX000022', 'Validé'),
  ('81000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', '2026-02-03', '80000000-0000-0000-0000-000000000002', 154000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', '2026-02-10', '80000000-0000-0000-0000-000000000002', 161000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000001', '2026-02-10', '80000000-0000-0000-0000-000000000003', 44000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000001', '2026-02-17', '80000000-0000-0000-0000-000000000002', 193000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000001', '2026-02-17', '80000000-0000-0000-0000-000000000003', 71000, 'Moov Money', null, 'TX000027', 'Validé'),
  ('81000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000001', '2026-02-24', '80000000-0000-0000-0000-000000000002', 160000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000000001', '2026-02-05', '80000000-0000-0000-0000-000000000001', 46000, 'MTN MoMo', '20000000-0000-0000-0000-000000000011', 'TX000029', 'Validé'),
  ('81000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', '2026-02-10', '80000000-0000-0000-0000-000000000001', 48000, 'Moov Money', '20000000-0000-0000-0000-000000000013', 'TX000030', 'Validé'),
  ('81000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000001', '2026-02-15', '80000000-0000-0000-0000-000000000001', 36000, 'Espèces', '20000000-0000-0000-0000-000000000034', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001', '2026-02-20', '80000000-0000-0000-0000-000000000001', 37000, 'Orange Money', '20000000-0000-0000-0000-000000000011', 'TX000032', 'Validé'),
  ('81000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000001', '2026-02-15', '80000000-0000-0000-0000-000000000004', 50000, 'Virement', null, 'TX000033', 'Validé'),
  ('81000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000001', '2026-03-03', '80000000-0000-0000-0000-000000000002', 220000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000001', '2026-03-10', '80000000-0000-0000-0000-000000000002', 187000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000036', '00000000-0000-0000-0000-000000000001', '2026-03-10', '80000000-0000-0000-0000-000000000003', 55000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000037', '00000000-0000-0000-0000-000000000001', '2026-03-17', '80000000-0000-0000-0000-000000000002', 198000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000038', '00000000-0000-0000-0000-000000000001', '2026-03-24', '80000000-0000-0000-0000-000000000002', 226000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000039', '00000000-0000-0000-0000-000000000001', '2026-03-24', '80000000-0000-0000-0000-000000000003', 71000, 'MTN MoMo', null, 'TX000039', 'Validé'),
  ('81000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000001', '2026-03-05', '80000000-0000-0000-0000-000000000001', 20000, 'Moov Money', '20000000-0000-0000-0000-000000000040', 'TX000040', 'Validé'),
  ('81000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000001', '2026-03-10', '80000000-0000-0000-0000-000000000001', 14000, 'Orange Money', '20000000-0000-0000-0000-000000000035', 'TX000041', 'Validé'),
  ('81000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000001', '2026-03-15', '80000000-0000-0000-0000-000000000001', 18000, 'Wave', '20000000-0000-0000-0000-000000000004', 'TX000042', 'Validé'),
  ('81000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000001', '2026-03-20', '80000000-0000-0000-0000-000000000001', 24000, 'Moov Money', '20000000-0000-0000-0000-000000000032', 'TX000043', 'Validé'),
  ('81000000-0000-0000-0000-000000000044', '00000000-0000-0000-0000-000000000001', '2026-04-03', '80000000-0000-0000-0000-000000000002', 158000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000045', '00000000-0000-0000-0000-000000000001', '2026-04-03', '80000000-0000-0000-0000-000000000003', 73000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000046', '00000000-0000-0000-0000-000000000001', '2026-04-10', '80000000-0000-0000-0000-000000000002', 171000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000047', '00000000-0000-0000-0000-000000000001', '2026-04-10', '80000000-0000-0000-0000-000000000003', 74000, 'Orange Money', null, 'TX000047', 'Validé'),
  ('81000000-0000-0000-0000-000000000048', '00000000-0000-0000-0000-000000000001', '2026-04-17', '80000000-0000-0000-0000-000000000002', 187000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000049', '00000000-0000-0000-0000-000000000001', '2026-04-17', '80000000-0000-0000-0000-000000000003', 32000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000001', '2026-04-24', '80000000-0000-0000-0000-000000000002', 179000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000001', '2026-04-24', '80000000-0000-0000-0000-000000000003', 32000, 'Wave', null, 'TX000051', 'Validé'),
  ('81000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000001', '2026-04-05', '80000000-0000-0000-0000-000000000001', 49000, 'MTN MoMo', '20000000-0000-0000-0000-000000000008', 'TX000052', 'Validé'),
  ('81000000-0000-0000-0000-000000000053', '00000000-0000-0000-0000-000000000001', '2026-04-10', '80000000-0000-0000-0000-000000000001', 42000, 'Wave', '20000000-0000-0000-0000-000000000018', 'TX000053', 'Validé'),
  ('81000000-0000-0000-0000-000000000054', '00000000-0000-0000-0000-000000000001', '2026-04-15', '80000000-0000-0000-0000-000000000001', 25000, 'Orange Money', '20000000-0000-0000-0000-000000000021', 'TX000054', 'Validé'),
  ('81000000-0000-0000-0000-000000000055', '00000000-0000-0000-0000-000000000001', '2026-04-20', '80000000-0000-0000-0000-000000000001', 39000, 'Espèces', '20000000-0000-0000-0000-000000000018', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000056', '00000000-0000-0000-0000-000000000001', '2026-05-03', '80000000-0000-0000-0000-000000000002', 207000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000057', '00000000-0000-0000-0000-000000000001', '2026-05-03', '80000000-0000-0000-0000-000000000003', 67000, 'MTN MoMo', null, 'TX000057', 'Validé'),
  ('81000000-0000-0000-0000-000000000058', '00000000-0000-0000-0000-000000000001', '2026-05-10', '80000000-0000-0000-0000-000000000002', 157000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000059', '00000000-0000-0000-0000-000000000001', '2026-05-10', '80000000-0000-0000-0000-000000000003', 33000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000060', '00000000-0000-0000-0000-000000000001', '2026-05-17', '80000000-0000-0000-0000-000000000002', 215000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000001', '2026-05-17', '80000000-0000-0000-0000-000000000003', 56000, 'Moov Money', null, 'TX000061', 'Validé'),
  ('81000000-0000-0000-0000-000000000062', '00000000-0000-0000-0000-000000000001', '2026-05-24', '80000000-0000-0000-0000-000000000002', 167000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000063', '00000000-0000-0000-0000-000000000001', '2026-05-05', '80000000-0000-0000-0000-000000000001', 23000, 'MTN MoMo', '20000000-0000-0000-0000-000000000031', 'TX000063', 'Validé'),
  ('81000000-0000-0000-0000-000000000064', '00000000-0000-0000-0000-000000000001', '2026-05-10', '80000000-0000-0000-0000-000000000001', 38000, 'Espèces', '20000000-0000-0000-0000-000000000039', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000065', '00000000-0000-0000-0000-000000000001', '2026-05-15', '80000000-0000-0000-0000-000000000001', 25000, 'Orange Money', '20000000-0000-0000-0000-000000000019', 'TX000065', 'Validé'),
  ('81000000-0000-0000-0000-000000000066', '00000000-0000-0000-0000-000000000001', '2026-05-20', '80000000-0000-0000-0000-000000000001', 40000, 'Espèces', '20000000-0000-0000-0000-000000000027', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000067', '00000000-0000-0000-0000-000000000001', '2026-05-15', '80000000-0000-0000-0000-000000000004', 50000, 'Virement', null, 'TX000067', 'Validé'),
  ('81000000-0000-0000-0000-000000000068', '00000000-0000-0000-0000-000000000001', '2026-06-03', '80000000-0000-0000-0000-000000000002', 210000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000069', '00000000-0000-0000-0000-000000000001', '2026-06-03', '80000000-0000-0000-0000-000000000003', 65000, 'Moov Money', null, 'TX000069', 'Validé'),
  ('81000000-0000-0000-0000-000000000070', '00000000-0000-0000-0000-000000000001', '2026-06-10', '80000000-0000-0000-0000-000000000002', 195000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000001', '2026-06-10', '80000000-0000-0000-0000-000000000003', 69000, 'Moov Money', null, 'TX000071', 'Validé'),
  ('81000000-0000-0000-0000-000000000072', '00000000-0000-0000-0000-000000000001', '2026-06-17', '80000000-0000-0000-0000-000000000002', 204000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000073', '00000000-0000-0000-0000-000000000001', '2026-06-24', '80000000-0000-0000-0000-000000000002', 177000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000074', '00000000-0000-0000-0000-000000000001', '2026-06-05', '80000000-0000-0000-0000-000000000001', 37000, 'Espèces', '20000000-0000-0000-0000-000000000001', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000075', '00000000-0000-0000-0000-000000000001', '2026-06-10', '80000000-0000-0000-0000-000000000001', 36000, 'Orange Money', '20000000-0000-0000-0000-000000000008', 'TX000075', 'Validé'),
  ('81000000-0000-0000-0000-000000000076', '00000000-0000-0000-0000-000000000001', '2026-06-15', '80000000-0000-0000-0000-000000000001', 43000, 'Espèces', '20000000-0000-0000-0000-000000000011', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000077', '00000000-0000-0000-0000-000000000001', '2026-06-20', '80000000-0000-0000-0000-000000000001', 22000, 'Espèces', '20000000-0000-0000-0000-000000000028', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000078', '00000000-0000-0000-0000-000000000001', '2026-07-03', '80000000-0000-0000-0000-000000000002', 169000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000079', '00000000-0000-0000-0000-000000000001', '2026-07-03', '80000000-0000-0000-0000-000000000003', 58000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000080', '00000000-0000-0000-0000-000000000001', '2026-07-10', '80000000-0000-0000-0000-000000000002', 157000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000081', '00000000-0000-0000-0000-000000000001', '2026-07-10', '80000000-0000-0000-0000-000000000003', 71000, 'Orange Money', null, 'TX000081', 'Validé'),
  ('81000000-0000-0000-0000-000000000082', '00000000-0000-0000-0000-000000000001', '2026-07-17', '80000000-0000-0000-0000-000000000002', 190000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000083', '00000000-0000-0000-0000-000000000001', '2026-07-17', '80000000-0000-0000-0000-000000000003', 72000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000084', '00000000-0000-0000-0000-000000000001', '2026-07-24', '80000000-0000-0000-0000-000000000002', 205000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000085', '00000000-0000-0000-0000-000000000001', '2026-07-24', '80000000-0000-0000-0000-000000000003', 70000, 'MTN MoMo', null, 'TX000085', 'Validé'),
  ('81000000-0000-0000-0000-000000000086', '00000000-0000-0000-0000-000000000001', '2026-07-05', '80000000-0000-0000-0000-000000000001', 19000, 'MTN MoMo', '20000000-0000-0000-0000-000000000013', 'TX000086', 'Validé'),
  ('81000000-0000-0000-0000-000000000087', '00000000-0000-0000-0000-000000000001', '2026-07-10', '80000000-0000-0000-0000-000000000001', 45000, 'Espèces', '20000000-0000-0000-0000-000000000014', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000088', '00000000-0000-0000-0000-000000000001', '2026-07-15', '80000000-0000-0000-0000-000000000001', 30000, 'Espèces', '20000000-0000-0000-0000-000000000033', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000089', '00000000-0000-0000-0000-000000000001', '2026-07-20', '80000000-0000-0000-0000-000000000001', 36000, 'MTN MoMo', '20000000-0000-0000-0000-000000000033', 'TX000089', 'Validé'),
  ('81000000-0000-0000-0000-000000000090', '00000000-0000-0000-0000-000000000001', '2026-08-03', '80000000-0000-0000-0000-000000000002', 182000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000091', '00000000-0000-0000-0000-000000000001', '2026-08-10', '80000000-0000-0000-0000-000000000002', 158000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000092', '00000000-0000-0000-0000-000000000001', '2026-08-17', '80000000-0000-0000-0000-000000000002', 184000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000093', '00000000-0000-0000-0000-000000000001', '2026-08-24', '80000000-0000-0000-0000-000000000002', 173000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000094', '00000000-0000-0000-0000-000000000001', '2026-08-05', '80000000-0000-0000-0000-000000000001', 27000, 'MTN MoMo', '20000000-0000-0000-0000-000000000008', 'TX000094', 'Validé'),
  ('81000000-0000-0000-0000-000000000095', '00000000-0000-0000-0000-000000000001', '2026-08-10', '80000000-0000-0000-0000-000000000001', 37000, 'Espèces', '20000000-0000-0000-0000-000000000001', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000096', '00000000-0000-0000-0000-000000000001', '2026-08-15', '80000000-0000-0000-0000-000000000001', 34000, 'Moov Money', '20000000-0000-0000-0000-000000000035', 'TX000096', 'Validé'),
  ('81000000-0000-0000-0000-000000000097', '00000000-0000-0000-0000-000000000001', '2026-08-20', '80000000-0000-0000-0000-000000000001', 28000, 'Espèces', '20000000-0000-0000-0000-000000000021', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000098', '00000000-0000-0000-0000-000000000001', '2026-08-15', '80000000-0000-0000-0000-000000000004', 50000, 'Virement', null, 'TX000098', 'Validé'),
  ('81000000-0000-0000-0000-000000000099', '00000000-0000-0000-0000-000000000001', '2026-09-03', '80000000-0000-0000-0000-000000000002', 183000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000001', '2026-09-03', '80000000-0000-0000-0000-000000000003', 54000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', '2026-09-10', '80000000-0000-0000-0000-000000000002', 214000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', '2026-09-10', '80000000-0000-0000-0000-000000000003', 50000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', '2026-09-17', '80000000-0000-0000-0000-000000000002', 158000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000001', '2026-09-24', '80000000-0000-0000-0000-000000000002', 183000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000001', '2026-09-24', '80000000-0000-0000-0000-000000000003', 73000, 'Moov Money', null, 'TX000105', 'Validé'),
  ('81000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000001', '2026-09-05', '80000000-0000-0000-0000-000000000001', 15000, 'Wave', '20000000-0000-0000-0000-000000000035', 'TX000106', 'Validé'),
  ('81000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000001', '2026-09-10', '80000000-0000-0000-0000-000000000001', 38000, 'Espèces', '20000000-0000-0000-0000-000000000020', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000001', '2026-09-15', '80000000-0000-0000-0000-000000000001', 15000, 'Espèces', '20000000-0000-0000-0000-000000000040', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000109', '00000000-0000-0000-0000-000000000001', '2026-09-20', '80000000-0000-0000-0000-000000000001', 30000, 'Orange Money', '20000000-0000-0000-0000-000000000021', 'TX000109', 'Validé'),
  ('81000000-0000-0000-0000-000000000110', '00000000-0000-0000-0000-000000000001', '2026-10-03', '80000000-0000-0000-0000-000000000002', 181000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000001', '2026-10-03', '80000000-0000-0000-0000-000000000003', 64000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000112', '00000000-0000-0000-0000-000000000001', '2026-10-10', '80000000-0000-0000-0000-000000000002', 174000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000113', '00000000-0000-0000-0000-000000000001', '2026-10-17', '80000000-0000-0000-0000-000000000002', 199000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000114', '00000000-0000-0000-0000-000000000001', '2026-10-17', '80000000-0000-0000-0000-000000000003', 59000, 'Orange Money', null, 'TX000114', 'Validé'),
  ('81000000-0000-0000-0000-000000000115', '00000000-0000-0000-0000-000000000001', '2026-10-24', '80000000-0000-0000-0000-000000000002', 182000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000116', '00000000-0000-0000-0000-000000000001', '2026-10-05', '80000000-0000-0000-0000-000000000001', 40000, 'Espèces', '20000000-0000-0000-0000-000000000026', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000117', '00000000-0000-0000-0000-000000000001', '2026-10-10', '80000000-0000-0000-0000-000000000001', 38000, 'Espèces', '20000000-0000-0000-0000-000000000019', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000118', '00000000-0000-0000-0000-000000000001', '2026-10-15', '80000000-0000-0000-0000-000000000001', 43000, 'Espèces', '20000000-0000-0000-0000-000000000004', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000119', '00000000-0000-0000-0000-000000000001', '2026-10-20', '80000000-0000-0000-0000-000000000001', 17000, 'Espèces', '20000000-0000-0000-0000-000000000030', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000120', '00000000-0000-0000-0000-000000000001', '2026-11-03', '80000000-0000-0000-0000-000000000002', 206000, 'Espèces', null, null, 'Saisi'),
  ('81000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000001', '2026-11-10', '80000000-0000-0000-0000-000000000002', 200000, 'Espèces', null, null, 'Saisi'),
  ('81000000-0000-0000-0000-000000000122', '00000000-0000-0000-0000-000000000001', '2026-11-17', '80000000-0000-0000-0000-000000000002', 163000, 'Espèces', null, null, 'Saisi'),
  ('81000000-0000-0000-0000-000000000123', '00000000-0000-0000-0000-000000000001', '2026-11-05', '80000000-0000-0000-0000-000000000001', 41000, 'Wave', '20000000-0000-0000-0000-000000000014', 'TX000123', 'Saisi'),
  ('81000000-0000-0000-0000-000000000124', '00000000-0000-0000-0000-000000000001', '2026-11-10', '80000000-0000-0000-0000-000000000001', 24000, 'Wave', '20000000-0000-0000-0000-000000000035', 'TX000124', 'Saisi'),
  ('81000000-0000-0000-0000-000000000125', '00000000-0000-0000-0000-000000000001', '2026-11-15', '80000000-0000-0000-0000-000000000001', 12000, 'Moov Money', '20000000-0000-0000-0000-000000000016', 'TX000125', 'Saisi'),
  ('81000000-0000-0000-0000-000000000126', '00000000-0000-0000-0000-000000000001', '2026-11-20', '80000000-0000-0000-0000-000000000001', 11000, 'Espèces', '20000000-0000-0000-0000-000000000026', null, 'Saisi'),
  ('81000000-0000-0000-0000-000000000127', '00000000-0000-0000-0000-000000000001', '2026-11-15', '80000000-0000-0000-0000-000000000004', 50000, 'Virement', null, 'TX000127', 'Saisi');

insert into ligne_budget (id, eglise_id, annee, poste, departement_id, montant) values
  ('82000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 2026, 'Loyer et charges du temple', 'd06', 6000000),
  ('82000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 2026, 'Électricité et eau', 'd06', 2400000),
  ('82000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 2026, 'Sono et médias', 'd04', 1800000),
  ('82000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 2026, 'École du dimanche', 'd08', 600000),
  ('82000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 2026, 'Œuvres caritatives', 'd10', 1500000),
  ('82000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 2026, 'Évangélisation et missions', null, 2000000),
  ('82000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 2026, 'Entretien et hygiène', 'd03', 900000),
  ('82000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 2026, 'Toiture du temple', 'd06', 4500000);

insert into depense (id, eglise_id, date, objet, montant, ligne_budget_id, projet_id, demandeur, beneficiaire, canal, statut) values
  ('83000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-01-05', 'Loyer de janvier', 500000, '82000000-0000-0000-0000-000000000001', null, 'Konan Ruth', 'Prestataire fictif', 'Espèces', 'Payée'),
  ('83000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2026-02-05', 'Loyer de février', 500000, '82000000-0000-0000-0000-000000000001', null, 'Ouattara Didier', 'Prestataire fictif', 'Virement', 'Payée'),
  ('83000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '2026-03-05', 'Loyer de mars', 500000, '82000000-0000-0000-0000-000000000001', null, 'Assi Nadège', 'Prestataire fictif', 'Espèces', 'Payée'),
  ('83000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '2026-04-12', 'Facture CIE (électricité)', 210000, '82000000-0000-0000-0000-000000000002', null, 'Koné Yannick', 'Prestataire fictif', 'Orange Money', 'Payée'),
  ('83000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '2026-05-20', 'Câbles et micros', 320000, '82000000-0000-0000-0000-000000000003', null, 'Ouattara Esther', 'Prestataire fictif', 'Orange Money', 'Payée'),
  ('83000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '2026-06-08', 'Supports de l''école du dimanche', 180000, '82000000-0000-0000-0000-000000000004', null, 'N''Guessan Ruth', 'Prestataire fictif', 'Orange Money', 'Payée'),
  ('83000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '2026-07-14', 'Dons alimentaires aux familles', 400000, '82000000-0000-0000-0000-000000000005', null, 'Kouamé Ruth', 'Prestataire fictif', 'Orange Money', 'Payée'),
  ('83000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '2026-08-22', 'Croisade de Yopougon', 650000, '82000000-0000-0000-0000-000000000006', null, 'N''Guessan Fabrice', 'Prestataire fictif', 'Orange Money', 'Payée'),
  ('83000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', '2026-09-10', 'Produits d''entretien', 95000, '82000000-0000-0000-0000-000000000007', null, 'Kouamé Ismaël', 'Prestataire fictif', 'Orange Money', 'Payée'),
  ('83000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '2026-10-05', 'Loyer d''octobre', 500000, '82000000-0000-0000-0000-000000000001', null, 'Brou Fabrice', 'Prestataire fictif', 'Virement', 'Payée'),
  ('83000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '2026-11-05', 'Loyer de novembre', 500000, '82000000-0000-0000-0000-000000000001', null, 'Zadi Ismaël', 'Prestataire fictif', 'Virement', 'Validée'),
  ('83000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '2026-11-12', 'Acompte toiture (tôles)', 1200000, '82000000-0000-0000-0000-000000000008', '76000000-0000-0000-0000-000000000001', 'Ouattara Mariam', 'Prestataire fictif', 'Espèces', 'Validée'),
  ('83000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', '2026-11-16', 'Facture SODECI (eau)', 75000, '82000000-0000-0000-0000-000000000002', null, 'Diomandé Marie', 'Prestataire fictif', 'Espèces', 'Demandée'),
  ('83000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', '2026-11-18', 'Location de cars pour la convention', 900000, '82000000-0000-0000-0000-000000000006', '76000000-0000-0000-0000-000000000002', 'Ouattara Grâce', 'Prestataire fictif', 'Virement', 'Demandée'),
  ('83000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', '2026-11-19', 'Ordinateur de diffusion', 650000, '82000000-0000-0000-0000-000000000003', '76000000-0000-0000-0000-000000000003', 'Koné Nadège', 'Prestataire fictif', 'Virement', 'Refusée');

insert into annonce (id, eglise_id, titre, date, jusquau, texte, publie) values
  ('84000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Veillée de prière', '2026-11-16', '2026-11-28', 'Veillée de prière vendredi 27 novembre à 22 h au temple. Venez nombreux.', true),
  ('84000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Inscriptions à la convention 2027', '2026-11-05', '2027-01-10', 'Les inscriptions à la convention annuelle sont ouvertes auprès du secrétariat (5 000 F, transport compris).', true),
  ('84000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Collecte pour la toiture', '2026-11-12', null, 'Une collecte spéciale pour la réfection de la toiture aura lieu le dimanche 23 novembre.', true),
  ('84000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Programme de Noël', '2026-11-19', null, 'Brouillon à compléter : horaires des cultes de Noël et du Nouvel An.', false);

insert into article (id, eglise_id, article, categorie, quantite, affectation, etat, valeur, date_achat, notes) values
  ('85000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Console de mixage 24 pistes', 'Sono et instruments', 1, 'Régie', 'Bon', 1800000, '2024-03-10', 'Article fictif de test'),
  ('85000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Micros sans fil', 'Sono et instruments', 6, 'Louange', 'Bon', 90000, '2025-01-15', 'Article fictif de test'),
  ('85000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Clavier numérique', 'Sono et instruments', 1, 'Louange', 'À réparer', 650000, '2022-06-01', 'Article fictif de test'),
  ('85000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Chaises en plastique', 'Mobilier', 400, 'Nef', 'Bon', 6000, '2023-09-01', 'Article fictif de test'),
  ('85000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Bancs en bois', 'Mobilier', 60, 'Nef', 'Bon', 45000, '2019-05-20', 'Article fictif de test'),
  ('85000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Vidéoprojecteur', 'Informatique', 2, 'Médias', 'Bon', 420000, '2024-11-02', 'Article fictif de test'),
  ('85000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Ordinateur portable', 'Informatique', 1, 'Secrétariat', 'À réparer', 380000, '2021-02-14', 'Article fictif de test'),
  ('85000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Minicar 22 places', 'Véhicule', 1, 'Transport', 'Bon', 14000000, '2020-08-30', 'Article fictif de test'),
  ('85000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Groupe électrogène', 'Autre', 1, 'Temple', 'Hors service', 2500000, '2018-04-11', 'Article fictif de test'),
  ('85000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Climatiseurs', 'Bâtiment', 4, 'Salle des enfants', 'Bon', 350000, '2023-03-03', 'Article fictif de test');

insert into entretien (id, eglise_id, date, article_id, intervention, prestataire, cout, prochaine) values
  ('86000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-06-10', '85000000-0000-0000-0000-000000000008', 'Vidange et révision', 'Garage fictif', 85000, '2026-12-10'),
  ('86000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2026-09-02', '85000000-0000-0000-0000-000000000009', 'Diagnostic de panne', 'Électricien fictif', 25000, '2026-10-15'),
  ('86000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '2026-10-20', '85000000-0000-0000-0000-000000000010', 'Nettoyage des filtres', 'Froid fictif', 40000, '2027-01-20'),
  ('86000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '2026-11-03', '85000000-0000-0000-0000-000000000001', 'Mise à jour et réglages', 'Technicien fictif', 30000, null),
  ('86000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '2026-11-14', '85000000-0000-0000-0000-000000000003', 'Remplacement de touches', 'Technicien fictif', 60000, '2026-11-25');

insert into objectif (id, eglise_id, libelle, but, mesure, cible, date_debut, date_fin, responsable) values
  ('75000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Collecter 15 millions pour le temple en 2026', 'Financer les travaux sans emprunt.', 'dons', 15000000, '2026-01-01', '2026-12-31', 'Trésorier');

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
