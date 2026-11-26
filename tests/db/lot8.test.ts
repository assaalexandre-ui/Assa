import { describe, it, expect } from 'vitest';
import { tx, monde, EGLISE } from './helpers';

describe('lot 8 : données des recommandations', () => {
  it('le conseil obtient le résumé chiffré, sans aucun nom de fidèle ; le berger est refusé', () => tx(async db => {
    const m = await monde(db);
    await db.q(`insert into nouveau (eglise_id, date_venue, nom, statut) values ($1, '2026-11-01', 'Nouveau Secret', 'en suivi')`, [EGLISE]);
    await db.q(`insert into tache (eglise_id, titre, responsable, echeance, statut) values ($1, 'Réparer le portail', 'R', '2026-11-01', 'À faire')`, [EGLISE]);
    const d = (await db.as(m.u.conseil, `select donnees_recommandations('2026-11-20') as d`)).rows[0].d;
    expect(d.jamaisAppeles72h).toBe(1);
    expect(d.sansBerger).toBe(2);
    expect(d.tachesEnRetard).toEqual(['Réparer le portail']);
    expect(JSON.stringify(d)).not.toContain('Nouveau Secret');
    expect(JSON.stringify(d)).not.toContain('A1');
    expect(d.finances).not.toBeNull();
    await expect(db.as(m.u.berger1, `select donnees_recommandations()`)).rejects.toThrow(/droit/);
  }));
  it('les droits des menus suivent l’artefact', () => tx(async db => {
    const m = await monde(db);
    const droits = async (u: string) => (await db.as(u, `select menu, acces from role_menu where menu in ('reco', 'rapports') and role_code = (select role_code from profil where id = auth.uid()) order by menu`)).rows;
    expect(await droits(m.u.tresorier)).toEqual([{ menu: 'rapports', acces: 'r' }]);
    expect(await droits(m.u.conseil)).toEqual([{ menu: 'rapports', acces: 'r' }, { menu: 'reco', acces: 'r' }]);
  }));
});
