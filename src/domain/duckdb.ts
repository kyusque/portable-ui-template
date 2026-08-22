import * as duckdb from '@duckdb/duckdb-wasm';
import duckdbMvpModule from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import duckdbEhModule from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import duckdbMvpWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdbEhWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

const CACHE_KEY = 'duckdb-cache';
const BUNDLES: duckdb.DuckDBBundles = {
  mvp: {
    mainModule: duckdbMvpModule,
    mainWorker: duckdbMvpWorker,
  },
  eh: {
    mainModule: duckdbEhModule,
    mainWorker: duckdbEhWorker,
  },
};

let _db: duckdb.AsyncDuckDB | null = null;

export async function initDB(): Promise<duckdb.AsyncDuckDB> {
  if (_db) return _db;

  const bundle = await duckdb.selectBundle(BUNDLES);
  if (!bundle.mainWorker) {
    throw new Error('DuckDB worker bundle is unavailable');
  }

  const worker = new Worker(bundle.mainWorker);
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

  await db.open({ path: ':memory:' });

  // Ensure schema exists
  const conn = await db.connect();
  await conn.query(`
    CREATE TABLE IF NOT EXISTS records (
      key  TEXT NOT NULL PRIMARY KEY,
      data JSON
    );
  `);
  await conn.query(`
    CREATE TABLE IF NOT EXISTS assets (
      hash    TEXT NOT NULL PRIMARY KEY,
      content BLOB NOT NULL,
      size    INTEGER NOT NULL
    );
  `);
  await conn.close();

  const cached = loadCache();
  if (cached) {
    try {
      await importDB(db, Uint8Array.from(atob(cached), (char) => char.charCodeAt(0)).buffer);
    } catch {
      clearCache();
    }
  }

  _db = db;
  return db;
}

export async function getDB(): Promise<duckdb.AsyncDuckDB> {
  if (!_db) return initDB();
  return _db;
}

// ---- Cache (localStorage) ----

export async function persistDB(db: duckdb.AsyncDuckDB): Promise<void> {
  const buffer = await exportDB(db);
  const base64 = btoa(
    String.fromCharCode(...new Uint8Array(buffer))
  );
  try {
    localStorage.setItem(CACHE_KEY, base64);
  } catch {
    // Storage quota exceeded — skip caching silently
  }
}

function loadCache(): string | null {
  try {
    return localStorage.getItem(CACHE_KEY);
  } catch {
    return null;
  }
}

export function clearCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}

// ---- Export / Import ----

export async function exportDB(db: duckdb.AsyncDuckDB): Promise<ArrayBuffer> {
  const conn = await db.connect();
  // Export all tables to a temporary parquet in-memory; use JSON as portable format
  const result = await conn.query(`
    SELECT 'records' AS tbl, key, NULL AS size, data::TEXT AS data
    FROM records
    UNION ALL
    SELECT 'assets' AS tbl, hash AS key, size, encode(content, 'base64')::TEXT AS data
    FROM assets
  `);
  await conn.close();

  const rows = result.toArray().map((r) => r.toJSON());
  const json = JSON.stringify({ version: 1, rows });
  return new TextEncoder().encode(json).buffer;
}

export async function importDB(
  db: duckdb.AsyncDuckDB,
  buffer: ArrayBuffer
): Promise<void> {
  const json = new TextDecoder().decode(buffer);
  const { rows } = JSON.parse(json) as { version: number; rows: Record<string, unknown>[] };

  const conn = await db.connect();
  // Clear existing data before import
  await conn.query('DELETE FROM records');
  await conn.query('DELETE FROM assets');

  for (const row of rows) {
    if (row['tbl'] === 'records') {
      const key = (row['key'] as string).replace(/'/g, "''");
      const data = (row['data'] as string).replace(/'/g, "''");
      await conn.query(`
        INSERT OR REPLACE INTO records (key, data)
        VALUES ('${key}', '${data}')
      `);
    } else if (row['tbl'] === 'assets') {
      const hash = (row['key'] as string).replace(/'/g, "''");
      const size = Number(row['size']);
      const b64 = (row['data'] as string).replace(/'/g, "''");
      await conn.query(`
        INSERT OR REPLACE INTO assets (hash, content, size)
        VALUES ('${hash}', decode('${b64}', 'base64'), ${size})
      `);
    }
  }
  await conn.close();
}
