# DuckDB-WASM Usage

## Initialization

DuckDB-WASM is initialized once at app startup and provided via React context (`DbContext`).

```typescript
import { initDB } from '@/db/duckdb';
const db = await initDB();
```

## Schema

On init, the database creates `items` and `assets` tables if they don't exist.

## Browser Caching

The database is serialized to an `ArrayBuffer` and stored in `localStorage` (small datasets) or `IndexedDB` (recommended for larger datasets):

- Key: `duckdb-cache`
- On startup: restore from cache if present.
- After mutations: auto-persist to cache.

## Export / Import

### Export

```typescript
import { exportDB } from '@/db/duckdb';
const buffer = await exportDB(db);
// Save buffer as a .duckdb file
```

### Import

```typescript
import { importDB } from '@/db/duckdb';
await importDB(db, buffer); // buffer from file input
```

## Patterns

### Insert Item

```typescript
await db.query(`
  INSERT OR REPLACE INTO items (pk, sk, data)
  VALUES ('User', 'user#1', '{"name":"Alice"}')
`);
```

### Query Items

```typescript
const result = await db.query(`SELECT * FROM items WHERE pk = 'User'`);
```

## Asset Handling

### BLOB を Arrow で扱う

duckdb-wasm はクエリ結果を Apache Arrow レコードバッチとして返す。
`BLOB` カラムは Arrow の `Binary` 型にマップされ、`.get(i)` で `Uint8Array` を直接取得できる。

挿入は `db.registerFileBuffer()` でバイト列を仮想ファイルとして登録し、
`read_blob()` で BLOB として INSERT する方法を使う。Base64 エンコードは不要。

### ファイルをアップロードして保存する

```typescript
import { storeAsset } from '@/db/assets';

// <input type="file" onChange={handleUpload} /> のハンドラ
async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;
  // BLOB として DB に格納、SHA-256 ハッシュを返す
  const hash = await storeAsset(db, file);
  // アイテムにハッシュ参照を保存
  await upsert('post#1', { title: 'My post', imageHash: hash });
}
```

### 保存した画像を表示する — CORS 不要

DB から取り出したバイト列を Blob API で object URL に変換するため、
リモートオリジンへのリクエストは発生せず **CORS 制約を受けない**。

```typescript
import { getAssetURL } from '@/db/assets';

const url = await getAssetURL(db, hash, 'image/png');
if (url) {
  imgElement.src = url;
  // コンポーネントのアンマウント時に解放する
  // URL.revokeObjectURL(url);
}
```

画像以外の任意のバイナリ形式にも使える：

```typescript
const url = await getAssetURL(db, hash, 'application/pdf');
iframeElement.src = url ?? '';
```

### 生バイト列を取得する

```typescript
import { getAsset } from '@/db/assets';

// Arrow Binary カラムから Uint8Array を直接取得
const bytes: Uint8Array | null = await getAsset(db, hash);
```

## Why DuckDB-WASM?

- **No backend needed**: runs entirely in the browser.
- **Full SQL**: aggregations, window functions, JSON path queries.
- **Flexible schema evolution**: add columns with `ALTER TABLE`.
- **Portable**: export/import as a single JSON file.
- **Fast iteration**: great for prototyping data shapes before backend commitment.

