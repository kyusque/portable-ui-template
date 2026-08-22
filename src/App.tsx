import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { SampleAssetInspector, type SampleAssetInspectorRow } from './components/SampleAssetInspector/SampleAssetInspector'
import { SampleRecordGrid, type SampleRecordGridRow } from './components/SampleRecordGrid/SampleRecordGrid'
import { SampleTableInspector, type SampleTableInspectorRow } from './components/SampleTableInspector/SampleTableInspector'
import { StorageControls } from './components/StorageControls/StorageControls'
import { getAssetURL, storeAsset } from './storage/assets'
import { clearCache, collectOrphanedAssets, exportDB, importDB, persistDB } from './storage/duckdb'
import { useDbContext } from './hooks/useDb'
import { useRecords } from './hooks/useItems'

type RecordData = Record<string, unknown>

interface Attachment {
  hash: string
  name: string
  type: string
}

function imageMimeType(value: unknown): string {
  return typeof value === 'string' && value.startsWith('image/') ? value : 'image/png'
}

function App() {
  const { db, ready, revision } = useDbContext()
  const { records, loading, upsert, remove } = useRecords<RecordData>(null)
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!db) return
    let disposed = false
    const urls: string[] = []
    void Promise.all(records.map(async (record) => {
      const hash = record.data.imageHash
      if (typeof hash !== 'string') return
      const url = await getAssetURL(db, hash, imageMimeType(record.data.imageType))
      if (!url || disposed) return
      urls.push(url)
      setImageUrls((current) => ({ ...current, [record.key]: url }))
    }))
    void Promise.all(records.flatMap((record) => getAttachments(record.data).map(async (attachment) => {
      const url = await getAssetURL(db, attachment.hash, attachment.type)
      if (!url || disposed) return
      urls.push(url)
      setAttachmentUrls((current) => ({ ...current, [attachment.hash]: url }))
    })))
    return () => {
      disposed = true
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [db, records])

  const tableRows = useMemo<SampleRecordGridRow[]>(() => records.map((record) => ({
    key: record.key,
    data: record.data,
    images: imageUrls[record.key] ? [{
      id: typeof record.data.imageHash === 'string' ? record.data.imageHash : undefined,
      name: 'image',
      href: imageUrls[record.key],
    }] : [],
    attachments: getAttachments(record.data).map((attachment) => ({
        id: attachment.hash,
        name: attachment.name,
        href: attachmentUrls[attachment.hash],
    })),
  })), [attachmentUrls, imageUrls, records])

  const gridRevision = useMemo(
    () => `${revision}:${records.map((record) => `${record.key}:${JSON.stringify(record.data)}`).join('|')}`,
    [records, revision],
  )

  if (!ready) return null

  return (
    <div style={{ padding: '1rem' }}>
      <h1>portable-ui-template</h1>
      <SampleStorageControls />
      <SampleRecordGrid
        initialRows={tableRows}
        columns={['title', 'note']}
        revision={gridRevision}
        disabled={!db}
        onSave={async (drafts) => {
          const savedKeys = new Set(records.map((record) => record.key))
          for (const row of drafts) {
            if (!row.key.trim()) continue
            await upsert(row.key, row.data)
            savedKeys.delete(row.key)
          }
          for (const key of savedKeys) {
            await remove(key)
          }
        }}
        onImageUpload={async (row, file) => {
          if (!db) throw new Error('Database is unavailable')
          const imageHash = await storeAsset(db, file)
          return {
            ...row,
            data: { ...row.data, imageHash, imageType: imageMimeType(file.type) },
          }
        }}
        onImageRemove={(row) => {
          const { imageHash: _imageHash, imageType: _imageType, ...data } = row.data
          return { ...row, data }
        }}
        onAttachmentsUpload={async (row, files) => {
          if (!db) throw new Error('Database is unavailable')
          const uploaded = await Promise.all(files.map(async (file) => ({
            hash: await storeAsset(db, file),
            name: file.name,
            type: file.type || 'application/octet-stream',
          } satisfies Attachment)))
          return {
            ...row,
            data: { ...row.data, attachments: [...getAttachments(row.data), ...uploaded] },
          }
        }}
        onAttachmentRemove={(row, attachmentIndex) => ({
          ...row,
          data: {
            ...row.data,
            attachments: getAttachments(row.data).filter((_, index) => index !== attachmentIndex),
          },
        })}
      />
      {loading && <p>Loading…</p>}
      <details open>
        <summary>Raw database tables</summary>
        <SampleTableInspectorExample />
        <SampleAssetInspectorExample />
      </details>
    </div>
  )
}

function getAttachments(data: RecordData): Attachment[] {
  const attachments = data.attachments
  if (!Array.isArray(attachments)) return []
  return attachments.filter((attachment): attachment is Attachment => {
    if (typeof attachment !== 'object' || attachment === null) return false
    const value = attachment as Record<string, unknown>
    return typeof value.hash === 'string' && typeof value.name === 'string' && typeof value.type === 'string'
  })
}

function SampleStorageControls() {
  const { db, ready, refresh } = useDbContext()

  const exportData = async () => {
    if (!db) return
    const blob = new Blob([await exportDB(db)], { type: 'application/vnd.duckdb' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'portable-ui.duckdb'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const importData = async (file: File) => {
    if (!db) return
    await importDB(db, await file.arrayBuffer())
    await persistDB(db)
    refresh()
  }

  return (
    <StorageControls
      disabled={!ready || !db}
      onExport={exportData}
      onImport={importData}
      onCollect={async () => {
        if (db) await collectOrphanedAssets(db)
        refresh()
      }}
      onClear={async () => {
        if (db) await clearCache(db)
        refresh()
      }}
    />
  )
}

function SampleTableInspectorExample() {
  const { db, ready, revision } = useDbContext()
  const [rows, setRows] = useState<SampleTableInspectorRow[]>([])

  const load = useCallback(async () => {
    if (!db || !ready) return
    const connection = await db.connect()
    try {
      const result = await connection.query('SELECT key, data::TEXT AS data FROM records ORDER BY key')
      setRows(result.toArray().map((row) => {
        const value = row.toJSON() as Record<string, unknown>
        return { key: String(value.key), data: String(value.data) }
      }))
    } finally {
      await connection.close()
    }
  }, [db, ready])

  useEffect(() => {
    void load()
  }, [load, revision])

  return ready ? <SampleTableInspector rows={rows} /> : null
}

function SampleAssetInspectorExample() {
  const { db, ready, revision } = useDbContext()
  const [rows, setRows] = useState<SampleAssetInspectorRow[]>([])

  const load = useCallback(async () => {
    if (!db || !ready) return
    const connection = await db.connect()
    try {
      const result = await connection.query('SELECT hash, size FROM assets ORDER BY hash')
      setRows(result.toArray().map((row) => {
        const value = row.toJSON() as Record<string, unknown>
        return { hash: String(value.hash), size: Number(value.size) }
      }))
    } finally {
      await connection.close()
    }
  }, [db, ready])

  useEffect(() => {
    void load()
  }, [load, revision])

  return ready ? <SampleAssetInspector rows={rows} /> : null
}

export default App
