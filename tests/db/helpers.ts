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

export const COMPTES = ['admin', 'pasteur', 'secretariat', 'berger1', 'berger2', 'bergerSansFiche', 'adnh', 'membre', 'desactive'] as const;
export type Comptes = Record<(typeof COMPTES)[number], string>;

const ROLE_DE: Record<(typeof COMPTES)[number], string> = {
  admin: 'admin', pasteur: 'pasteur', secretariat: 'secretariat', berger1: 'berger', berger2: 'berger',
  bergerSansFiche: 'berger', adnh: 'adnh', membre: 'membre', desactive: 'pasteur',
};

/** Crée un compte (auth.users + profil) par rôle de test et renvoie leurs identifiants. */
export async function fixtures(db: Db): Promise<Comptes> {
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
