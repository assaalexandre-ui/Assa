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
