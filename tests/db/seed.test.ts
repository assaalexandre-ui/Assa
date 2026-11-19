import { describe, it, expect } from 'vitest';
import { tx, n } from './helpers';

describe('données fictives (supabase/seed.sql)', () => {
  it('contient les références et les données de test attendues', () => tx(async db => {
    expect(n(await db.q('select count(*) from role'))).toBe(13);
    expect(n(await db.q('select count(*) from gc'))).toBe(12);
    expect(n(await db.q('select count(*) from classe'))).toBe(4);
    expect(n(await db.q('select count(*) from berger'))).toBe(4);
    expect(n(await db.q('select count(*) from fidele'))).toBe(40);
    expect(n(await db.q('select count(*) from fidele where berger_id is null'))).toBe(8);
    expect(n(await db.q('select count(*) from nouveau'))).toBe(10);
    expect(n(await db.q(`select count(*) from nouveau where statut = 'intégré'`))).toBe(3);
    expect(n(await db.q('select count(distinct nouveau_id) from appel'))).toBeGreaterThanOrEqual(4);
  }));

  it('aucun berger ne dépasse 15 brebis', () => tx(async db => {
    const r = await db.q('select max(c) as m from (select count(*) c from fidele where berger_id is not null group by berger_id) x');
    expect(Number(r.rows[0].m)).toBeLessThanOrEqual(15);
  }));

  it('tous les téléphones sont visiblement fictifs', () => tx(async db => {
    expect(n(await db.q(`select count(*) from fidele where telephone not like '+225 07 00 0%'`))).toBe(0);
    expect(n(await db.q(`select count(*) from nouveau where contact not like '+225 07 00 0%'`))).toBe(0);
    expect(n(await db.q(`select count(*) from fidele where notes is distinct from 'Fiche fictive de test'`))).toBe(0);
  }));
});
