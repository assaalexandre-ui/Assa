import { randomInt } from 'node:crypto';

// Sans caractères ambigus (0/O, 1/l/I) pour être dicté ou recopié sans erreur.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

export function motDePasseProvisoire(longueur = 12): string {
  return Array.from({ length: longueur }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
}
