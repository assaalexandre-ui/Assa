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
