import { describe, it, expect } from 'vitest';
import { ENTITES, lireChamps } from './entites';

const fd = (o: Record<string, string>) => { const f = new FormData(); Object.entries(o).forEach(([k, v]) => f.set(k, v)); return f; };

describe('lireChamps', () => {
  it('lit un comptage : nombres entiers, vides à null', () => {
    const r = lireChamps(ENTITES.comptage, fd({ date: '2026-11-15', culte: 'Culte de semaine', hommes: '120', femmes: '', enfants: '30', nouveaux: '2', notes: '  ' }));
    expect(r).toEqual({ ok: true, valeurs: { date: '2026-11-15', culte: 'Culte de semaine', hommes: 120, femmes: null, enfants: 30, nouveaux: 2, notes: null } });
  });
  it('normalise le téléphone', () => {
    const r = lireChamps(ENTITES.poste_accueil, fd({ date: '2026-11-15', poste: 'Parking', agent: 'Yao', contact: '0707123456' }));
    expect(r.ok && r.valeurs.contact).toBe('+225 07 07 12 34 56');
  });
  it('signale les champs obligatoires manquants avec leur libellé', () => {
    expect(lireChamps(ENTITES.evenement, fd({ titre: '', type: 'Culte', date: '' }))).toEqual({ ok: false, erreur: 'Champ obligatoire : Titre, Date.' });
  });
  it('refuse une date de fin avant la date de début', () => {
    expect(lireChamps(ENTITES.evenement, fd({ titre: 'Convention', type: 'Convention', date: '2026-12-10', date_fin: '2026-12-08' }))).toEqual({ ok: false, erreur: 'La date de fin doit suivre la date de début.' });
  });
});
