import { describe, it, expect } from 'vitest';
import { tx, fixtures, n } from './helpers';

describe('socle : profils, rôles et droits', () => {
  it("anon n'a accès à aucune table", () => tx(async db => {
    await fixtures(db);
    await expect(db.as(null, 'select count(*) from profil')).rejects.toThrow(/permission denied/);
    await expect(db.as(null, 'select count(*) from role_menu')).rejects.toThrow(/permission denied/);
  }));

  it("chacun lit son profil, l'admin les lit tous", () => tx(async db => {
    const u = await fixtures(db);
    const moi = await db.as(u.membre, 'select id from profil');
    expect(moi.rows.map(r => r.id)).toEqual([u.membre]);
    expect(n(await db.as(u.admin, 'select count(*) from profil'))).toBeGreaterThanOrEqual(9);
  }));

  it("seul l'admin écrit dans role et role_menu", () => tx(async db => {
    const u = await fixtures(db);
    await expect(db.as(u.pasteur, `insert into role_menu (role_code, menu, acces) values ('membre', 'fideles', 'r')`)).rejects.toThrow(/row-level security/);
    await expect(db.as(u.pasteur, `insert into role (code, libelle) values ('x', 'X')`)).rejects.toThrow(/row-level security/);
    await db.as(u.admin, `insert into role_menu (role_code, menu, acces) values ('membre', 'fideles', 'r')`);
  }));

  it("un utilisateur ne change pas son propre rôle", () => tx(async db => {
    const u = await fixtures(db);
    await expect(db.as(u.membre, `update profil set role_code = 'admin' where id = $1`, [u.membre])).rejects.toThrow(/administrateur/);
    const r = await db.q('select role_code from profil where id = $1', [u.membre]);
    expect(r.rows[0].role_code).toBe('membre');
  }));

  it("un utilisateur peut changer son nom", () => tx(async db => {
    const u = await fixtures(db);
    const r = await db.as(u.membre, `update profil set nom = 'Nouveau nom' where id = $1`, [u.membre]);
    expect(r.rowCount).toBe(1);
  }));

  it("peut() suit role_menu", () => tx(async db => {
    const u = await fixtures(db);
    const p = (uid: string, m: string, a: string) => db.as(uid, 'select peut($1, $2) as ok', [m, a]).then(r => r.rows[0].ok);
    expect(await p(u.pasteur, 'bergers', 'w')).toBe(true);
    expect(await p(u.pasteur, 'admin', 'r')).toBe(false);
    expect(await p(u.secretariat, 'bergers', 'r')).toBe(true);
    expect(await p(u.secretariat, 'bergers', 'w')).toBe(false);
    expect(await p(u.membre, 'accueil', 'r')).toBe(true);
    expect(await p(u.desactive, 'bergers', 'r')).toBe(false);
  }));

  it("un compte désactivé ne lit rien", () => tx(async db => {
    const u = await fixtures(db);
    expect(n(await db.as(u.desactive, 'select count(*) from gc'))).toBe(0);
    expect(n(await db.as(u.pasteur, 'select count(*) from gc'))).toBe(12);
  }));

  it("les données de référence sont en place", () => tx(async db => {
    expect(n(await db.q('select count(*) from role'))).toBe(13);
    expect(n(await db.q('select count(*) from classe'))).toBe(4);
    expect(n(await db.q('select count(*) from eglise'))).toBe(1);
  }));
});
