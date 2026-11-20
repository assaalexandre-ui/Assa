// Outils de test : chaque test tourne dans une transaction annulée à la fin.
// db.q() s'exécute en superutilisateur ; db.as(uid, ...) avec les droits d'un compte
// (rôle « authenticated » et jeton JWT simulé), ou en anonyme si uid est null.
import pg from 'pg';

export const DB_URL = process.env.DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const pool = new pg.Pool({ connectionString: DB_URL, max: 2 });

export type Db = {
  q: (sql: string, params?: unknown[]) => Promise<pg.QueryResult>;
  as: (uid: string | null, sql: string, params?: unknown[]) => Promise<pg.QueryResult>;
};

export async function tx<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  await c.query('begin');
  const db: Db = {
    q: (sql, params) => c.query(sql, params),
    as: async (uid, sql, params) => {
      await c.query('savepoint as_user');
      try {
        if (uid) {
          await c.query('set local role authenticated');
          await c.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: uid, role: 'authenticated' })]);
        } else {
          await c.query('set local role anon');
          await c.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ role: 'anon' })]);
        }
        const r = await c.query(sql, params);
        await c.query('reset role');
        await c.query('release savepoint as_user');
        return r;
      } catch (e) {
        await c.query('rollback to savepoint as_user');
        await c.query('reset role');
        throw e;
      }
    },
  };
  try {
    return await fn(db);
  } finally {
    await c.query('rollback');
    c.release();
  }
}

export const EGLISE = '00000000-0000-0000-0000-000000000001';

export const COMPTES = ['admin', 'pasteur', 'secretariat', 'berger1', 'berger2', 'bergerSansFiche', 'adnh', 'membre', 'desactive', 'respGc', 'tresorier', 'formateur', 'conseil', 'respDep', 'intercession', 'moniteur'] as const;
export type Comptes = Record<(typeof COMPTES)[number], string>;

const ROLE_DE: Record<(typeof COMPTES)[number], string> = {
  admin: 'admin', pasteur: 'pasteur', secretariat: 'secretariat', berger1: 'berger', berger2: 'berger',
  bergerSansFiche: 'berger', adnh: 'adnh', membre: 'membre', desactive: 'pasteur', respGc: 'resp_gc', tresorier: 'tresorier', formateur: 'formateur', conseil: 'conseil', respDep: 'resp_dep', intercession: 'intercession', moniteur: 'moniteur',
};

/** Crée un compte (auth.users + profil) par rôle de test et renvoie leurs identifiants. */
export async function fixtures(db: Db): Promise<Comptes> {
  // Les tests de droits partent de tables métier vides (les données fictives sont retirées dans la transaction).
  await db.q(`do $$ begin
    if to_regclass('public.cellule') is not null then
      delete from rapport_cellule; delete from gc_absence; delete from gc_presence; delete from gc_passage; delete from evenement; delete from assemblee; delete from comptage; delete from poste_accueil;
    end if;
  end $$`);
  await db.q(`do $$ begin
    if to_regclass('public.priere') is not null then
      delete from priere; delete from pointage_enfant; delete from enfant; delete from rdv; delete from inscription_evenement;
    end if;
  end $$`);
  await db.q(`do $$ begin
    if to_regclass('public.reunion') is not null then
      delete from tache; delete from reunion; delete from inscription_formation; delete from session_formation;
      delete from planning_service; delete from rapport_departement; delete from responsable;
    end if;
  end $$`);
  await db.q(`do $$ begin
    if to_regclass('public.objectif') is not null then
      if to_regclass('public.don') is not null then
        delete from don; delete from fonds; delete from depense; delete from ligne_budget; delete from annonce; delete from entretien; delete from article;
      end if;
      delete from objectif; delete from projet_journal; delete from projet_action; delete from projet;
    end if;
  end $$`);
  await db.q('delete from appel; delete from nouveau; delete from absence; delete from releve_absence; delete from fidele; update profil set berger_id = null; delete from berger');
  await db.q(`do $$ begin if to_regclass('public.cellule') is not null then delete from cellule; end if; end $$`);
  const out = {} as Comptes;
  for (const k of COMPTES) {
    const { rows } = await db.q(
      `insert into auth.users (id, instance_id, aud, role, email) values (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $1) returning id`,
      [`${k.toLowerCase()}@test.local`],
    );
    out[k] = rows[0].id;
    await db.q(`insert into profil (id, eglise_id, nom, email, role_code, actif) values ($1, $2, $3, $4, $5, $6)`, [
      out[k], EGLISE, `Test ${k}`, `${k.toLowerCase()}@test.local`, ROLE_DE[k], k !== 'desactive',
    ]);
  }
  return out;
}

/** Nombre renvoyé par une requête « select count(*) ». */
export const n = (r: pg.QueryResult) => Number(r.rows[0].count);

export type Monde = { u: Comptes; b1: string; b2: string; f1: string[]; f2: string[]; libres: string[] };

/** Deux bergers reliés à berger1/berger2, 3 brebis pour B1, 2 pour B2, 2 fidèles sans berger. */
export async function monde(db: Db): Promise<Monde> {
  const u = await fixtures(db);
  const berger = async (nom: string) => (await db.q(`insert into berger (eglise_id, nom) values ('00000000-0000-0000-0000-000000000001', $1) returning id`, [nom])).rows[0].id as string;
  const fidele = async (nom: string, b: string | null) => (await db.q(`insert into fidele (eglise_id, nom, berger_id) values ('00000000-0000-0000-0000-000000000001', $1, $2) returning id`, [nom, b])).rows[0].id as string;
  const b1 = await berger('Berger Un'), b2 = await berger('Berger Deux');
  await db.q('update profil set berger_id = $1 where id = $2', [b1, u.berger1]);
  await db.q('update profil set berger_id = $1 where id = $2', [b2, u.berger2]);
  const f1 = [await fidele('A1', b1), await fidele('A2', b1), await fidele('A3', b1)];
  const f2 = [await fidele('B1', b2), await fidele('B2', b2)];
  const libres = [await fidele('L1', null), await fidele('L2', null)];
  return { u, b1, b2, f1, f2, libres };
}

