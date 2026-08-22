import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

const target = process.env.BUILD_TARGET

const outDir = target === 'pages'
  ? 'docs'
  : target === 'static'
    ? 'static_site'
    : target === 'streamlit_sample_component'
      ? 'streamlit_portable_ui_sample/frontend/SampleComponent'
      : target === 'streamlit_note_list'
        ? 'streamlit_portable_ui_sample/frontend/NoteList'
        : 'dist'

const entryOverride: Record<string, string> = {
  streamlit_sample_component: '/src/entries/SampleComponent/main.tsx',
  streamlit_note_list: '/src/entries/NoteList/main.tsx',
}

function swapEntryPlugin(entry: string | undefined): Plugin {
  return {
    name: 'swap-entry',
    transformIndexHtml(html) {
      if (!entry) return html
      return html.replace(/src="\/src\/main\.tsx"/, `src="${entry}"`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), swapEntryPlugin(entryOverride[target ?? ''])],
  build: {
    outDir,
    emptyOutDir: true,
  },
  optimizeDeps: {
    exclude: ['@duckdb/duckdb-wasm'],
  },
})
