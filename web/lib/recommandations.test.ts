import { describe, it, expect } from 'vitest';
import { recommandations, type Donnees } from './recommandations';

const base: Donnees = {
  jour: '2026-11-20',
  presence: { recents: 800, nbRecents: 4, precedents: 900, nbPrecedents: 4, total: 8 },
  nouveaux: 10, integres: 3, jamaisAppeles72h: 2, injoignables: 1,
  bergers: 4, relevesSemaine: 1, semaine: '2026-W47', sansBerger: 8, bergersSurcharges: 0,
  cellulesSansRapport: ['Cellule Angré'], departements: 12, departementsSansRapport: 10, departementsVides: 0,
  inscritsAbsents: 0, tachesEnRetard: ['Devis'], actionsEnRetard: 1,
  projets: [{ nom: 'Toiture', statut: 'En cours', echeance: '2027-03-31', budget: 1000, depense: 1200, actions: 4, faites: 1 }],
  gcIncomplets: 0, articlesAReparer: 0, entretiensDepasses: 0,
  objectifs: [{ libelle: 'Accueillir 40 nouveaux', mesure: 'nouveaux', cible: 40, valeur: 10, debut: '2026-01-01', fin: '2026-12-31', statut: 'En cours' }],
  finances: null,
};

describe('recommandations', () => {
  it('signale la baisse de présence, l’intégration faible et les relevés manquants', () => {
    const r = recommandations(base);
    expect(r.performance.map(x => x.domaine)).toEqual(['Présence', 'Intégration', 'Suivi pastoral', 'Suivi pastoral', 'Cellules', 'Départements']);
    expect(r.performance[0].constat).toContain('baisse de 11 %');
  });
  it('classe les problèmes par priorité et détecte le budget dépassé', () => {
    const r = recommandations(base);
    expect(r.problemes.every((x, i, a) => i === 0 || ['haute', 'moyenne', 'conseil'].indexOf(a[i - 1].niveau) <= ['haute', 'moyenne', 'conseil'].indexOf(x.niveau))).toBe(true);
    expect(r.problemes.some(x => x.constat.includes('dépasse son budget'))).toBe(true);
  });
  it('calcule le rythme nécessaire pour un objectif en retard', () => {
    const o = recommandations(base).objectifs[0];
    expect(o.niveau).toBe('haute');
    expect(o.conseil).toContain('par mois');
  });
  it('ne parle pas de finances sans accès aux finances', () => {
    const r = recommandations(base);
    expect(Object.values(r).flat().some(x => x.domaine === 'Finances')).toBe(false);
  });
});
