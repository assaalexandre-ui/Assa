import { describe, it, expect } from 'vitest';
import { tx, monde, n, EGLISE, type Db, type Monde } from './helpers';

/** Monde du lot 2 : cellules C1 (berger1) et C2 (berger2), GC gc01 relié au resp. de GC, fidèles répartis. */
async function monde2(db: Db): Promise<Monde & { c1: string; c2: string }> {
  const m = await monde(db);
  const cel = async (nom: string, b: string) => (await db.q(`insert into cellule (eglise_id, nom, berger_id) values ($1, $2, $3) returning id`, [EGLISE, nom, b])).rows[0].id as string;
  const c1 = await cel('Cellule Un', m.b1), c2 = await cel('Cellule Deux', m.b2);
  await db.q(`update profil set gc_id = 'gc01' where id = $1`, [m.u.respGc]);
  await db.q(`update fidele set gc_id = 'gc01' where id = any($1)`, [[m.f1[0], m.f2[0]]]);
  await db.q(`update fidele set gc_id = 'gc02' where id = any($1)`, [[m.f1[1]]]);
  return { ...m, c1, c2 };
}

describe('lot 2 : droits par menu', () => {
  it('le menu Cellules, GC, Programmation et Jour de culte suit role_menu', () => tx(async db => {
    const m = await monde2(db);
    const p = (uid: string, menu: string, a: string) => db.as(uid, 'select peut($1, $2) as ok', [menu, a]).then(r => r.rows[0].ok);
    expect(await p(m.u.pasteur, 'cellules', 'w')).toBe(true);
    expect(await p(m.u.secretariat, 'cellules', 'w')).toBe(false);
    expect(await p(m.u.secretariat, 'agenda', 'w')).toBe(true);
    expect(await p(m.u.berger1, 'cellules', 'w')).toBe(true);
    expect(await p(m.u.adnh, 'culte', 'w')).toBe(true);
    expect(await p(m.u.tresorier, 'culte', 'r')).toBe(true);
    expect(await p(m.u.tresorier, 'culte', 'w')).toBe(false);
    expect(await p(m.u.respGc, 'gc', 'w')).toBe(true);
    expect(await p(m.u.membre, 'agenda', 'r')).toBe(true);
    expect(await p(m.u.membre, 'agenda', 'w')).toBe(false);
  }));
});

describe('lot 2 : cellules', () => {
  it('berger1 ne voit et ne modifie que sa cellule', () => tx(async db => {
    const m = await monde2(db);
    expect((await db.as(m.u.berger1, 'select id from cellule')).rows.map(r => r.id)).toEqual([m.c1]);
    expect((await db.as(m.u.berger1, `update cellule set lieu = 'Angré' where id = $1`, [m.c2])).rowCount).toBe(0);
    expect((await db.as(m.u.berger1, `update cellule set lieu = 'Angré' where id = $1`, [m.c1])).rowCount).toBe(1);
  }));
  it('berger1 crée une cellule seulement à son nom', () => tx(async db => {
    const m = await monde2(db);
    await db.as(m.u.berger1, `insert into cellule (nom, berger_id) values ('Nouvelle', $1)`, [m.b1]);
    await expect(db.as(m.u.berger1, `insert into cellule (nom, berger_id) values ('Autre', $1)`, [m.b2])).rejects.toThrow(/row-level security/);
  }));
  it('rapports : berger1 écrit pour sa cellule, pas pour celle de B2 ; le secrétariat lit tout', () => tx(async db => {
    const m = await monde2(db);
    await db.as(m.u.berger1, `insert into rapport_cellule (cellule_id, date, presents, offrande) values ($1, '2026-11-12', 9, 5000)`, [m.c1]);
    await expect(db.as(m.u.berger1, `insert into rapport_cellule (cellule_id, date, presents) values ($1, '2026-11-12', 4)`, [m.c2])).rejects.toThrow(/row-level security/);
    expect(n(await db.as(m.u.secretariat, 'select count(*) from rapport_cellule'))).toBe(1);
    await expect(db.as(m.u.secretariat, `insert into rapport_cellule (cellule_id, date) values ($1, '2026-11-12')`, [m.c1])).rejects.toThrow(/row-level security/);
  }));
  it('un fidèle peut être rattaché à une cellule', () => tx(async db => {
    const m = await monde2(db);
    expect((await db.as(m.u.secretariat, 'update fidele set cellule_id = $1 where id = $2', [m.c1, m.libres[0]])).rowCount).toBe(1);
  }));
});

describe('lot 2 : GC', () => {
  it('le resp. de GC ne voit que son GC et les fidèles de son GC', () => tx(async db => {
    const m = await monde2(db);
    expect((await db.as(m.u.respGc, 'select id from gc')).rows.map(r => r.id)).toEqual(['gc01']);
    expect((await db.as(m.u.respGc, 'select id from fidele order by id')).rows.map(r => r.id).sort()).toEqual([m.f1[0], m.f2[0]].sort());
  }));
  it('le resp. de GC modifie son GC (tribu, responsables), pas un autre', () => tx(async db => {
    const m = await monde2(db);
    expect((await db.as(m.u.respGc, `update gc set tribu = 'Juda', responsables = array['A','B','','',''] where id = 'gc01'`)).rowCount).toBe(1);
    expect((await db.as(m.u.respGc, `update gc set tribu = 'Lévi' where id = 'gc02'`)).rowCount).toBe(0);
  }));
  it('présences : enregistrer_presence_gc remplace le relevé du jour ; un absent hors du GC est refusé', () => tx(async db => {
    const m = await monde2(db);
    await db.as(m.u.respGc, `select enregistrer_presence_gc('gc01', '2026-11-15', $1::uuid[])`, [[m.f1[0]]]);
    await db.as(m.u.respGc, `select enregistrer_presence_gc('gc01', '2026-11-15', $1::uuid[])`, [[m.f2[0]]]);
    const r = await db.q(`select p.presents, array_agg(a.fidele_id) as abs from gc_presence p join gc_absence a on a.presence_id = p.id group by p.presents`);
    expect(r.rows).toEqual([{ presents: 1, abs: [m.f2[0]] }]);
    await expect(db.as(m.u.respGc, `select enregistrer_presence_gc('gc01', '2026-11-15', $1::uuid[])`, [[m.f1[1]]])).rejects.toThrow(/membre de ce GC/);
    await expect(db.as(m.u.respGc, `select enregistrer_presence_gc('gc02', '2026-11-15', '{}'::uuid[])`)).rejects.toThrow(/votre GC/);
  }));
  it('passages de service : le resp. de GC en ajoute à son GC', () => tx(async db => {
    const m = await monde2(db);
    await db.as(m.u.respGc, `insert into gc_passage (gc_id, date, note) values ('gc01', '2026-11-22', 'Accueil du culte')`);
    await expect(db.as(m.u.respGc, `insert into gc_passage (gc_id, date) values ('gc02', '2026-11-22')`)).rejects.toThrow(/row-level security/);
  }));
  it('un berger ne voit pas le menu GC', () => tx(async db => {
    const m = await monde2(db);
    expect(n(await db.as(m.u.berger1, 'select count(*) from gc_passage'))).toBe(0);
    expect(n(await db.as(m.u.berger1, 'select count(*) from gc'))).toBe(12);
  }));
});

describe('lot 2 : programmation et jour de culte', () => {
  it('le fidèle lit la programmation sans pouvoir la modifier ; le secrétariat programme', () => tx(async db => {
    const m = await monde2(db);
    const a = (await db.as(m.u.secretariat, `insert into assemblee (nom, ville) values ('EMCV Yopougon', 'Abidjan') returning id`)).rows[0].id;
    await db.as(m.u.secretariat, `insert into evenement (titre, type, assemblee_id, date) values ('Veillée', 'Veillée de prière', $1, '2026-12-05')`, [a]);
    expect(n(await db.as(m.u.membre, 'select count(*) from evenement'))).toBe(1);
    await expect(db.as(m.u.membre, `insert into evenement (titre, type, date) values ('X', 'Autre', '2026-12-05')`)).rejects.toThrow(/row-level security/);
  }));
  it("comptages et accueil : l'ADNH saisit, le trésorier lit, le berger ne voit rien", () => tx(async db => {
    const m = await monde2(db);
    await db.as(m.u.adnh, `insert into comptage (date, culte, hommes, femmes, enfants, nouveaux) values ('2026-11-15', 'Culte du dimanche – 1er service', 310, 440, 125, 6)`);
    await db.as(m.u.adnh, `insert into poste_accueil (date, poste, agent) values ('2026-11-15', 'Parking', 'Agent Démo')`);
    expect(n(await db.as(m.u.tresorier, 'select count(*) from comptage'))).toBe(1);
    await expect(db.as(m.u.tresorier, `insert into comptage (date, culte) values ('2026-11-15', 'Autre')`)).rejects.toThrow(/row-level security/);
    expect(n(await db.as(m.u.berger1, 'select count(*) from comptage'))).toBe(0);
  }));
  it("l'intégration ADNH enregistre aussi la cellule", () => tx(async db => {
    const m = await monde2(db);
    const nv = (await db.q(`insert into nouveau (eglise_id, date_venue, nom) values ($1, '2026-11-02', 'Nouvelle Personne') returning id`, [EGLISE])).rows[0].id;
    const f = (await db.as(m.u.adnh, `select valider_integration($1, 'gc03', 2, null, $2) as id`, [nv, m.c1])).rows[0].id;
    expect((await db.q('select cellule_id from fidele where id = $1', [f])).rows[0].cellule_id).toBe(m.c1);
  }));
});
