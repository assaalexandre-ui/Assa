import { describe, it, expect } from 'vitest';
import { avancement, echeance, rappels } from './tableau';

const fr = (d: string) => d;

describe('tableau de bord', () => {
  it('calcule l’avancement à partir des actions faites', () => {
    expect(avancement('En cours', [{ statut: 'Fait' }, { statut: 'À faire' }, { statut: 'Fait' }, { statut: 'En cours' }])).toBe(50);
    expect(avancement('Terminé', [])).toBe(100);
    expect(avancement('En cours', [])).toBe(0);
  });
  it('signale retard, jour même et J-7', () => {
    expect(echeance('2026-11-18', false, '2026-11-20', fr)).toEqual({ texte: '2026-11-18 · 2 j de retard', ton: 'b' });
    expect(echeance('2026-11-20', false, '2026-11-20', fr)).toEqual({ texte: "Aujourd'hui", ton: 'b' });
    expect(echeance('2026-11-23', false, '2026-11-20', fr)).toEqual({ texte: '2026-11-23 · J-3', ton: 'w' });
    expect(echeance('2026-12-23', false, '2026-11-20', fr)).toEqual({ texte: '2026-12-23', ton: null });
    expect(echeance('2026-11-18', true, '2026-11-20', fr).ton).toBeNull();
  });
  it('liste les rappels à 7 jours, sans ce qui est terminé', () => {
    const p = [{ id: 'p1', nom: 'Toiture', statut: 'En cours', echeance: '2027-03-31', responsable: 'R' }, { id: 'p2', nom: 'Rentrée', statut: 'Terminé', echeance: '2026-10-15', responsable: 'R' }];
    const a = [
      { projet_id: 'p1', titre: 'Choisir', statut: 'En cours', echeance: '2026-11-18', responsable: null },
      { projet_id: 'p1', titre: 'Collecte', statut: 'À faire', echeance: '2026-11-23', responsable: null },
      { projet_id: 'p1', titre: 'Devis', statut: 'Fait', echeance: '2026-11-10', responsable: null },
      { projet_id: 'p1', titre: 'Travaux', statut: 'À faire', echeance: '2027-01-12', responsable: null },
    ];
    expect(rappels(p, a, '2026-11-20').map(r => r.titre)).toEqual(['Choisir', 'Collecte']);
  });
});
