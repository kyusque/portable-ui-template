import type * as duckdb from '@duckdb/duckdb-wasm';

/**
 * Compute SHA-256 hash of content and return as hex string.
 */
async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Store a File or Blob as a CAS asset.
 *
 * Binary data is stored as a native BLOB column via DuckDB's
 * `registerFileBuffer` + `read_blob()` — no Base64 encoding in storage.
 * Returns the SHA-256 hash (content address).
 *
 * Example — file upload via <input type="file">:
 *
 *   async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
 *     const file = e.target.files?.[0];
 *     if (!file) return;
 *     const hash = await storeAsset(db, file);
 *     // Save the hash reference into an item:
 *     await upsert('post#1', { title: 'My post', imageHash: hash });
 *   }
 */
export async function storeAsset(
  db: duckdb.AsyncDuckDB,
  file: File | Blob
): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const hash = await sha256Hex(buffer);
  const size = buffer.byteLength;

  const conn = await db.connect();
  // CAS deduplication: only insert if hash is not already stored
  const existing = await conn.query(
    `SELECT hash FROM assets WHERE hash = '${hash}'`
  );
  if (existing.toArray().length === 0) {
    // Register bytes as a virtual file, then insert via read_blob()
    const tmpName = `asset_${hash}`;
    await db.registerFileBuffer(tmpName, bytes);
    await conn.query(`
      INSERT INTO assets (hash, content, size)
      VALUES ('${hash}', read_blob('${tmpName}'), ${size})
    `);
    await db.dropFile(tmpName);
  }
  await conn.close();
  return hash;
}

/**
 * Retrieve an asset's raw bytes by hash.
 *
 * duckdb-wasm returns query results as Apache Arrow record batches.
 * Binary (BLOB) columns map to Arrow's `Binary` type, so `.get(i)`
 * returns a `Uint8Array` directly — no manual decoding needed.
 *
 * Returns null if the hash is not found.
 */
export async function getAsset(
  db: duckdb.AsyncDuckDB,
  hash: string
): Promise<Uint8Array | null> {
  const conn = await db.connect();
  const result = await conn.query(
    `SELECT content FROM assets WHERE hash = '${hash}'`
  );
  await conn.close();

  if (result.numRows === 0) return null;

  // Access the Arrow Binary column directly — returns Uint8Array per cell
  const col = result.getChild('content');
  return col?.get(0) as Uint8Array ?? null;
}

/**
 * Create an object URL for an asset stored in the DB.
 *
 * The Blob API serves data directly from memory, so there are
 * no CORS restrictions — the content never crosses an origin boundary.
 * This works for images, PDFs, audio, video, or any binary format.
 *
 * Example:
 *   const url = await getAssetURL(db, hash, 'image/png');
 *   imgElement.src = url;
 *   // Release when done to avoid memory leaks:
 *   URL.revokeObjectURL(url);
 *
 * For non-image formats:
 *   const url = await getAssetURL(db, hash, 'application/pdf');
 *   iframeElement.src = url ?? '';
 */
export async function getAssetURL(
  db: duckdb.AsyncDuckDB,
  hash: string,
  mimeType = 'application/octet-stream'
): Promise<string | null> {
  const bytes = await getAsset(db, hash);
  if (!bytes) return null;
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: mimeType });
  return URL.createObjectURL(blob);
}

