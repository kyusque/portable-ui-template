# portable-ui-template

[日本語 README](README_ja.md)

A React and Vite template for building portable UI components. It includes a
shared editable record grid, Browser DuckDB-WASM/OPFS persistence, Streamlit
adapters, and documented design rules for each boundary.

**GitHub Pages:** <https://kyusque.github.io/portable-ui-template/>

![Browser record grid](images/browser-demo.png)

## Prerequisites

- [pnpm](https://pnpm.io/installation) 11.22.0, as pinned by
  `packageManager`
- [uv](https://docs.astral.sh/uv/getting-started/installation/) for Python
  dependency management and compatible Python downloads

On Windows, install both tools with winget:

```bash
winget install pnpm.pnpm
winget install astral-sh.uv
```

The Windows pnpm package includes the Node.js runtime used by Vite, so a
separate Node.js installation is not required. On other platforms, follow the
official pnpm and uv installation instructions. `uv sync` and `uv run` download
a compatible Python release when one is not already available.

## Setup

```bash
pnpm install
uv sync
```

Run the Browser development server:

```bash
pnpm dev
```

Build the Streamlit widgets and run the development demo:

```bash
pnpm build:streamlit
uv run streamlit run streamlit_sample/app.py
```

## Build targets

| Command | Output | Consumer |
| --- | --- | --- |
| `pnpm build` | `dist/portable-ui-template/` | Default Browser package |
| `pnpm build:pages` | `docs/index.html` + `docs/duckdb-wasm/` | GitHub Pages |
| `pnpm build:static` | `static-site/index.html` | CDN-backed standalone handoff |
| `pnpm build:streamlit` | `streamlit_portable_ui_sample/frontend/` | Streamlit custom components |

The Pages entry inlines application JavaScript and CSS, and keeps the DuckDB
Worker/WASM runtime in `docs/duckdb-wasm/`. The standalone artifact is one
HTML file that loads the pinned DuckDB runtime from the CDN. Each Streamlit
widget is also one HTML file with its JavaScript and CSS inlined.

## Layout

```text
.github/skills/                  # Design rules and verification criteria
docs/index.html                  # GitHub Pages entry
docs/duckdb-wasm/                # GitHub Pages DuckDB runtime
static-site/index.html           # CDN-backed standalone artifact
dist/portable-ui-template/       # Default Browser package
streamlit_portable_ui_sample/    # Packaged Streamlit components
streamlit_sample/app.py          # Streamlit integration and DuckDB example
src/
  components/                    # Shared React presentation components
  App.tsx                        # Default Browser integration example
  hooks/                         # Default Browser React hooks
  storage/                       # Browser persistence implementation
  adapters/                      # Non-default host adapters
  entries/                       # Thin host-specific mounts
```

## Data contract

Browser and Python exports share the following DuckDB schema:

```sql
CREATE TABLE records (
  key TEXT NOT NULL PRIMARY KEY,
  data JSON
);

CREATE TABLE assets (
  hash TEXT NOT NULL PRIMARY KEY,
  content BLOB NOT NULL,
  size INTEGER NOT NULL
);
```

Record JSON stores asset references and metadata; binary data exists only in
`assets`. The Browser app stores its database in OPFS and supports `.duckdb`
export and import.

## Skills

| Skill | Apply when |
| --- | --- |
| `portable-ui-architecture.md` | Changing source boundaries or project structure |
| `portable-ui-component-design.md` | Changing shared UI, component contracts, editing state, or adapters |
| `portable-ui-storage.md` | Changing persistence, DuckDB, CAS, cache, or import/export |
| `portable-ui-delivery.md` | Changing build targets or distribution artifacts |
