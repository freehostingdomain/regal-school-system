const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

class PreparedQuery {
  constructor(sql) {
    let idx = 1;
    this.pgSql = sql.replace(/\?/g, () => `$${idx++}`);
    this.isInsert = sql.trim().toUpperCase().startsWith('INSERT');
    this.hasReturning = sql.toUpperCase().includes('RETURNING');
  }

  async get(...params) {
    const result = await getPool().query(this.pgSql, params);
    return result.rows[0];
  }

  async all(...params) {
    const result = await getPool().query(this.pgSql, params);
    return result.rows;
  }

  async run(...params) {
    let sql = this.pgSql;
    if (this.isInsert && !this.hasReturning) {
      sql += ' RETURNING id';
      const result = await getPool().query(sql, params);
      return { changes: result.rowCount, lastInsertRowid: result.rows[0]?.id || null };
    }
    const result = await getPool().query(sql, params);
    return { changes: result.rowCount, lastInsertRowid: null };
  }
}

function getDb() {
  return {
    prepare(sql) { return new PreparedQuery(sql); },
    transaction(fn) {
      return async (...args) => {
        const client = await getPool().connect();
        try {
          await client.query('BEGIN');
          const txDb = {
            prepare(sql) {
              let idx = 1;
              const pgSql = sql.replace(/\?/g, () => `$${idx++}`);
              const isInsert = sql.trim().toUpperCase().startsWith('INSERT');
              const hasReturning = sql.toUpperCase().includes('RETURNING');
              return {
                get: async (...p) => (await client.query(pgSql, p)).rows[0],
                all: async (...p) => (await client.query(pgSql, p)).rows,
                run: async (...p) => {
                  let s = pgSql;
                  if (isInsert && !hasReturning) {
                    s += ' RETURNING id';
                    const r = await client.query(s, p);
                    return { changes: r.rowCount, lastInsertRowid: r.rows[0]?.id || null };
                  }
                  const r = await client.query(s, p);
                  return { changes: r.rowCount, lastInsertRowid: null };
                }
              };
            }
          };
          await fn(txDb)(...args);
          await client.query('COMMIT');
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }
      };
    }
  };
}

function initDatabase() {
  console.log('Database: Using Supabase PostgreSQL');
}

module.exports = { getDb, initDatabase, getPool };
