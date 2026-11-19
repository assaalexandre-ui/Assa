import { describe, it, expect } from 'vitest';
import { tx, monde, n } from './helpers';

describe('métier : fidèles, bergers, ADNH, relevés', () => {
  it('berger1 ne lit que ses 3 brebis', () => tx(async db => {
    const m = await monde(db);
    const r = await db.as(m.u.berger1, 'select id from fidele order by nom');
    expect(r.rows.map(x => x.id).sort()).toEqual([...m.f1].sort());
  }));

  it('un berger sans fiche ne lit aucun fidèle', () => tx(async db => {
    const m = await monde(db);
    expect(n(await db.as(m.u.bergerSansFiche, 'select count(*) from fidele'))).toBe(0);
    expect(n(await db.as(m.u.bergerSansFiche, 'select count(*) from berger'))).toBe(0);
  }));

  it('berger1 ne lit que sa propre fiche de berger', () => tx(async db => {
    const m = await monde(db);
    const r = await db.as(m.u.berger1, 'select id from berger');
    expect(r.rows.map(x => x.id)).toEqual([m.b1]);
  }));

  it('berger1 modifie sa brebis mais pas celle de B2', () => tx(async db => {
    const m = await monde(db);
    expect((await db.as(m.u.berger1, `update fidele set quartier = 'Riviera' where id = $1`, [m.f1[0]])).rowCount).toBe(1);
    expect((await db.as(m.u.berger1, `update fidele set quartier = 'Riviera' where id = $1`, [m.f2[0]])).rowCount).toBe(0);
  }));

  it('berger1 ne peut pas déplacer sa brebis vers B2', () => tx(async db => {
    const m = await monde(db);
    await expect(db.as(m.u.berger1, 'update fidele set berger_id = $1 where id = $2', [m.b2, m.f1[0]])).rejects.toThrow(/row-level security/);
  }));

  it('berger1 ne peut pas insérer directement dans fidele', () => tx(async db => {
    const m = await monde(db);
    await expect(db.as(m.u.berger1, `insert into fidele (nom, berger_id) values ('X', $1)`, [m.b1])).rejects.toThrow(/row-level security/);
  }));

  it('le secrétariat lit tous les fidèles mais ne crée pas de berger', () => tx(async db => {
    const m = await monde(db);
    expect(n(await db.as(m.u.secretariat, 'select count(*) from fidele'))).toBe(7);
    await expect(db.as(m.u.secretariat, `insert into berger (nom) values ('X')`)).rejects.toThrow(/row-level security/);
  }));

  it('le secrétariat crée un fidèle avec le bon rattachement à l’église', () => tx(async db => {
    const m = await monde(db);
    const r = await db.as(m.u.secretariat, `insert into fidele (nom) values ('Nouvelle fiche') returning eglise_id, maj_par`);
    expect(r.rows[0].eglise_id).toBe('00000000-0000-0000-0000-000000000001');
    expect(r.rows[0].maj_par).toBe(m.u.secretariat);
  }));

  it('un fidèle (membre) ne lit ni fidèles ni nouveaux', () => tx(async db => {
    const m = await monde(db);
    expect(n(await db.as(m.u.membre, 'select count(*) from fidele'))).toBe(0);
    expect(n(await db.as(m.u.membre, 'select count(*) from nouveau'))).toBe(0);
  }));

  it("l'ADNH crée un nouveau et note un appel ; le pasteur lit l'appel", () => tx(async db => {
    const m = await monde(db);
    const nv = (await db.as(m.u.adnh, `insert into nouveau (date_venue, nom, contact) values ('2026-11-15', 'Visiteur', '+225 07 00 01 02 03') returning id`)).rows[0].id;
    const a = await db.as(m.u.adnh, `insert into appel (nouveau_id, date, resultat, note) values ($1, '2026-11-16', 'Joint', 'Viendra dimanche') returning auteur_id`, [nv]);
    expect(a.rows[0].auteur_id).toBe(m.u.adnh);
    expect(n(await db.as(m.u.pasteur, 'select count(*) from appel'))).toBe(1);
    await expect(db.as(m.u.berger1, `insert into appel (nouveau_id, date, resultat) values ($1, '2026-11-16', 'Joint')`, [nv])).rejects.toThrow(/row-level security/);
  }));

  it('une 16e brebis est refusée', () => tx(async db => {
    const m = await monde(db);
    for (let i = 0; i < 12; i++) await db.q(`insert into fidele (eglise_id, nom, berger_id) values ('00000000-0000-0000-0000-000000000001', $1, $2)`, ['P' + i, m.b1]);
    await expect(db.as(m.u.admin, `insert into fidele (nom, berger_id) values ('Seizième', $1)`, [m.b1])).rejects.toThrow('Ce berger suit déjà 15 brebis.');
    await expect(db.as(m.u.admin, `update fidele set berger_id = $1 where id = $2`, [m.b1, m.libres[0]])).rejects.toThrow('Ce berger suit déjà 15 brebis.');
    expect((await db.as(m.u.admin, `update fidele set quartier = 'Cocody' where id = $1`, [m.f1[0]])).rowCount).toBe(1);
  }));

  it('berger1 enregistre son relevé, pas celui de B2', () => tx(async db => {
    const m = await monde(db);
    const r = (await db.as(m.u.berger1, `insert into releve_absence (berger_id, semaine) values ($1, '2026-W47') returning id`, [m.b1])).rows[0].id;
    await db.as(m.u.berger1, 'insert into absence (releve_id, fidele_id) values ($1, $2)', [r, m.f1[0]]);
    await expect(db.as(m.u.berger1, `insert into releve_absence (berger_id, semaine) values ($1, '2026-W47')`, [m.b2])).rejects.toThrow(/row-level security/);
    expect(n(await db.as(m.u.berger2, 'select count(*) from absence'))).toBe(0);
    expect(n(await db.as(m.u.pasteur, 'select count(*) from absence'))).toBe(1);
  }));

  it("berger1 ne peut pas marquer absente la brebis d'un autre berger", () => tx(async db => {
    const m = await monde(db);
    const r = (await db.as(m.u.berger1, `insert into releve_absence (berger_id, semaine) values ($1, '2026-W47') returning id`, [m.b1])).rows[0].id;
    await expect(db.as(m.u.berger1, 'insert into absence (releve_id, fidele_id) values ($1, $2)', [r, m.f2[0]])).rejects.toThrow(/row-level security/);
    await expect(db.as(m.u.berger1, 'insert into absence (releve_id, fidele_id) values ($1, $2)', [r, m.libres[0]])).rejects.toThrow(/row-level security/);
  }));
});
