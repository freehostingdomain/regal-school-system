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
    prepare(sql) { return new PreparedQuery(sql); }
  };
}

function initDatabase() {
  console.log('Database: Using Supabase PostgreSQL');
}

module.exports = { getDb, initDatabase, getPool };
