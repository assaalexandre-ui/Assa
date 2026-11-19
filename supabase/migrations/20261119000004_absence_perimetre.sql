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
