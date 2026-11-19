-- Mise à jour d'une base déjà au lot 2 vers le lot 3. À exécuter UNE fois dans l'éditeur SQL de Supabase.
-- Fichier généré par scripts/seed.mjs : ne pas le modifier à la main.

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
