# portable-ui-storage

## Role

Use this skill when changing persisted state, browser database initialization,
cache behavior, or import/export. Storage is an implementation boundary, never
the source of domain behavior.

## Contract

Use the smallest generic contract that supports the UI access pattern:

```sql
CREATE TABLE records (
  key  TEXT NOT NULL PRIMARY KEY,
  data JSON
);
```

`key` is opaque application data. A namespace may use
`<namespace>:<identifier>`, but domain code must not depend on partition-key or
sort-key vocabulary. Feature-specific fields stay inside `data` and may evolve
with backwards-compatible defaults.

Binary data uses a separate content-addressed `assets` table. JSON records
reference assets by hash; the hash remains an implementation detail.

The portable Browser and Python export contract is:

```sql
CREATE TABLE records (
  key  TEXT NOT NULL PRIMARY KEY,
  data JSON
);

CREATE TABLE assets (
  hash    TEXT NOT NULL PRIMARY KEY,
  content BLOB NOT NULL,
  size    INTEGER NOT NULL
);
```

`data` stores `imageHash`/`imageType` and attachment `{ hash, name, type }`
metadata; the corresponding bytes exist only in `assets`.

## Decisions

- Keep DuckDB-WASM initialization in `src/storage/duckdb.ts`; non-default targets must not
  fork it.
- Bundle workers and WASM for the self-contained `docs/` artifact. Other
  targets may use the pinned `@duckdb/duckdb-wasm` CDN distribution.
- Persist the browser-local DuckDB file to OPFS, then create the schema.
- Checkpoint the DuckDB database after successful mutations.
- Keep `.duckdb` file import/export independent from browser-local persistence.
- Treat corrupt or incompatible cache data as disposable and leave a usable
  empty database.
- Make cache clearing explicit and harmless when browser storage is unavailable.

## DuckDB-WASM and OPFS constraints

- Use a stable DuckDB-WASM release that has passed the browser persistence
  scenario. Do not upgrade to a development build without rerunning it. The
  `1.33.1-dev*` line created zero-byte `opfs://` database files after reload in
  Chromium; `1.32.0` is the current verified version.
- Open the database once at `opfs://<file-name>` with
  `opfs.fileHandling: 'auto'`. Do not combine this with manual
  `registerOPFSFileName`, `registerFileHandle`, `createWritable`, or a
  synchronous access handle for the same file: those approaches either create
  a competing access handle or bypass DuckDB's durable file path.
- A React Strict Mode effect may run twice. Keep both the completed DB instance
  and the in-flight initialization promise at module scope, so every caller
  waits for one initialization.
- Call `CHECKPOINT` and `flushFiles()` after a successful mutation. Export the
  OPFS file as the `.duckdb` artifact; import into the active database and
  persist it before updating UI state.
- Store binary files in `assets` with `read_blob()` as a table function. Arrow
  BLOB values are `Uint8Array` views; copy the view into a fresh `Uint8Array`
  before making a `Blob`, otherwise its backing buffer can include unrelated
  bytes.
- A component draft is not persisted state. Follow
  `portable-ui-component-design` for draft ownership and explicit Save; verify
  each completed write with a separate raw-table query or equivalent database
  read rather than inferring persistence from visible inputs.
- Record JSON may retain attachment metadata (hash, filename, MIME type), but
  BLOB data stays only in `assets`. Render images and downloadable attachments
  from asset Blob URLs, and revoke URLs when the rendered records are replaced.
- A Python-managed Streamlit export must use the same two-table contract.
  Decode widget data URLs, hash the raw bytes with SHA-256, deduplicate them
  into `assets`, and replace UI assets with Browser-compatible hash references
  in record JSON. Do not export data URLs into the `content` column.
- Normalize Streamlit asset metadata before displaying it in an inspector:
  show `{ name, hash }`, not a potentially huge data URL. For initial
  server-side files, hash file bytes; for Save results, hash the decoded data
  URL bytes. This lets the inspector explain the same CAS model used by Browser.

## Design process

1. List the reads and writes the UI actually needs.
2. Choose and document a deterministic key namespace.
3. Keep feature fields inside `data`.
4. Define import/export compatibility before changing the shape.
5. Prefer one query surface over feature-specific tables.

## Evaluation and verification

Two unrelated components must share the contract, and records must remain
addressable after reload without renaming tables. Reject designs that require
joins for a component's primary view or leak database terms into domain types.

Test first load, mutation, reload, clear cache, valid import, malformed import,
storage quota/unavailability, and asset handling. A freshly served artifact must
perform CRUD and import/export without network services. Verify persistence by
checking that the OPFS `.duckdb` file is nonzero and that a new browser context
restores the row, not merely that a draft input still displays a value.

## Completion rule

Do not treat a storage change as complete based on a successful build alone.
In a real browser, execute the relevant UI actions and confirm the resulting
rows, assets, OPFS file, and exported file. Exercise the actual save button,
upload an image and a non-image attachment, confirm the image has a usable
`blob:` URL, then export, clear, import, and confirm rows and assets restore.

For Python exports, open the generated `.duckdb` with Python DuckDB and assert
the `records` JSON and `assets` BLOB schemas, record hash references, nonempty
asset bytes, and asset count before claiming Browser compatibility.
