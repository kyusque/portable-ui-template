import './SampleTableInspector.css'

export interface SampleTableInspectorRow {
  key: string
  data: string
}

interface SampleTableInspectorProps {
  rows: SampleTableInspectorRow[]
}

export function SampleTableInspector({ rows }: SampleTableInspectorProps) {
  return (
    <section className="sample-table-inspector">
      <h2>records</h2>
      <table>
        <thead><tr><th>key</th><th>data</th></tr></thead>
        <tbody>
          {rows.map((row) => <tr key={row.key}><td>{row.key}</td><td><code>{row.data}</code></td></tr>)}
          {rows.length === 0 && <tr><td colSpan={2}>No records</td></tr>}
        </tbody>
      </table>
    </section>
  )
}
