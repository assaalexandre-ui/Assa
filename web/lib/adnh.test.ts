import { describe, it, expect } from 'vitest';
import { statsParMois } from './adnh';

describe('statsParMois', () => {
  it('regroupe par mois, du plus récent au plus ancien', () => {
    const r = statsParMois([
      { date_venue: '2026-10-02', statut: 'intégré', appels: 2 },
      { date_venue: '2026-10-12', statut: 'en suivi', appels: 1 },
      { date_venue: '2026-10-20', statut: 'en suivi', appels: 0 },
      { date_venue: '2026-11-03', statut: 'en suivi', appels: 0 },
    ]);
    expect(r).toEqual([
      { mois: '2026-11', venus: 1, appeles: 0, integres: 0, taux: 0 },
      { mois: '2026-10', venus: 3, appeles: 2, integres: 1, taux: 33 },
    ]);
  });
  it('renvoie une liste vide sans données', () => {
    expect(statsParMois([])).toEqual([]);
  });
});
