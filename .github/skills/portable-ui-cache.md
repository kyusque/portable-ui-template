# portable-ui-cache

## Purpose

This template caches UI state and data in the browser.
No backend is required — all data lives entirely on the client side.

The current implementation uses **DuckDB-WASM**, but the design concern is
"usability as a browser cache."  The interface is kept stable so that a future
swap to a different storage backend (direct IndexedDB, OPFS, SQLite-WASM, etc.)
does not require changes to the rest of the codebase.

See `src/domain/duckdb.ts` for the implementation.

## Role of the Cache

- Persist `items` / `assets` table data across browser sessions.
- The app works without a cache (optional) — it starts from an empty state on first load.
- When a cache exists, the previous state is restored automatically.

## Persistence

Serialized state (JSON) is saved to `localStorage`.
For large datasets, consider switching to `IndexedDB`.

- Auto-save after every mutation.
- Cache key: `duckdb-cache`

## Export / Import

The cache can be downloaded and uploaded as a file.

```typescript
import { exportDB, importDB } from '@/domain/duckdb';

// Export → save to file
const buffer = await exportDB(db);

// Import ← load from file
await importDB(db, buffer);
```

This enables data migration between devices and snapshot sharing.

## Assets (Binary Data)

Raw binary data (images, PDFs, etc.) is stored in the `assets` table.

### Insert (file upload)

```typescript
import { storeAsset } from '@/domain/assets';

async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;
  const hash = await storeAsset(db, file);
  await upsert('post#1', { title: 'My post', imageHash: hash });
}
```

### Display (Blob API — no CORS required)

Bytes retrieved from the DB are converted to an object URL via the Blob API.
No remote request is made, so **CORS restrictions do not apply**.

```typescript
import { getAssetURL } from '@/domain/assets';

const url = await getAssetURL(db, hash, 'image/png');
imgElement.src = url ?? '';
// Release when no longer needed: URL.revokeObjectURL(url)
```

## Current Implementation: DuckDB-WASM

- Full SQL available in the browser (aggregations, JSON path queries, etc.).
- BLOBs are inserted via `registerFileBuffer` + `read_blob()` and read back
  as `Uint8Array` through Apache Arrow's Binary column (`.getChild().get()`).
- Schema changes can be applied incrementally with `ALTER TABLE`.
- Well-suited for iterating on data structure.

To migrate to a different storage backend in the future, replace `src/domain/duckdb.ts`.

