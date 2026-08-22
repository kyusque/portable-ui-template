# portable-ui-duckdb

## Purpose

Use DuckDB-WASM as a local DB that runs in the browser, keeping it reproducible
even in static deployments such as GitHub Pages.
Implementation decisions prioritise "can the distribution artifact start on its
own without CDN dependencies?"

## Decision Criteria

1. **Are all required assets included in the distribution?**
   - `docs/` or `static_site/` alone must be sufficient to launch the app.
   - `.wasm` files and workers must be emitted as part of the build output.
2. **Does everything stay in the browser?**
   - Initialisation, CRUD, export, and import must all work without any
     external service or network access.
3. **Is the delta between distribution formats small?**
   - The same DB initialisation code must be reusable across `dist/`, `docs/`,
     and `static_site/`.
   - Avoid forking the implementation per distribution target.

## Design Decisions

### 1. Ship DuckDB-WASM assets locally

Instead of CDN bundles like `getJsDelivrBundles()`, Vite imports the `.wasm`
files and workers directly from the npm package.  This means the output of
`pnpm build:pages` alone is enough to verify whether the app runs on GitHub
Pages.

### 2. DB in memory; persistence via browser storage

- Runtime DB: `:memory:`
- Cross-session restore: `localStorage` cache
- External sharing: JSON export / import

This separation preserves startup speed and portability while keeping state
without any server dependency.

### 3. Keep the data schema minimal and SQL-friendly

- `items`: UI data
- `assets`: binary content

DuckDB is chosen because it can query both JSON and binary data through a
single SQL surface — not merely as a KVS.

## Verification Checklist

- After `pnpm build:pages`, DuckDB-WASM `.wasm` and worker files exist in `docs/`.
- `pnpm preview` opens the page without DB initialisation errors.
- Export / Import / Clear Cache all work in the browser.

## Related Skills

- `portable-ui-architecture.md`
- `portable-ui-data-model.md`
- `portable-ui-distribution.md`

