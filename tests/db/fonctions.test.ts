import { describe, it, expect } from 'vitest';
import { tx, monde, n, EGLISE } from './helpers';

describe('fonctions : actions du berger, intégration, relevé, annuaire', () => {
  it('berger1 voit les noms des fidèles sans berger, sans contact', () => tx(async db => {
    const m = await monde(db);
    const r = await db.as(m.u.berger1, 'select * from fideles_sans_berger()');
    expect(r.fields.map(f => f.name)).toEqual(['id', 'nom']);
    expect(r.rows.map(x => x.id).sort()).toEqual([...m.libres].sort());
  }));

  it('un berger sans fiche ne peut pas lister les fidèles sans berger', () => tx(async db => {
    const m = await monde(db);
    await expect(db.as(m.u.bergerSansFiche, 'select * from fideles_sans_berger()')).rejects.toThrow(/fiche de berger/);
    await expect(db.as(m.u.membre, 'select * from fideles_sans_berger()')).rejects.toThrow(/droit/);
  }));

  it('berger1 rattache un fidèle sans berger à sa fiche', () => tx(async db => {
    const m = await monde(db);
    await db.as(m.u.berger1, 'select rattacher_brebis($1, $2)', [m.libres[0], m.b1]);
    const r = await db.q('select berger_id from fidele where id = $1', [m.libres[0]]);
    expect(r.rows[0].berger_id).toBe(m.b1);
  }));

  it('berger1 ne rattache pas vers B2, ni un fidèle déjà suivi', () => tx(async db => {
    const m = await monde(db);
    await expect(db.as(m.u.berger1, 'select rattacher_brebis($1, $2)', [m.libres[0], m.b2])).rejects.toThrow(/vos propres brebis/);
    await expect(db.as(m.u.berger1, 'select rattacher_brebis($1, $2)', [m.f2[0], m.b1])).rejects.toThrow(/déjà un berger/);
  }));

  it('berger1 crée une brebis rattachée à sa fiche', () => tx(async db => {
    const m = await monde(db);
    const id = (await db.as(m.u.berger1, `select creer_brebis($1, $2::jsonb) as id`, [m.b1, JSON.stringify({ nom: 'Kouamé', prenoms: 'Ange', telephone: '+225 07 00 01 01 01', berger_id: m.b2 })])).rows[0].id;
    const r = await db.q('select berger_id, nom, eglise_id from fidele where id = $1', [id]);
    expect(r.rows[0]).toEqual({ berger_id: m.b1, nom: 'Kouamé', eglise_id: EGLISE });
  }));

  it('enregistrer_releve remplace le relevé de la semaine', () => tx(async db => {
    const m = await monde(db);
    await db.as(m.u.berger1, `select enregistrer_releve($1, '2026-W47', $2::uuid[])`, [m.b1, [m.f1[0], m.f1[1]]]);
    expect(n(await db.q('select count(*) from absence'))).toBe(2);
    await db.as(m.u.berger1, `select enregistrer_releve($1, '2026-W47', $2::uuid[])`, [m.b1, [m.f1[2]]]);
    const r = await db.q('select fidele_id from absence');
    expect(r.rows.map(x => x.fidele_id)).toEqual([m.f1[2]]);
    expect(n(await db.q('select count(*) from releve_absence'))).toBe(1);
  }));

  it('un absent hors des brebis du berger est refusé', () => tx(async db => {
    const m = await monde(db);
    await expect(db.as(m.u.berger1, `select enregistrer_releve($1, '2026-W47', $2::uuid[])`, [m.b1, [m.f2[0]]])).rejects.toThrow(/brebis de ce berger/);
    await expect(db.as(m.u.berger1, `select enregistrer_releve($1, '2026-W47', $2::uuid[])`, [m.b2, []])).rejects.toThrow(/vos propres brebis/);
  }));

  it("l'ADNH valide une intégration : fiche créée puis mise à jour", () => tx(async db => {
    const m = await monde(db);
    const nv = (await db.q(`insert into nouveau (eglise_id, date_venue, nom, contact, commune) values ($1, '2026-11-02', 'Ange Kouadio', '+225 05 00 01 02 03', 'Yopougon') returning id`, [EGLISE])).rows[0].id;
    const f = (await db.as(m.u.adnh, `select valider_integration($1, 'gc03', 2, $2) as id`, [nv, m.b1])).rows[0].id;
    const fiche = (await db.q('select nom, telephone, commune, gc_id, classe, berger_id, statut, origine from fidele where id = $1', [f])).rows[0];
    expect(fiche).toEqual({ nom: 'Ange Kouadio', telephone: '+225 05 00 01 02 03', commune: 'Yopougon', gc_id: 'gc03', classe: 2, berger_id: m.b1, statut: 'Nouveau', origine: 'ADNH' });
    const nouveau = (await db.q('select statut, fidele_id, gc_id from nouveau where id = $1', [nv])).rows[0];
    expect(nouveau).toEqual({ statut: 'intégré', fidele_id: f, gc_id: 'gc03' });
    const f2 = (await db.as(m.u.adnh, `select valider_integration($1, 'gc05', 3, null) as id`, [nv])).rows[0].id;
    expect(f2).toBe(f);
    expect((await db.q('select gc_id, classe from fidele where id = $1', [f])).rows[0]).toEqual({ gc_id: 'gc05', classe: 3 });
  }));

  it("l'intégration exige le GC et la classe, et le droit ADNH", () => tx(async db => {
    const m = await monde(db);
    const nv = (await db.q(`insert into nouveau (eglise_id, date_venue, nom) values ($1, '2026-11-02', 'X') returning id`, [EGLISE])).rows[0].id;
    await expect(db.as(m.u.adnh, `select valider_integration($1, null, 2, null)`, [nv])).rejects.toThrow('Choisissez le GC et la classe.');
    await expect(db.as(m.u.membre, `select valider_integration($1, 'gc01', 1, null)`, [nv])).rejects.toThrow(/droit/);
  }));

  it('une intégration vers un berger complet est refusée et ne change rien', () => tx(async db => {
    const m = await monde(db);
    for (let i = 0; i < 12; i++) await db.q(`insert into fidele (eglise_id, nom, berger_id) values ($1, $2, $3)`, [EGLISE, 'P' + i, m.b1]);
    const nv = (await db.q(`insert into nouveau (eglise_id, date_venue, nom) values ($1, '2026-11-02', 'X') returning id`, [EGLISE])).rows[0].id;
    const avant = n(await db.q('select count(*) from fidele'));
    await expect(db.as(m.u.adnh, `select valider_integration($1, 'gc01', 1, $2)`, [nv, m.b1])).rejects.toThrow('Ce berger suit déjà 15 brebis.');
    expect(n(await db.q('select count(*) from fidele'))).toBe(avant);
    expect((await db.q('select statut from nouveau where id = $1', [nv])).rows[0].statut).toBe('en suivi');
  }));

  it("l'annuaire donne les noms aux comptes actifs, rien à l'anonyme", () => tx(async db => {
    const m = await monde(db);
    const r = await db.as(m.u.adnh, `select type, nom, brebis from annuaire where type = 'berger' order by nom`);
    expect(r.rows).toEqual([{ type: 'berger', nom: 'Berger Deux', brebis: 2 }, { type: 'berger', nom: 'Berger Un', brebis: 3 }]);
    expect(n(await db.as(m.u.adnh, `select count(*) from annuaire where type = 'profil'`))).toBeGreaterThanOrEqual(8);
    expect(n(await db.as(m.u.desactive, 'select count(*) from annuaire'))).toBe(0);
    await expect(db.as(null, 'select count(*) from annuaire')).rejects.toThrow(/permission denied/);
  }));

  it("un administrateur ne peut pas se retirer son propre accès", () => tx(async db => {
    const m = await monde(db);
    await expect(db.as(m.u.admin, `update profil set role_code = 'pasteur' where id = $1`, [m.u.admin])).rejects.toThrow('Vous ne pouvez pas retirer votre propre accès administrateur.');
    await expect(db.as(m.u.admin, `update profil set actif = false where id = $1`, [m.u.admin])).rejects.toThrow('Vous ne pouvez pas retirer votre propre accès administrateur.');
    await expect(db.as(m.u.admin, `delete from profil where id = $1`, [m.u.admin])).rejects.toThrow('Vous ne pouvez pas retirer votre propre accès administrateur.');
    expect((await db.as(m.u.admin, `update profil set role_code = 'secretariat' where id = $1`, [m.u.pasteur])).rowCount).toBe(1);
  }));
});
