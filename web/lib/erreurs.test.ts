import { describe, it, expect } from 'vitest';
import { messageErreur } from './erreurs';

describe('messageErreur', () => {
  it('garde les messages métier de la base (P0001)', () => {
    expect(messageErreur({ code: 'P0001', message: 'Ce berger suit déjà 15 brebis.' })).toBe('Ce berger suit déjà 15 brebis.');
  });
  it('traduit un refus des règles d’accès', () => {
    expect(messageErreur({ code: '42501', message: 'new row violates row-level security policy for table "fidele"' })).toBe("Vous n'avez pas le droit de faire cette action.");
  });
  it('donne un message générique sinon', () => {
    expect(messageErreur({ code: '23505', message: 'duplicate key' })).toBe('Enregistrement impossible, réessayez.');
    expect(messageErreur(null)).toBe('Enregistrement impossible, réessayez.');
  });
});
