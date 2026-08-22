import * as duckdb from '@duckdb/duckdb-wasm';

const OPFS_FILE_NAME = 'portable-ui-state.duckdb';
const DUCKDB_CDN = 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.32.0/dist';
const bundleDuckdbAssets = import.meta.env.MODE === 'pages';

async function getBundles(): Promise<duckdb.DuckDBBundles> {
  if (!bundleDuckdbAssets) {
    return {
      mvp: {
        mainModule: `${DUCKDB_CDN}/duckdb-mvp.wasm`,
        mainWorker: `${DUCKDB_CDN}/duckdb-browser-mvp.worker.js`,
      },
      eh: {
        mainModule: `${DUCKDB_CDN}/duckdb-eh.wasm`,
        mainWorker: `${DUCKDB_CDN}/duckdb-browser-eh.worker.js`,
      },
    };
  }

  const [mvpModule, ehModule, mvpWorker, ehWorker] = await Promise.all([
    import('@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url'),
    import('@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url'),
    import('@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url'),
    import('@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url'),
  ]);
  return {
    mvp: { mainModule: mvpModule.default, mainWorker: mvpWorker.default },
    eh: { mainModule: ehModule.default, mainWorker: ehWorker.default },
  };
}

async function createWorker(workerUrl: string): Promise<Worker> {
  if (bundleDuckdbAssets) return new Worker(workerUrl);
  const response = await fetch(workerUrl);
  if (!response.ok) {
    throw new Error(`Unable to load DuckDB worker from CDN: ${response.status}`);
  }
  const source = await response.text();
  return new Worker(URL.createObjectURL(new Blob([source], { type: 'text/javascript' })));
}

let _db: duckdb.AsyncDuckDB | null = null;
let _initializing: Promise<duckdb.AsyncDuckDB> | null = null;

export async function initDB(): Promise<duckdb.AsyncDuckDB> {
  if (_db) return _db;
  if (_initializing) return _initializing;

  _initializing = initializeDB();
  try {
    return await _initializing;
  } finally {
    _initializing = null;
  }
}

async function initializeDB(): Promise<duckdb.AsyncDuckDB> {
  const bundle = await duckdb.selectBundle(await getBundles());
  if (!bundle.mainWorker) {
    throw new Error('DuckDB worker bundle is unavailable');
  }

  const worker = await createWorker(bundle.mainWorker);
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  await db.open({
    path: `opfs://${OPFS_FILE_NAME}`,
    accessMode: duckdb.DuckDBAccessMode.READ_WRITE,
    opfs: { fileHandling: 'auto' },
  });

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

  _db = db;
  return db;
}

export async function getDB(): Promise<duckdb.AsyncDuckDB> {
  if (!_db) return initDB();
  return _db;
}

// ---- Persistent cache (OPFS) ----

async function readOPFSFile(): Promise<ArrayBuffer | null> {
  try {
    const root = await navigator.storage.getDirectory();
    const handle = await root.getFileHandle(OPFS_FILE_NAME);
    return await (await handle.getFile()).arrayBuffer();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotFoundError') {
      return null;
    }
    throw error;
  }
}

export async function persistDB(db: duckdb.AsyncDuckDB): Promise<void> {
  const conn = await db.connect();
  try {
    await conn.query('CHECKPOINT');
  } finally {
    await conn.close();
  }
  await db.flushFiles();
}

export async function exportDB(db: duckdb.AsyncDuckDB): Promise<ArrayBuffer> {
  await persistDB(db);
  const cached = await readOPFSFile();
  if (!cached) {
    throw new Error('Browser database was not written to OPFS');
  }
  return cached;
}

export async function clearCache(db: duckdb.AsyncDuckDB): Promise<void> {
  const conn = await db.connect();
  try {
    await conn.query('DELETE FROM records');
    await conn.query('DELETE FROM assets');
    await conn.query('CHECKPOINT');
  } finally {
    await conn.close();
  }
  await persistDB(db);
}

export async function collectOrphanedAssets(db: duckdb.AsyncDuckDB): Promise<void> {
  const conn = await db.connect();
  try {
    await conn.query(`
      DELETE FROM assets
      WHERE NOT EXISTS (
        SELECT 1 FROM records
        WHERE data::TEXT LIKE '%' || assets.hash || '%'
      )
    `);
  } finally {
    await conn.close();
  }
  await persistDB(db);
}

// ---- Export / Import ----

export async function importDB(
  db: duckdb.AsyncDuckDB,
  buffer: ArrayBuffer
): Promise<void> {
  const fileName = `portable-ui-import-${Date.now()}.duckdb`;
  await db.registerFileBuffer(fileName, new Uint8Array(buffer));
  const conn = await db.connect();
  const escapedFileName = fileName.replace(/'/g, "''");
  try {
    await conn.query(`ATTACH '${escapedFileName}' AS imported (READ_ONLY)`);
    await conn.query('DELETE FROM records');
    await conn.query('DELETE FROM assets');
    await conn.query('INSERT INTO records SELECT * FROM imported.records');
    await conn.query('INSERT INTO assets SELECT * FROM imported.assets');
    await conn.query('DETACH imported');
    await conn.query('CHECKPOINT');
  } finally {
    await conn.close();
    await db.dropFile(fileName);
  }
}
