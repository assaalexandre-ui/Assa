import { describe, it, expect } from 'vitest';
import { tx, monde, n, EGLISE } from './helpers';

describe('lot 5 : supervision', () => {
  it('le trésorier lit les départements et leurs rapports par la Supervision, sans pouvoir les modifier', () => tx(async db => {
    const m = await monde(db);
    await db.q(`insert into rapport_departement (eglise_id, departement_id, periode, statut) values ($1, 'd04', '2026-11', 'Soumis')`, [EGLISE]);
    expect(n(await db.as(m.u.tresorier, 'select count(*) from departement'))).toBe(12);
    expect(n(await db.as(m.u.tresorier, 'select count(*) from rapport_departement'))).toBe(1);
    expect((await db.as(m.u.tresorier, `update rapport_departement set statut = 'Validé'`)).rowCount).toBe(0);
  }));
  it('le pasteur valide un rapport ; le conseil ne le peut pas', () => tx(async db => {
    const m = await monde(db);
    const id = (await db.q(`insert into rapport_departement (eglise_id, departement_id, periode) values ($1, 'd04', '2026-11') returning id`, [EGLISE])).rows[0].id;
    await expect(db.as(m.u.conseil, `select statuer_rapport($1, 'Validé')`, [id])).rejects.toThrow(/droit/);
    await db.as(m.u.pasteur, `select statuer_rapport($1, 'Validé')`, [id]);
    expect((await db.q('select statut from rapport_departement where id = $1', [id])).rows[0].statut).toBe('Validé');
  }));
});

describe('lot 5 : objectifs à atteindre', () => {
  it('seul l’administrateur fixe un objectif ; le pasteur et le conseil le lisent', () => tx(async db => {
    const m = await monde(db);
    await db.as(m.u.admin, `insert into objectif (libelle, mesure, cible, date_debut, date_fin) values ('Fidèles suivis', 'suivis', 5, '2026-01-01', '2026-12-31')`);
    await expect(db.as(m.u.pasteur, `insert into objectif (libelle, cible, date_fin) values ('X', 1, '2026-12-31')`)).rejects.toThrow(/row-level security/);
    expect(n(await db.as(m.u.conseil, 'select count(*) from objectif'))).toBe(1);
    expect(n(await db.as(m.u.berger1, 'select count(*) from objectif'))).toBe(0);
  }));
  it('la mesure automatique et le statut sont calculés par la base', () => tx(async db => {
    const m = await monde(db);
    await db.q(`insert into objectif (eglise_id, libelle, mesure, cible, date_debut, date_fin) values
      ($1, 'Suivis', 'suivis', 5, '2026-01-01', '2099-12-31'),
      ($1, 'Fidèles', 'fideles', 100, '2026-01-01', '2099-12-31'),
      ($1, 'Manuel passé', 'manuel', 10, '2020-01-01', '2020-12-31')`, [EGLISE]);
    await db.q(`update objectif set realise = 4 where libelle = 'Manuel passé'`);
    const r = (await db.as(m.u.conseil, 'select libelle, valeur, statut from objectif_suivi order by libelle')).rows;
    expect(r).toEqual([
      { libelle: 'Fidèles', valeur: '7', statut: 'En cours' },
      { libelle: 'Manuel passé', valeur: '4', statut: 'Non atteint' },
      { libelle: 'Suivis', valeur: '5', statut: 'Atteint' },
    ]);
  }));
  it('le responsable de département voit les objectifs généraux et ceux du sien', () => tx(async db => {
    const m = await monde(db);
    await db.q(`update profil set departement_id = 'd04' where id = $1`, [m.u.respDep]);
    await db.q(`insert into objectif (eglise_id, libelle, cible, date_fin, departement_id) values
      ($1, 'Général', 1, '2026-12-31', null), ($1, 'Médias', 1, '2026-12-31', 'd04'), ($1, 'Louange', 1, '2026-12-31', 'd07')`, [EGLISE]);
    expect((await db.as(m.u.respDep, 'select libelle from objectif order by libelle')).rows.map(r => r.libelle)).toEqual(['Général', 'Médias']);
  }));
  it('la mesure ne renvoie rien à qui n’a pas accès', () => tx(async db => {
    const m = await monde(db);
    expect((await db.as(m.u.berger1, `select mesure_objectif('fideles', null, null) as v`)).rows[0].v).toBeNull();
    expect((await db.as(m.u.tresorier, `select mesure_objectif('fideles', null, null) as v`)).rows[0].v).toBe('7');
  }));
});

describe('lot 5 : projets', () => {
  it('le conseil crée un projet, ajoute une action et une note ; le trésorier lit seulement', () => tx(async db => {
    const m = await monde(db);
    const p = (await db.as(m.u.conseil, `insert into projet (nom, responsable, date_debut, echeance, priorite, statut, budget) values ('Toiture', 'Ancien Démo', '2026-11-01', '2027-03-31', 'Haute', 'En cours', 2500000) returning id`)).rows[0].id;
    await db.as(m.u.conseil, `insert into projet_action (projet_id, titre, echeance) values ($1, 'Trois devis', '2026-12-10')`, [p]);
    await db.as(m.u.conseil, `insert into projet_journal (projet_id, type, texte) values ($1, 'Décision', 'Lancement validé')`, [p]);
    expect(n(await db.as(m.u.tresorier, 'select count(*) from projet_action'))).toBe(1);
    await expect(db.as(m.u.tresorier, `insert into projet_action (projet_id, titre) values ($1, 'X')`, [p])).rejects.toThrow(/row-level security/);
    expect(n(await db.as(m.u.berger1, 'select count(*) from projet'))).toBe(0);
  }));
  it('une note du journal ne se modifie pas et seul son auteur la retire', () => tx(async db => {
    const m = await monde(db);
    const p = (await db.q(`insert into projet (eglise_id, nom, responsable, date_debut, echeance) values ($1, 'P', 'R', '2026-11-01', '2026-12-01') returning id`, [EGLISE])).rows[0].id;
    const j = (await db.as(m.u.conseil, `insert into projet_journal (projet_id, texte) values ($1, 'Note') returning id`, [p])).rows[0].id;
    expect((await db.as(m.u.conseil, `update projet_journal set texte = 'Changé' where id = $1`, [j])).rowCount).toBe(0);
    expect((await db.as(m.u.secretariat, `delete from projet_journal where id = $1`, [j])).rowCount).toBe(0);
    expect((await db.as(m.u.conseil, `delete from projet_journal where id = $1`, [j])).rowCount).toBe(1);
  }));
  it('l’échéance d’un projet suit sa date de début', () => tx(async db => {
    const m = await monde(db);
    await expect(db.as(m.u.admin, `insert into projet (nom, responsable, date_debut, echeance) values ('P', 'R', '2026-12-01', '2026-11-01')`)).rejects.toThrow(/check/);
  }));
});

describe('lot 5 : statistiques', () => {
  it('le conseil obtient les indicateurs agrégés ; le berger est refusé', () => tx(async db => {
    const m = await monde(db);
    await db.q(`insert into comptage (eglise_id, date, culte, hommes, femmes, enfants) values ($1, '2026-11-15', 'Autre', 100, 150, 50)`, [EGLISE]);
    await db.q(`insert into nouveau (eglise_id, date_venue, nom, statut) values ($1, '2026-11-08', 'N1', 'intégré'), ($1, '2026-10-04', 'N2', 'en suivi')`, [EGLISE]);
    const s = (await db.as(m.u.conseil, `select statistiques('2026-11-20') as s`)).rows[0].s;
    expect(s.croissance.fideles).toBe(7);
    expect(s.croissance.presence4).toBe(300);
    expect(s.croissance.nouveauxMois).toBe(1);
    expect(s.croissance.nouveauxParMois).toHaveLength(12);
    expect(s.integration.integres).toBe(1);
    expect(s.integration.jamaisAppeles).toBe(1);
    expect(s.integration.sansBerger).toBe(2);
    expect(s.integration.absencesParSemaine).toHaveLength(8);
    expect(s.integration.presenceGc).toHaveLength(12);
    await expect(db.as(m.u.berger1, `select statistiques()`)).rejects.toThrow(/droit/);
  }));
});
