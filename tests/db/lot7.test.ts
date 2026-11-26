import { describe, it, expect } from 'vitest';
import { tx, monde, n, EGLISE } from './helpers';

describe('lot 7 : évangélisation', () => {
  it('le secrétariat enregistre une sortie ; le berger et le trésorier ne la voient pas', () => tx(async db => {
    const m = await monde(db);
    await db.as(m.u.secretariat, `insert into sortie (date, lieu, commune, rencontres, contacts) values ('2026-11-21', 'Marché de Treichville', 'Treichville', 30, 'Konan Paul – 07 07 12 34 56')`);
    expect(n(await db.as(m.u.pasteur, 'select count(*) from sortie'))).toBe(1);
    expect(n(await db.as(m.u.berger1, 'select count(*) from sortie'))).toBe(0);
    expect(n(await db.as(m.u.tresorier, 'select count(*) from sortie'))).toBe(0);
  }));
  it('transmettre un contact crée un nouveau pour l’ADNH, une seule fois', () => tx(async db => {
    const m = await monde(db);
    const s = (await db.q(`insert into sortie (eglise_id, date, lieu, commune, contacts) values ($1, '2026-11-21', 'Marché', 'Treichville', E'Konan Paul – 07 07 12 34 56\\n\\nYao Awa : 0505050505') returning id`, [EGLISE])).rows[0].id;
    await db.as(m.u.secretariat, `select transmettre_contact($1, 1)`, [s]);
    const nv = (await db.q(`select nom, contact, origine, commune from nouveau`)).rows;
    expect(nv).toEqual([{ nom: 'Yao Awa', contact: '+225 05 05 05 05 05', origine: 'Évangélisation · Marché', commune: 'Treichville' }]);
    await expect(db.as(m.u.secretariat, `select transmettre_contact($1, 1)`, [s])).rejects.toThrow(/déjà été transmis/);
    await expect(db.as(m.u.berger1, `select transmettre_contact($1, 0)`, [s])).rejects.toThrow(/droit/);
    await db.as(m.u.adnh, `select transmettre_contact($1, 0)`, [s]);
    expect((await db.q(`select contact from nouveau where nom = 'Konan Paul'`)).rows[0].contact).toBe('+225 07 07 12 34 56');
  }));
});

describe('lot 7 : sacrements et cérémonies', () => {
  it('le registre est tenu par le secrétariat et lu par le pasteur ; le fidèle n’y a pas accès', () => tx(async db => {
    const m = await monde(db);
    await db.as(m.u.secretariat, `insert into ceremonie (type, date, personnes, officiant) values ('Baptême', '2026-11-22', 'Konan Paul', 'Pasteur Démo')`);
    await expect(db.as(m.u.secretariat, `insert into ceremonie (type, date, personnes) values ('Fête', '2026-11-22', 'X')`)).rejects.toThrow(/check/);
    expect(n(await db.as(m.u.pasteur, 'select count(*) from ceremonie'))).toBe(1);
    expect(n(await db.as(m.u.membre, 'select count(*) from ceremonie'))).toBe(0);
  }));
});

describe('lot 7 : paramètres et dernières modifications', () => {
  it('seul l’administrateur modifie les informations de l’église', () => tx(async db => {
    const m = await monde(db);
    expect((await db.as(m.u.pasteur, `update eglise set pasteur = 'X'`)).rowCount).toBe(0);
    expect((await db.as(m.u.admin, `update eglise set pasteur = 'Pasteur Démo', horaires = 'Dimanche 8 h 30 et 10 h 30'`)).rowCount).toBe(1);
    expect((await db.as(m.u.membre, `select pasteur from eglise`)).rows[0].pasteur).toBe('Pasteur Démo');
  }));
  it('le journal liste les dernières fiches avec leur auteur, pour l’administrateur seulement', () => tx(async db => {
    const m = await monde(db);
    await db.as(m.u.secretariat, `insert into ceremonie (type, date, personnes) values ('Mariage', '2026-11-28', 'Famille Démo')`);
    await db.as(m.u.admin, `update eglise set horaires = 'Dimanche'`);
    const j = (await db.as(m.u.admin, `select fiche, menu, par from dernieres_modifications(200)`)).rows;
    expect(j).toContainEqual({ fiche: 'EMCV', menu: "Paramètres de l'église", par: 'Test admin' });
    expect(j.some(x => x.menu === 'Sacrements et cérémonies' && x.par === 'Test secretariat')).toBe(true);
    await expect(db.as(m.u.pasteur, `select * from dernieres_modifications()`)).rejects.toThrow(/droit/);
  }));
});
