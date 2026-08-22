# portable-ui-delivery

## Role

Use this skill when deciding where or how a build is delivered. Outputs differ
because consumers receive different handoffs, not because application logic is
duplicated.

## Targets

- `docs/index.html` + `docs/duckdb-wasm/`: browser-reviewable GitHub Pages
  package artifact
- `static-site/index.html`: CDN-backed portable static artifact for other
  hosting or archives
- `dist/portable-ui-template/`: default package artifact
- `streamlit_portable_ui_sample/frontend/SampleRecordGridWidget/`: iframe assets for
  the Python record-grid custom component
- `streamlit_portable_ui_sample/frontend/SampleTableInspectorWidget/`: iframe
  assets for the Python table-inspector custom component

Keep source and data contracts shared. Add a target only when its consumer,
entry point, and verification method are distinct; otherwise extend an
existing target.

## Build and asset constraints

- Use Vite modes to select a target (`vite build --mode <target>`). Do not use
  POSIX inline environment assignments such as `BUILD_TARGET=pages vite build`;
  they do not work in Windows shells.
- A Worker cannot be constructed directly from a cross-origin CDN URL.
  `static-site/index.html` fetches the pinned worker source and creates a
  same-origin Blob Worker. The self-contained Pages package instead bundles
  Worker and WASM assets in its package-root `duckdb-wasm/` directory.
- Commit `docs/` when it is the configured GitHub Pages publish source, and
  commit `static-site/index.html` when publishing the CDN-backed standalone
  handoff. Both are intentionally small, reviewable delivery artifacts.
- Build directories contain generated third-party Worker code. Treat it as an
  artifact, not source: lint and review authored source separately, and do not
  interpret generated-worker lint findings as application regressions.
- `streamlit_portable_ui_sample/` is the packaged Streamlit target.
  `streamlit_sample/` is a development demo that verifies the package; it must
  import the packaged wrapper rather than duplicate frontend assets.
- A Streamlit iframe cannot read server filesystem paths. Accept an explicit
  path only in the Python wrapper, read and validate it server-side, then pass
  a bounded download URL or data URL to the widget. Never expose a local path
  to browser code. The current spreadsheet wrapper caps transferred attachments
  at 5 MiB; larger files need a host-authenticated download endpoint.
- Follow `portable-ui-component-design` for widget draft ownership. The Python
  binding supplies initial values and an optional incrementing `revision` when
  a host deliberately needs to reset the widget; Save returns the component's
  current result to Python.
- Build each Streamlit widget as a self-contained `index.html`: inline its
  generated JS and CSS, then remove the widget `assets/` directory. Verify no
  `src="./assets/..."` or `href="./assets/..."` remains in the HTML. This avoids
  iframe-relative asset failures and makes the package handoff one file/widget.
- GitHub Pages serves the repository's `docs/` directory directly. Emit the
  Pages entry at `docs/index.html`, not under a second application/package-name
  directory, and do not create a redirecting landing page. In this target,
  “use the package name” means name the DuckDB runtime directory
  `docs/duckdb-wasm/`, rather than leaving Vite's opaque `assets/` directory.
  Inline the entry JS and CSS into the Pages and static-site `index.html`
  files. Move the Pages DuckDB Worker/WASM and helper modules to
  `docs/duckdb-wasm/`, then rewrite every inline dynamic-import path to
  `./duckdb-wasm/<file>`. The static artifact has a different constraint:
  `static-site/` contains only `index.html` and uses the pinned CDN.
- After rebuilding packaged frontend files, reinstall the Python package into
  the environment that runs Streamlit and restart that server. An HTTP 200 from
  Streamlit can still hide an old imported wrapper or an iframe ImportError.
  Verify the live page has no error and each expected custom component renders.
- Keep the development demo visually normal. Show the editor first, then its
  inspector and adjacent import/export controls; demonstrate data flow through the ordinary
  `app.py` variables and widget calls rather than rendering `st.code` blocks in
  the application UI. Keep that complete Python-side exchange, including any
  normalization and `.duckdb` export, in the single `streamlit_sample/app.py`
  sample file instead of scattering it across demo helpers.

## Evaluation

For each target, identify who consumes it, the smallest handoff, and its real
verification path. Reject targets that duplicate an existing directory or alter
domain behavior for packaging reasons.

## Verification

Run the matching `pnpm build:*` command and inspect the output in isolation.
Serve the Pages and static artifacts locally and exercise them in a browser.
Load Streamlit output through its Python wrapper. Verify Pages has exactly
`docs/index.html` and `docs/duckdb-wasm/` (no `docs/assets/` and no nested
package directory), and that the entry resolves its Worker, helper module, and
`.wasm` files from `./duckdb-wasm/`. The standalone file must resolve them
through the pinned CDN.
