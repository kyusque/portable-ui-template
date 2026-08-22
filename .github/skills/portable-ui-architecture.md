# Architecture & Design Principles

## Overview

This repository is a React + Vite template for building portable UI components with flexible distribution formats.

## Distribution Formats

| Format | Output Directory | Use Case |
|--------|-----------------|----------|
| GitHub Pages | `docs/` | Static site hosting via GitHub Pages |
| Static Site | `static_site/` | Self-contained static web app |
| Component library | `dist/` | Reusable React components + bindings |
| Streamlit | `streamlit_<package_name>/` | Python/Streamlit integration |

### Build Scripts

```bash
pnpm dev              # Development server
pnpm build            # Build all formats
pnpm build:pages      # Build to docs/ for GitHub Pages
pnpm build:static     # Build to static_site/
pnpm build:lib        # Build component library to dist/
pnpm preview          # Preview production build
```

## Data Architecture

### Single-Table Design (DynamoDB-style)

Each component uses a single-table structure with the following schema:

```
items table:
  pk        TEXT     -- Partition key (component/entity type)
  sk        TEXT     -- Sort key (ID or composite)
  data      JSON     -- Component-specific payload (KVS-style)
  created_at TIMESTAMP
  updated_at TIMESTAMP
```

- `pk` and `sk` together uniquely identify a record.
- `data` is a flexible JSON blob used as key-value store.
- Cross-component relationships use `pk`/`sk` references.

### Asset Table (Content-Addressable Storage)

Raw binary/blob data is stored separately in a CAS (Content-Addressable Storage) style:

```
assets table:
  hash      TEXT     -- SHA-256 hash of content (primary key)
  mime_type TEXT     -- MIME type of the asset
  content   BLOB     -- Raw binary content
  size      INTEGER  -- Byte size
  created_at TIMESTAMP
```

- Assets are deduplicated by content hash.
- Items can reference assets by `hash` in their `data` JSON.

### DuckDB-WASM

Both tables are managed via [duckdb-wasm](https://github.com/duckdb/duckdb-wasm) in the browser:

- Runs entirely in-browser via WebAssembly — no backend required.
- The in-memory database can be persisted to an `ArrayBuffer` and stored in:
  - `localStorage` / `IndexedDB` (browser cache)
  - Exported as a `.duckdb` file for sharing/backup
- Import from exported `.duckdb` files or CSV/JSON.

Benefits:
- Full SQL query capability on structured + semi-structured data.
- Schema evolution is easy to iterate on.
- Single unified query surface for both `items` and `assets`.

## Component Design

Each component in `src/components/` has:

1. A React component (`ComponentName.tsx`)
2. A domain type definition in `src/domain/`
3. A corresponding binding export in `dist/components/`

Bindings expose a stable API for use from non-React environments (e.g., vanilla JS, Python via Streamlit).

## Skills & Design Decisions

See other files in `.github/skills/` for specific design decisions:

- `portable-ui-data-model.md` — detailed data model rationale
- `portable-ui-duckdb.md` — DuckDB-WASM usage patterns and caching strategy
- `portable-ui-distribution.md` — distribution format details
- `portable-ui-components.md` — component authoring guidelines
