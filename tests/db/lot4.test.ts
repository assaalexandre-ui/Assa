import { describe, it, expect } from 'vitest';
import { tx, monde, n, EGLISE } from './helpers';

describe('lot 4 : requêtes de prière (visibilité appliquée par la base)', () => {
  it('une requête confidentielle n’est lue que par son auteur, le pasteur, l’administrateur et l’intercession', () => tx(async db => {
    const m = await monde(db);
    await db.as(m.u.membre, `insert into priere (date, demandeur, visibilite, sujet) values ('2026-11-20', 'Fidèle Démo', 'Confidentielle', 'Sujet confidentiel')`);
    await db.as(m.u.membre, `insert into priere (date, demandeur, visibilite, sujet) values ('2026-11-20', 'Fidèle Démo', 'Publique', 'Sujet public')`);
    await db.as(m.u.membre, `insert into priere (date, demandeur, visibilite, sujet) values ('2026-11-20', 'Fidèle Démo', 'Équipe d''intercession', 'Sujet équipe')`);
    expect(n(await db.as(m.u.membre, 'select count(*) from priere'))).toBe(3);
    expect(n(await db.as(m.u.intercession, 'select count(*) from priere'))).toBe(3);
    expect(n(await db.as(m.u.pasteur, 'select count(*) from priere'))).toBe(3);
    expect((await db.as(m.u.berger1, 'select sujet from priere')).rows.map(r => r.sujet)).toEqual(['Sujet public']);
    expect(n(await db.as(m.u.secretariat, 'select count(*) from priere'))).toBe(0);
  }));
  it('seuls l’auteur et l’équipe font évoluer le suivi ; personne ne dépose au nom d’un autre', () => tx(async db => {
    const m = await monde(db);
    const id = (await db.as(m.u.membre, `insert into priere (date, visibilite, sujet) values ('2026-11-20', 'Publique', 'Sujet') returning id, auteur_id`)).rows[0];
    expect(id.auteur_id).toBe(m.u.membre);
    expect((await db.as(m.u.berger1, `update priere set statut = 'Exaucée' where id = $1`, [id.id])).rowCount).toBe(0);
    expect((await db.as(m.u.intercession, `update priere set statut = 'En prière' where id = $1`, [id.id])).rowCount).toBe(1);
    await expect(db.as(m.u.berger1, `insert into priere (date, visibilite, sujet, auteur_id) values ('2026-11-20', 'Publique', 'X', $1)`, [m.u.membre])).rejects.toThrow(/row-level security/);
  }));
});

describe('lot 4 : enfants', () => {
  it('le moniteur inscrit un enfant et pointe arrivée puis sortie ; le secrétariat lit seulement', () => tx(async db => {
    const m = await monde(db);
    const e = (await db.as(m.u.moniteur, `insert into enfant (nom, groupe, parent, code) values ('Enfant Démo', '4–6 ans', 'Parent Démo', 'K7Q2') returning id`)).rows[0].id;
    await db.as(m.u.moniteur, `select pointer_enfant($1, '2026-11-22', 'arrivee')`, [e]);
    await db.as(m.u.moniteur, `select pointer_enfant($1, '2026-11-22', 'sortie')`, [e]);
    const p = (await db.q('select arrivee, sortie from pointage_enfant where enfant_id = $1', [e])).rows[0];
    expect(p.arrivee).toBe(true); expect(p.sortie).toBe(true);
    expect(n(await db.as(m.u.secretariat, 'select count(*) from enfant'))).toBe(1);
    await expect(db.as(m.u.secretariat, `insert into enfant (nom, parent) values ('X', 'Y')`)).rejects.toThrow(/row-level security/);
    expect(n(await db.as(m.u.berger1, 'select count(*) from enfant'))).toBe(0);
  }));
  it('on ne remet pas un enfant qui n’a pas été pointé à l’arrivée', () => tx(async db => {
    const m = await monde(db);
    const e = (await db.q(`insert into enfant (eglise_id, nom, parent) values ($1, 'Enfant', 'Parent') returning id`, [EGLISE])).rows[0].id;
    await expect(db.as(m.u.moniteur, `select pointer_enfant($1, '2026-11-22', 'sortie')`, [e])).rejects.toThrow(/arrivée/);
  }));
});

describe('lot 4 : rendez-vous pastoraux et événements', () => {
  it('le secrétariat prend un rendez-vous ; le berger et le fidèle n’y ont pas accès', () => tx(async db => {
    const m = await monde(db);
    await db.as(m.u.secretariat, `insert into rdv (date, personne, type, statut) values ('2026-11-25', 'Famille Démo', 'Visite à domicile', 'Prévu')`);
    expect(n(await db.as(m.u.pasteur, 'select count(*) from rdv'))).toBe(1);
    expect(n(await db.as(m.u.berger1, 'select count(*) from rdv'))).toBe(0);
    expect(n(await db.as(m.u.membre, 'select count(*) from rdv'))).toBe(0);
  }));
  it('le trésorier inscrit un participant à un événement et voit les événements', () => tx(async db => {
    const m = await monde(db);
    const ev = (await db.q(`insert into evenement (eglise_id, titre, type, date, frais) values ($1, 'Convention', 'Convention', '2027-01-15', 5000) returning id`, [EGLISE])).rows[0].id;
    expect(n(await db.as(m.u.tresorier, 'select count(*) from evenement'))).toBe(1);
    await db.as(m.u.tresorier, `insert into inscription_evenement (evenement_id, nom, montant, canal, car, depart) values ($1, 'Participant Démo', 5000, 'Wave', 'Car 1', 'Yopougon')`, [ev]);
    expect(n(await db.as(m.u.secretariat, 'select count(*) from inscription_evenement'))).toBe(1);
    expect(n(await db.as(m.u.adnh, 'select count(*) from inscription_evenement'))).toBe(0);
  }));
});
