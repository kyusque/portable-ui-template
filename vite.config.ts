import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const packageName = 'portable-ui-template'

const entryOverride: Record<string, string> = {
  streamlit_sample_record_grid: '/src/entries/streamlit-sample-record-grid/main.tsx',
  streamlit_sample_table_inspector: '/src/entries/streamlit-sample-table-inspector/main.tsx',
}

function swapEntryPlugin(entry: string | undefined): Plugin {
  return {
    name: 'swap-entry',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        if (!entry) return html
        return html.replace('/src/main.tsx', entry)
      },
    },
  }
}

function inlineHtmlAssets(outDir: string): Plugin {
  return {
    name: 'inline-html-assets',
    apply: 'build',
    closeBundle() {
      const directory = resolve(outDir)
      const htmlPath = resolve(directory, 'index.html')
      const inlinedAssets = new Set<string>()
      let html = readFileSync(htmlPath, 'utf8')
      html = html.replace(/<script\b[^>]*\bsrc="\.\/([^"]+)"[^>]*><\/script>/g, (_match, asset: string) => {
        inlinedAssets.add(asset)
        const source = readFileSync(resolve(directory, asset), 'utf8').replace(/<\/script/gi, '<\\/script')
        return `<script type="module">${source}</script>`
      })
      html = html.replace(/<link\b[^>]*\bhref="\.\/([^"]+\.css)"[^>]*>/g, (_match, asset: string) => {
        inlinedAssets.add(asset)
        return `<style>${readFileSync(resolve(directory, asset), 'utf8')}</style>`
      })
      writeFileSync(htmlPath, html)
      for (const asset of inlinedAssets) {
        rmSync(resolve(directory, asset), { force: true })
      }
      const assetsDirectory = resolve(directory, 'assets')
      if (existsSync(assetsDirectory) && readdirSync(assetsDirectory).length === 0) {
        rmSync(assetsDirectory, { recursive: true, force: true })
      }
    },
  }
}

function relocateDuckdbAssets(outDir: string): Plugin {
  return {
    name: 'relocate-duckdb-assets',
    apply: 'build',
    closeBundle() {
      const directory = resolve(outDir)
      const assetsDirectory = resolve(directory, 'assets')
      if (!existsSync(assetsDirectory)) return
      const duckdbDirectory = resolve(directory, 'duckdb-wasm')
      mkdirSync(duckdbDirectory, { recursive: true })
      const assetNames = readdirSync(assetsDirectory)
      for (const assetName of assetNames) {
        renameSync(resolve(assetsDirectory, assetName), resolve(duckdbDirectory, assetName))
      }
      rmSync(assetsDirectory, { recursive: true, force: true })

      const htmlPath = resolve(directory, 'index.html')
      let html = readFileSync(htmlPath, 'utf8')
      for (const assetName of assetNames) {
        html = html.replaceAll(`./${assetName}`, `./duckdb-wasm/${assetName}`)
      }
      writeFileSync(htmlPath, html)
    },
  }
}

export default defineConfig(({ mode }) => {
  const target = process.env.BUILD_TARGET ?? (mode === 'development' ? undefined : mode)
  const isStreamlitWidget = target?.startsWith('streamlit_') ?? false
  const shouldInlineHtmlAssets = isStreamlitWidget || target === 'pages' || target === 'static'
  const outDir = target === 'pages'
    ? 'docs'
    : target === 'static'
      ? 'static-site'
      : target === 'streamlit_sample_record_grid'
        ? 'streamlit_portable_ui_sample/frontend/SampleRecordGridWidget'
        : target === 'streamlit_sample_table_inspector'
          ? 'streamlit_portable_ui_sample/frontend/SampleTableInspectorWidget'
        : `dist/${packageName}`

  return {
    base: shouldInlineHtmlAssets ? './' : '/',
    plugins: [
      react(),
      swapEntryPlugin(entryOverride[target ?? '']),
      ...(shouldInlineHtmlAssets ? [inlineHtmlAssets(outDir)] : []),
      ...(target === 'pages' ? [relocateDuckdbAssets(outDir)] : []),
    ],
    build: {
      outDir,
      emptyOutDir: true,
    },
    optimizeDeps: {
      exclude: ['@duckdb/duckdb-wasm'],
    },
  }
})
