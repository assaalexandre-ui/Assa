-- Mise à jour d'une base déjà au lot 5 vers le lot 6. À exécuter UNE fois dans l'éditeur SQL de Supabase.
-- Fichier généré par scripts/seed.mjs : ne pas le modifier à la main.

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


notify pgrst, 'reload schema';
