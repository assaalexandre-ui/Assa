import { describe, it, expect } from 'vitest';
import { phone, frDate, frMonth, isoWeek, weekLabel, fullName } from './format';

describe('format', () => {
  it('normalise les numéros ivoiriens', () => {
    expect(phone('0707123456')).toBe('+225 07 07 12 34 56');
    expect(phone('07 07 12 34 56')).toBe('+225 07 07 12 34 56');
    expect(phone('+2250505050505')).toBe('+225 05 05 05 05 05');
    expect(phone('123')).toBe('123');
    expect(phone('')).toBe('');
  });
  it('calcule la semaine ISO', () => {
    expect(isoWeek('2026-11-19')).toBe('2026-W47');
    expect(isoWeek('2027-01-01')).toBe('2026-W53');
    expect(weekLabel('2026-W47')).toBe('semaine 47');
  });
  it('affiche les dates en français', () => {
    expect(frDate('')).toBe('—');
    expect(frDate(null)).toBe('—');
    expect(frDate('2026-11-02')).toBe('2 nov. 2026');
    expect(frMonth('2026-10')).toBe('octobre 2026');
  });
  it('assemble nom et prénoms', () => {
    expect(fullName({ nom: 'Yao', prenoms: 'Christelle' })).toBe('Yao Christelle');
    expect(fullName({ nom: 'Bamba', prenoms: null })).toBe('Bamba');
    expect(fullName(null)).toBe('—');
  });
});
