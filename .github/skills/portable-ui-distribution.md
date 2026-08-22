# Distribution Formats

## 1. GitHub Pages (`docs/`)

Built with `pnpm build:pages`. Outputs a static site to `docs/` for hosting on GitHub Pages.

Configure in repository Settings → Pages → Source: `docs/` branch.

**Vite config key**: `build.outDir = 'docs'`

## 2. Static Site (`static_site/`)

Built with `pnpm build:static`. A self-contained static web app suitable for:
- Local file serving
- Embedding in other environments
- Distribution as a ZIP

**Vite config key**: `build.outDir = 'static_site'`

## 3. Component Library (`dist/`)

Built with `pnpm build:lib`. Exports individual React components as ES modules.

Structure:
```
dist/
  components/
    SampleComponent/
      index.js        # ES module
      index.d.ts      # TypeScript types
      binding.js      # Framework-agnostic binding
```

Consumers can import:
```javascript
import { SampleComponent } from 'portable-ui-template/dist/components/SampleComponent';
```

## 4. Streamlit Integration (`streamlit_<package_name>/`)

A Python package wrapping the component as a Streamlit custom component.

Each component directory contains:
- `__init__.py` — Python API
- `frontend/` — symlink or copy of built component assets

Usage:
```python
from streamlit_sample import sample_component
value = sample_component(data={"key": "value"})
```

## Samples

Each distribution format includes a `sample/` demonstrating:
- How to pass data in
- How to receive events/output
- How to handle the DuckDB export/import flow
