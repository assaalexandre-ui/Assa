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

  it('contient les données fictives du lot 2', () => tx(async db => {
    expect(n(await db.q('select count(*) from cellule'))).toBe(6);
    expect(n(await db.q('select count(*) from cellule where berger_id is null'))).toBe(0);
    expect(n(await db.q('select count(*) from fidele where cellule_id is not null'))).toBe(32);
    expect(n(await db.q('select count(*) from rapport_cellule'))).toBe(12);
    expect(n(await db.q(`select count(*) from gc where tribu <> ''`))).toBe(12);
    expect(n(await db.q('select count(*) from gc_presence'))).toBe(3);
    expect(n(await db.q('select count(*) from assemblee'))).toBe(3);
    expect(n(await db.q(`select count(*) from evenement where date < '2027-01-01'`))).toBe(14);
    expect(n(await db.q('select count(*) from comptage'))).toBe(8);
    expect(n(await db.q('select count(*) from poste_accueil'))).toBe(4);
  }));

  it('une brebis est toujours dans une cellule de son berger', () => tx(async db => {
    expect(n(await db.q('select count(*) from fidele f join cellule c on c.id = f.cellule_id where c.berger_id is distinct from f.berger_id'))).toBe(0);
  }));

  it('contient les données fictives du lot 3', () => tx(async db => {
    expect(n(await db.q('select count(*) from session_formation'))).toBe(3);
    expect(n(await db.q('select count(*) from inscription_formation'))).toBe(15);
    expect(n(await db.q(`select count(*) from departement where responsable is not null`))).toBe(12);
    expect(n(await db.q('select count(*) from planning_service'))).toBe(6);
    expect(n(await db.q('select count(*) from rapport_departement'))).toBe(4);
    expect(n(await db.q('select count(*) from reunion'))).toBe(4);
    expect(n(await db.q('select count(*) from tache'))).toBe(6);
    expect(n(await db.q('select count(*) from responsable'))).toBe(8);
  }));

  it('contient les données fictives du lot 4', () => tx(async db => {
    expect(n(await db.q('select count(*) from priere'))).toBe(8);
    expect(n(await db.q(`select count(*) from priere where visibilite = 'Confidentielle'`))).toBe(2);
    expect(n(await db.q('select count(*) from enfant'))).toBe(10);
    expect(n(await db.q('select count(*) from pointage_enfant'))).toBe(7);
    expect(n(await db.q('select count(*) from rdv'))).toBe(6);
    expect(n(await db.q('select count(*) from inscription_evenement'))).toBe(12);
  }));

  it('contient les données fictives du lot 5', () => tx(async db => {
    expect(n(await db.q('select count(*) from objectif'))).toBe(8);
    expect(n(await db.q('select count(*) from projet'))).toBe(4);
    expect(n(await db.q('select count(*) from projet_action'))).toBe(12);
    expect(n(await db.q('select count(*) from projet_journal'))).toBe(4);
  }));

  it('contient les données fictives du lot 6', () => tx(async db => {
    expect(n(await db.q('select count(*) from fonds'))).toBe(4);
    expect(n(await db.q('select count(*) from don'))).toBe(127);
    expect(n(await db.q('select count(*) from ligne_budget'))).toBe(8);
    expect(n(await db.q('select count(*) from depense'))).toBe(15);
    expect(n(await db.q('select count(*) from annonce'))).toBe(4);
    expect(n(await db.q('select count(*) from article'))).toBe(10);
    expect(n(await db.q('select count(*) from entretien'))).toBe(5);
  }));

  it('contient les données fictives du lot 7', () => tx(async db => {
    expect(n(await db.q('select count(*) from sortie'))).toBe(5);
    expect(n(await db.q('select count(*) from ceremonie'))).toBe(8);
    expect((await db.q('select nom_complet from eglise')).rows[0].nom_complet).toBe('Église Missionnaire Christ Vivant');
  }));
});
