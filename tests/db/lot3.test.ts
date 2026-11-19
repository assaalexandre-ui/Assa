import { describe, it, expect } from 'vitest';
import { tx, monde, n, EGLISE } from './helpers';

const p = (db: Parameters<Parameters<typeof tx>[0]>[0], uid: string, menu: string, a: string) => db.as(uid, 'select peut($1, $2) as ok', [menu, a]).then(r => r.rows[0].ok);

describe('lot 3 : droits par menu (repris de l’artefact)', () => {
  it('formations, départements, réunions, organigramme', () => tx(async db => {
    const m = await monde(db);
    expect(await p(db, m.u.formateur, 'formations', 'w')).toBe(true);
    expect(await p(db, m.u.adnh, 'formations', 'r')).toBe(true);
    expect(await p(db, m.u.adnh, 'formations', 'w')).toBe(false);
    expect(await p(db, m.u.respDep, 'departements', 'w')).toBe(true);
    expect(await p(db, m.u.conseil, 'departements', 'r')).toBe(true);
    expect(await p(db, m.u.conseil, 'reunions', 'w')).toBe(true);
    expect(await p(db, m.u.berger1, 'reunions', 'r')).toBe(false);
    expect(await p(db, m.u.berger1, 'organigramme', 'r')).toBe(true);
    expect(await p(db, m.u.berger1, 'organigramme', 'w')).toBe(false);
    expect(await p(db, m.u.membre, 'organigramme', 'r')).toBe(false);
  }));
});

describe('lot 3 : formations', () => {
  it('le formateur crée une session, inscrit un fidèle et note ses absences', () => tx(async db => {
    const m = await monde(db);
    const s = (await db.as(m.u.formateur, `insert into session_formation (classe, date_debut, date_fin, formateur) values (1, '2026-09-01', '2026-12-15', 'Formateur Démo') returning id`)).rows[0].id;
    const i = (await db.as(m.u.formateur, `insert into inscription_formation (session_id, fidele_id) values ($1, $2) returning id`, [s, m.libres[0]])).rows[0].id;
    expect((await db.as(m.u.formateur, 'update inscription_formation set absences = 2 where id = $1', [i])).rowCount).toBe(1);
    await expect(db.as(m.u.adnh, `insert into session_formation (classe, date_debut, date_fin) values (1, '2026-09-01', '2026-12-15')`)).rejects.toThrow(/row-level security/);
  }));
  it('valider une classe fait passer le fidèle à la classe suivante (et pas au-delà de la dernière)', () => tx(async db => {
    const m = await monde(db);
    const s = (await db.q(`insert into session_formation (eglise_id, classe, date_debut, date_fin) values ($1, 1, '2026-09-01', '2026-12-15') returning id`, [EGLISE])).rows[0].id;
    const i = (await db.q(`insert into inscription_formation (session_id, fidele_id) values ($1, $2) returning id`, [s, m.libres[0]])).rows[0].id;
    await db.as(m.u.formateur, 'select valider_inscription($1, true)', [i]);
    expect((await db.q('select classe from fidele where id = $1', [m.libres[0]])).rows[0].classe).toBe(2);
    const s4 = (await db.q(`insert into session_formation (eglise_id, classe, date_debut, date_fin) values ($1, 4, '2026-09-01', '2026-12-15') returning id`, [EGLISE])).rows[0].id;
    const i4 = (await db.q(`insert into inscription_formation (session_id, fidele_id) values ($1, $2) returning id`, [s4, m.libres[1]])).rows[0].id;
    await db.as(m.u.formateur, 'select valider_inscription($1, true)', [i4]);
    expect((await db.q('select classe from fidele where id = $1', [m.libres[1]])).rows[0].classe).toBe(4);
    await expect(db.as(m.u.adnh, 'select valider_inscription($1, true)', [i])).rejects.toThrow(/droit/);
  }));
  it('le formateur peut modifier le nom d’une classe ; l’ADNH non', () => tx(async db => {
    const m = await monde(db);
    expect((await db.as(m.u.formateur, `update classe set role = 'Fondements de la foi' where numero = 1`)).rowCount).toBe(1);
    expect((await db.as(m.u.adnh, `update classe set role = 'X' where numero = 1`)).rowCount).toBe(0);
  }));
});

describe('lot 3 : départements', () => {
  it('le responsable de département ne voit et ne modifie que son département, ses créneaux et ses rapports', () => tx(async db => {
    const m = await monde(db);
    await db.q(`update profil set departement_id = 'd04' where id = $1`, [m.u.respDep]);
    expect((await db.as(m.u.respDep, 'select id from departement')).rows.map(r => r.id)).toEqual(['d04']);
    await db.as(m.u.respDep, `insert into planning_service (date, activite, departement_id, poste, personne) values ('2026-11-29', 'Culte', 'd04', 'Caméra', 'Démo')`);
    await expect(db.as(m.u.respDep, `insert into planning_service (date, activite, departement_id) values ('2026-11-29', 'Culte', 'd05')`)).rejects.toThrow(/row-level security/);
    await db.as(m.u.respDep, `insert into rapport_departement (departement_id, periode, activites) values ('d04', '2026-11', 'Captation des cultes')`);
    expect(n(await db.as(m.u.pasteur, 'select count(*) from rapport_departement'))).toBe(1);
    expect((await db.as(m.u.respDep, `update departement set responsable = 'Moi' where id = 'd05'`)).rowCount).toBe(0);
    await expect(db.as(m.u.respDep, `insert into departement (id, nom, groupe) values ('d99', 'X', 'autre')`)).rejects.toThrow(/row-level security/);
  }));
  it('le conseil lit les départements sans les modifier', () => tx(async db => {
    const m = await monde(db);
    expect(n(await db.as(m.u.conseil, 'select count(*) from departement'))).toBe(12);
    expect((await db.as(m.u.conseil, `update departement set responsable = 'X' where id = 'd01'`)).rowCount).toBe(0);
  }));
});

describe('lot 3 : réunions et organigramme', () => {
  it('le conseil tient les réunions et les tâches ; le berger n’y a pas accès', () => tx(async db => {
    const m = await monde(db);
    const r = (await db.as(m.u.conseil, `insert into reunion (date, instance, objet, decisions) values ('2026-11-10', 'Conseil', 'Budget 2027', 'Adopter le budget') returning id`)).rows[0].id;
    await db.as(m.u.conseil, `insert into tache (titre, responsable, statut, reunion_id) values ('Préparer le budget', 'Trésorier', 'À faire', $1)`, [r]);
    expect(n(await db.as(m.u.berger1, 'select count(*) from reunion'))).toBe(0);
    expect(n(await db.as(m.u.berger1, 'select count(*) from tache'))).toBe(0);
  }));
  it('l’annuaire des responsables : lu par le berger, modifié par le secrétariat seulement', () => tx(async db => {
    const m = await monde(db);
    await db.as(m.u.secretariat, `insert into responsable (fonction, nom, niveau, ordre) values ('Pasteur principal', 'Pasteur Démo', 'Direction', 1)`);
    expect(n(await db.as(m.u.berger1, 'select count(*) from responsable'))).toBe(1);
    await expect(db.as(m.u.berger1, `insert into responsable (fonction, nom) values ('X', 'Y')`)).rejects.toThrow(/row-level security/);
    expect(n(await db.as(m.u.membre, 'select count(*) from responsable'))).toBe(0);
  }));
});
