import { describe, it, expect } from 'vitest';
import { menu, sousMenus, visibleMenus } from './menus';

describe('menus visibles selon les droits', () => {
  it('berger : accueil, bergers, fidèles', () => {
    expect(visibleMenus({ accueil: 'r', bergers: 'w', fideles: 'r' }).map(m => m.id)).toEqual(['accueil', 'bergers', 'fideles']);
  });
  it('fidèle (membre) : accueil seulement', () => {
    expect(visibleMenus({ accueil: 'r' }).map(m => m.id)).toEqual(['accueil']);
  });
  it('administrateur : tous les menus, dans l’ordre de la barre latérale de l’artefact', () => {
    const tous = { accueil: 'r', bergers: 'w', adnh: 'w', fideles: 'w', admin: 'w', cellules: 'w', gc: 'w', agenda: 'w', culte: 'w', formations: 'w', departements: 'w', reunions: 'w', organigramme: 'w', priere: 'w', enfants: 'w', rdv: 'w', evenements: 'w', pilotage: 'w', stats: 'w', objectifs: 'w', projets: 'w', dons: 'w', budget: 'w', communication: 'w', patrimoine: 'w', evangelisation: 'w', ceremonies: 'w' } as const;
    expect(visibleMenus(tous).map(m => m.id)).toEqual(['accueil', 'cellules', 'bergers', 'adnh', 'formations', 'departements', 'gc', 'reunions', 'agenda', 'pilotage', 'organigramme', 'stats', 'objectifs', 'projets', 'fideles', 'priere', 'enfants', 'rdv', 'culte', 'evenements', 'evangelisation', 'ceremonies', 'dons', 'budget', 'communication', 'patrimoine', 'admin']);
  });
  it('fidèle (membre) avec le lot 2 : accueil et programmation', () => {
    expect(visibleMenus({ accueil: 'r', agenda: 'r' }).map(m => m.id)).toEqual(['accueil', 'agenda']);
  });
  it('masque Statistiques › Finances sans le menu des dîmes, et « Préparer un message » en lecture seule', () => {
    expect(sousMenus(menu('stats')!, { stats: 'r' }).map(x => x[0])).toEqual(['croissance', 'integration', 'formations']);
    expect(sousMenus(menu('stats')!, { stats: 'r', dons: 'r' }).map(x => x[0])).toContain('finances');
    expect(sousMenus(menu('communication')!, { communication: 'r' }).map(x => x[0])).toEqual(['annonces']);
  });
});
