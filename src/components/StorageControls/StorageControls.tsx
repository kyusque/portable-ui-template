import { useRef } from 'react'
import './StorageControls.css'

interface StorageControlsProps {
  disabled: boolean
  onExport: () => Promise<void> | void
  onImport: (file: File) => Promise<void> | void
  onCollect: () => Promise<void> | void
  onClear: () => Promise<void> | void
}

export function StorageControls({
  disabled,
  onExport,
  onImport,
  onCollect,
  onClear,
}: StorageControlsProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="storage-controls">
      <button type="button" disabled={disabled} onClick={() => void onExport()}>Export data</button>
      <button type="button" disabled={disabled} onClick={() => fileRef.current?.click()}>Import data</button>
      <input
        ref={fileRef}
        type="file"
        accept=".duckdb,application/vnd.duckdb"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void onImport(file)
          event.target.value = ''
        }}
      />
      <button type="button" disabled={disabled} onClick={() => void onCollect()}>Garbage collect assets</button>
      <button type="button" disabled={disabled} onClick={() => void onClear()}>Clear cache</button>
    </div>
  )
}
