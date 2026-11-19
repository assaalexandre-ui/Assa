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

import { messageCreationCompte } from './erreurs';

describe('messageCreationCompte', () => {
  it('signale une clé secrète absente', () => {
    expect(messageCreationCompte(null, false)).toBe("La clé secrète Supabase (SUPABASE_SERVICE_ROLE_KEY) n'est pas configurée dans Vercel.");
  });
  it('signale une clé secrète refusée par Supabase', () => {
    expect(messageCreationCompte({ status: 401, message: 'Invalid API key' }, true)).toBe('La clé secrète Supabase configurée dans Vercel est refusée : vérifiez qu’elle commence par sb_secret_ et qu’elle est complète.');
    expect(messageCreationCompte({ status: 403, message: 'User not allowed' }, true)).toContain('refusée');
  });
  it('signale un email déjà utilisé', () => {
    expect(messageCreationCompte({ status: 422, message: 'A user with this email address has already been registered' }, true)).toBe('Un compte existe déjà avec cet email.');
  });
  it('donne la raison de Supabase sinon', () => {
    expect(messageCreationCompte({ status: 400, message: 'Password should be at least 6 characters' }, true)).toBe('Création du compte impossible (Password should be at least 6 characters).');
  });
});
