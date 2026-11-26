import { describe, it, expect } from 'vitest';
import { periodeDe, textePdf } from './rapport';

describe('rapport', () => {
  it('calcule les périodes', () => {
    expect(periodeDe('mois', '2026-11-20')).toEqual(['2026-11-01', '2026-11-30']);
    expect(periodeDe('moisprec', '2026-01-10')).toEqual(['2025-12-01', '2025-12-31']);
    expect(periodeDe('trimestre', '2026-11-20')).toEqual(['2026-10-01', '2026-12-31']);
    expect(periodeDe('anneeprec', '2026-11-20')).toEqual(['2025-01-01', '2025-12-31']);
    expect(periodeDe('perso', '2026-11-20', '2026-02-01', '2026-02-28')).toEqual(['2026-02-01', '2026-02-28']);
    expect(periodeDe('perso', '2026-11-20', '2026-03-01', '2026-02-01')).toEqual(['2026-11-01', '2026-11-30']);
  });
  it('nettoie le texte pour le PDF', () => {
    expect(textePdf('« Œuvre » – 1 250 F…')).toBe('" OEuvre " - 1 250 F...');
  });
});
