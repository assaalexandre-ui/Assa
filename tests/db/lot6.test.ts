import { describe, it, expect } from 'vitest';
import { tx, monde, n, EGLISE } from './helpers';

const fonds = async (db: Parameters<Parameters<typeof tx>[0]>[0]) =>
  (await db.q(`insert into fonds (eglise_id, nom, type) values ($1, 'Dîmes', 'Fonds permanent') returning id`, [EGLISE])).rows[0].id as string;

describe('lot 6 : dîmes et offrandes', () => {
  it('le trésorier saisit ; le conseil et le pasteur lisent ; le secrétariat et le berger ne voient rien', () => tx(async db => {
    const m = await monde(db);
    const f = await fonds(db);
    await db.as(m.u.tresorier, `insert into don (date, fonds_id, montant, canal, fidele_id) values ('2026-11-15', $1, 25000, 'Wave', $2)`, [f, m.f1[0]]);
    expect(n(await db.as(m.u.conseil, 'select count(*) from don'))).toBe(1);
    expect(n(await db.as(m.u.pasteur, 'select count(*) from don'))).toBe(1);
    await expect(db.as(m.u.pasteur, `insert into don (date, fonds_id, montant) values ('2026-11-15', $1, 1000)`, [f])).rejects.toThrow(/row-level security/);
    expect(n(await db.as(m.u.secretariat, 'select count(*) from don'))).toBe(0);
    expect(n(await db.as(m.u.berger1, 'select count(*) from fonds'))).toBe(0);
  }));
  it('celui qui saisit un encaissement ne le valide pas ; une autre personne le peut', () => tx(async db => {
    const m = await monde(db);
    const f = await fonds(db);
    const d = (await db.as(m.u.tresorier, `insert into don (date, fonds_id, montant) values ('2026-11-15', $1, 5000) returning id`, [f])).rows[0].id;
    await expect(db.as(m.u.tresorier, `update don set statut = 'Validé' where id = $1`, [d])).rejects.toThrow(/autre personne/);
    await db.as(m.u.admin, `update don set statut = 'Validé' where id = $1`, [d]);
    await expect(db.as(m.u.tresorier, `insert into don (date, fonds_id, montant, statut) values ('2026-11-15', $1, 5000, 'Validé')`, [f])).rejects.toThrow(/d'abord saisi/);
  }));
});

describe('lot 6 : budget et dépenses', () => {
  it('une dépense demandée est validée par une autre personne, qui est enregistrée', () => tx(async db => {
    const m = await monde(db);
    const d = (await db.as(m.u.tresorier, `insert into depense (date, objet, montant) values ('2026-11-18', 'Achat de chaises', 150000) returning id`)).rows[0].id;
    await expect(db.as(m.u.tresorier, `update depense set statut = 'Validée' where id = $1`, [d])).rejects.toThrow(/ne peut pas la valider/);
    await db.as(m.u.admin, `update depense set statut = 'Validée' where id = $1`, [d]);
    const r = (await db.q('select statut, valide_par from depense where id = $1', [d])).rows[0];
    expect(r).toEqual({ statut: 'Validée', valide_par: m.u.admin });
    await db.as(m.u.tresorier, `update depense set statut = 'Payée' where id = $1`, [d]);
    await expect(db.as(m.u.tresorier, `update depense set valide_par = $2 where id = $1`, [d, m.u.tresorier]).then(async () => (await db.q('select valide_par from depense where id = $1', [d])).rows[0].valide_par)).resolves.toBe(m.u.admin);
  }));
  it('le menu Projets voit le total dépensé par projet sans lire les dépenses', () => tx(async db => {
    const m = await monde(db);
    const p = (await db.q(`insert into projet (eglise_id, nom, responsable, date_debut, echeance) values ($1, 'Toiture', 'R', '2026-11-01', '2027-03-31') returning id`, [EGLISE])).rows[0].id;
    await db.q(`insert into depense (eglise_id, date, objet, montant, projet_id, statut) values ($1, '2026-11-10', 'Tôles', 800000, $2, 'Payée'), ($1, '2026-11-12', 'Devis refusé', 50000, $2, 'Refusée')`, [EGLISE, p]);
    expect(n(await db.as(m.u.secretariat, 'select count(*) from depense'))).toBe(0);
    expect((await db.as(m.u.secretariat, 'select depense from depenses_projets()')).rows).toEqual([{ depense: '800000' }]);
    expect((await db.as(m.u.berger1, 'select * from depenses_projets()')).rows).toEqual([]);
  }));
});

describe('lot 6 : communication et patrimoine', () => {
  it('le fidèle lit les annonces publiées, pas les brouillons ; le secrétariat publie', () => tx(async db => {
    const m = await monde(db);
    await db.as(m.u.secretariat, `insert into annonce (titre, texte, publie) values ('Veillée', 'Vendredi 22 h', true), ('Brouillon', 'À relire', false)`);
    expect((await db.as(m.u.membre, 'select titre from annonce')).rows.map(r => r.titre)).toEqual(['Veillée']);
    expect(n(await db.as(m.u.moniteur, 'select count(*) from annonce'))).toBe(1);
    expect(n(await db.as(m.u.pasteur, 'select count(*) from annonce'))).toBe(2);
    await expect(db.as(m.u.membre, `insert into annonce (titre, texte) values ('X', 'Y')`)).rejects.toThrow(/row-level security/);
  }));
  it('le trésorier gère l’inventaire ; le responsable de département le lit seulement', () => tx(async db => {
    const m = await monde(db);
    const a = (await db.as(m.u.tresorier, `insert into article (article, categorie, quantite, etat, valeur) values ('Console de mixage', 'Sono et instruments', 1, 'Bon', 1200000) returning id`)).rows[0].id;
    await db.as(m.u.tresorier, `insert into entretien (date, article_id, intervention, cout) values ('2026-11-10', $1, 'Révision', 30000)`, [a]);
    expect(n(await db.as(m.u.respDep, 'select count(*) from entretien'))).toBe(1);
    await expect(db.as(m.u.respDep, `insert into article (article) values ('X')`)).rejects.toThrow(/row-level security/);
    expect(n(await db.as(m.u.berger1, 'select count(*) from article'))).toBe(0);
  }));
});

describe('lot 6 : statistiques financières et objectif « montant encaissé »', () => {
  it('réservées à qui lit les dîmes ; le secrétariat (statistiques sans finances) est refusé', () => tx(async db => {
    const m = await monde(db);
    const f = await fonds(db);
    await db.q(`insert into don (eglise_id, date, fonds_id, montant, canal) values ($1, '2026-11-15', $2, 30000, 'Wave'), ($1, '2026-10-04', $2, 10000, 'Espèces')`, [EGLISE, f]);
    const s = (await db.as(m.u.conseil, `select statistiques_finances('2026-11-20') as s`)).rows[0].s;
    expect(s.encaisse).toBe(40000);
    expect(s.mobileMoney).toBe(30000);
    expect(s.encaissementsParMois).toHaveLength(12);
    await expect(db.as(m.u.secretariat, `select statistiques_finances()`)).rejects.toThrow(/financières/);
    await db.q(`insert into objectif (eglise_id, libelle, mesure, cible, date_debut, date_fin) values ($1, 'Collecte', 'dons', 40000, '2026-01-01', '2099-12-31')`, [EGLISE]);
    expect((await db.as(m.u.conseil, `select valeur, statut from objectif_suivi`)).rows[0]).toEqual({ valeur: '40000', statut: 'Atteint' });
  }));
});
