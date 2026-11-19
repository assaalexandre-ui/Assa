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
