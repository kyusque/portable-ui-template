import './SampleAssetInspector.css'

export interface SampleAssetInspectorRow {
  hash: string
  size: number
}

interface SampleAssetInspectorProps {
  rows: SampleAssetInspectorRow[]
}

export function SampleAssetInspector({ rows }: SampleAssetInspectorProps) {
  return (
    <section className="sample-asset-inspector">
      <h2>assets</h2>
      <p>BLOB content is not rendered in this raw table.</p>
      <table>
        <thead><tr><th>hash</th><th>size</th></tr></thead>
        <tbody>
          {rows.map((row) => <tr key={row.hash}><td><code>{row.hash}</code></td><td>{row.size}</td></tr>)}
          {rows.length === 0 && <tr><td colSpan={2}>No assets</td></tr>}
        </tbody>
      </table>
    </section>
  )
}
