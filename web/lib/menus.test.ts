import { describe, it, expect } from 'vitest';
import { visibleMenus } from './menus';

describe('menus visibles selon les droits', () => {
  it('berger : accueil, bergers, fidèles', () => {
    expect(visibleMenus({ accueil: 'r', bergers: 'w', fideles: 'r' }).map(m => m.id)).toEqual(['accueil', 'bergers', 'fideles']);
  });
  it('fidèle (membre) : accueil seulement', () => {
    expect(visibleMenus({ accueil: 'r' }).map(m => m.id)).toEqual(['accueil']);
  });
  it('administrateur : tous les menus du test, dans l’ordre de la barre latérale', () => {
    expect(visibleMenus({ accueil: 'r', bergers: 'w', adnh: 'w', fideles: 'w', admin: 'w' }).map(m => m.id)).toEqual(['accueil', 'bergers', 'adnh', 'fideles', 'admin']);
  });
});
