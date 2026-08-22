# portable-ui-duckdb

## Role

Use this skill when changing browser database initialization or its assets.
DuckDB-WASM is selected for SQL over JSON and binary data, while the app
remains usable as a static artifact with no backend.

## Decisions

- Import workers and WASM modules from `@duckdb/duckdb-wasm`; never rely on a
  CDN for a distributable build.
- Open an in-memory database, restore validated application data from browser
  storage, and expose explicit JSON export/import for sharing.
- Keep initialization in `src/domain/duckdb.ts`; targets must not fork it.
- Treat a corrupt or incompatible cache as disposable, not as a startup crash.

## Evaluation

A change is acceptable only if a freshly served artifact initializes without
network services, performs CRUD and export/import in the browser, and includes
all worker/WASM files it references. A failed cache restore must leave a usable
empty database.

## Verification

Run `pnpm build:pages`, inspect `docs/assets/`, then serve `docs/` with a local
static server and test the flows above in a browser. Repeat a production
preview when the change affects the default build.
