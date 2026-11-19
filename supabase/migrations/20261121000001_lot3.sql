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
