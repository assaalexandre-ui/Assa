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
