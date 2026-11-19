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
