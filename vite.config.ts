import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const outDir = process.env.BUILD_TARGET === 'pages'
  ? 'docs'
  : process.env.BUILD_TARGET === 'static'
    ? 'static_site'
    : process.env.BUILD_TARGET === 'streamlit'
      ? 'streamlit_sample/frontend'
      : 'dist'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir,
    emptyOutDir: true,
  },
  optimizeDeps: {
    exclude: ['@duckdb/duckdb-wasm'],
  },
})
