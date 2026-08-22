# portable-ui-distribution

## Purpose

Deliver the same UI and data model to multiple output targets, each suited to
the recipient's environment.
The guiding criterion is "can we hand off only the minimum dependencies the
consumer needs?" — adding more targets is never the goal in itself.

## Why Multiple Output Targets?

### `docs/`

Provides an immediately runnable environment via GitHub Pages.
For review, validation, and demos, "being able to interact with it in a browser
first" is the core value.

### `static_site/`

Covers cases where only the build artifact needs to leave the repository.
Suitable for ZIP distribution or hosting on a server that is not GitHub Pages.

### `dist/`

Enables the template to be reused as a component library.
For consumers who want to embed individual components rather than an entire app,
a library output is more appropriate than a static site.

### `streamlit_portable_ui_sample/`

Allows early evaluation of the Python-side integration story.
The connection point with other runtimes is included as a verification target
from the start, not just the frontend in isolation.

## Decision Criteria

1. **Is the unit each consumer receives clearly defined?**
   - Demo viewers → `docs/`
   - Consumers who want to deploy the artifact as-is → `static_site/`
   - Consumers who want to embed components → `dist/`
2. **Is the difference between targets driven by consumer needs, not
   implementation convenience?**
   - Each target is just the same UI repackaged for a different purpose.
   - Separate implementations per target must not proliferate.
3. **Is there a defined verification method for each target?**
   - `docs/`: functional in the browser
   - `dist/`: referenceable as a library
   - `streamlit_portable_ui_sample/`: readable as an integration sample

## Build Scripts

| Command | Output | Purpose |
|---------|--------|---------|
| `pnpm build` | `dist/` | Default build |
| `pnpm build:pages` | `docs/` | GitHub Pages |
| `pnpm build:static` | `static_site/` | Standalone static site |
| `pnpm build:streamlit` | `streamlit_portable_ui_sample/frontend/*/` | All Streamlit component builds |
| `pnpm build:streamlit:sample_component` | `streamlit_portable_ui_sample/frontend/SampleComponent/` | SampleWidget only |
| `pnpm build:streamlit:note_list` | `streamlit_portable_ui_sample/frontend/NoteList/` | NoteListWidget only |

Vite's `build.outDir` and `build.rollupOptions.input` are switched per
`BUILD_TARGET` so that the same app source produces different outputs.
This keeps the distribution strategy difference confined to build configuration.

## Streamlit Custom Component Package

`streamlit_portable_ui_sample/frontend/<ComponentName>/` is **not** managed by
Python. It is the location where Vite places static assets (each component's
own `index.html` + JS/CSS).  One component = one subdirectory = one
`declare_component` call.

```bash
# Build all Streamlit component frontends
pnpm build:streamlit
# → streamlit_portable_ui_sample/frontend/SampleComponent/index.html + assets/
# → streamlit_portable_ui_sample/frontend/NoteList/index.html + assets/

# Run the sample app
cd streamlit_sample
pip install -e ..          # installs streamlit-portable-ui-sample
pip install -r requirements.txt
streamlit run app.py
```

Python usage:

```python
from streamlit_portable_ui_sample import SampleWidget, NoteListWidget

result = SampleWidget(data={"title": "Hello", "count": 0}, key="s1")
notes  = NoteListWidget(key="n1")
```

`streamlit_portable_ui_sample/__init__.py` exports one Python function per
React component. Each function calls `declare_component` with the matching
`frontend/<ComponentName>/` path.  Python never interprets the build artifacts
— it only serves them via iframe.

