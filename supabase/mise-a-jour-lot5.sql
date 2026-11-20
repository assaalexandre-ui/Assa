-- Mise à jour d'une base déjà au lot 4 vers le lot 5. À exécuter UNE fois dans l'éditeur SQL de Supabase.
-- Fichier généré par scripts/seed.mjs : ne pas le modifier à la main.

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


notify pgrst, 'reload schema';
