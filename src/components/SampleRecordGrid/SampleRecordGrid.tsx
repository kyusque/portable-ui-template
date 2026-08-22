import { useEffect, useMemo, useRef, useState } from 'react'
import './SampleRecordGrid.css'

export interface SampleRecordGridAsset {
  id?: string
  name: string
  href?: string
}

export interface SampleRecordGridRow {
  key: string
  data: Record<string, unknown>
  images: SampleRecordGridAsset[]
  attachments: SampleRecordGridAsset[]
}

interface SampleRecordGridProps {
  initialRows: SampleRecordGridRow[]
  columns: string[]
  revision: string | number
  disabled?: boolean
  onSave: (rows: SampleRecordGridRow[]) => Promise<void> | void
  onImageUpload: (row: SampleRecordGridRow, file: File) => Promise<SampleRecordGridRow>
  onImageRemove: (row: SampleRecordGridRow) => Promise<SampleRecordGridRow> | SampleRecordGridRow
  onAttachmentsUpload: (row: SampleRecordGridRow, files: File[]) => Promise<SampleRecordGridRow>
  onAttachmentRemove: (
    row: SampleRecordGridRow,
    attachmentIndex: number,
  ) => Promise<SampleRecordGridRow> | SampleRecordGridRow
  onStateChange?: () => void
}

function inputValue(value: unknown): string {
  return typeof value === 'string' ? value : value === undefined ? '' : JSON.stringify(value)
}

function copyRows(rows: SampleRecordGridRow[]): SampleRecordGridRow[] {
  return rows.map((row) => ({
    key: row.key,
    data: { ...row.data },
    images: [...row.images],
    attachments: [...row.attachments],
  }))
}

async function fileToAsset(file: File): Promise<SampleRecordGridAsset> {
  const href = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(String(reader.result)))
    reader.addEventListener('error', () => reject(reader.error))
    reader.readAsDataURL(file)
  })
  return { name: file.name, href }
}

export function SampleRecordGrid({
  initialRows,
  columns,
  revision,
  disabled = false,
  onSave,
  onImageUpload,
  onImageRemove,
  onAttachmentsUpload,
  onAttachmentRemove,
  onStateChange,
}: SampleRecordGridProps) {
  const [drafts, setDrafts] = useState(() => copyRows(initialRows))
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const appliedRevision = useRef<string | number | null>(null)

  useEffect(() => {
    if (appliedRevision.current === revision) return
    setDrafts(copyRows(initialRows))
    setDirty(false)
    setError(null)
    appliedRevision.current = revision
  }, [initialRows, revision])

  useEffect(() => {
    onStateChange?.()
  }, [drafts, dirty, onStateChange])

  const displayedColumns = useMemo(() => {
    const names = new Set(columns)
    drafts.forEach((row) => {
      Object.keys(row.data).forEach((name) => {
        if (name !== 'imageHash' && name !== 'imageType' && name !== 'attachments') names.add(name)
      })
    })
    return [...names]
  }, [columns, drafts])
  const displayedRows = useMemo(() => {
    const initialByKey = new Map(initialRows.map((row) => [row.key, row]))
    const fillHref = (assets: SampleRecordGridAsset[], initialAssets: SampleRecordGridAsset[]) => (
      assets.map((asset, index) => {
        if (asset.href) return asset
        const matchingAsset = asset.id
          ? initialAssets.find((candidate) => candidate.id === asset.id)
          : initialAssets[index]
        return { ...asset, href: matchingAsset?.href }
      })
    )
    return drafts.map((row) => {
      const initial = initialByKey.get(row.key)
      if (!initial) return row
      return {
        ...row,
        images: row.images.length > 0
          ? fillHref(row.images, initial.images)
          : typeof row.data.imageHash === 'string' ? initial.images : row.images,
        attachments: fillHref(row.attachments, initial.attachments),
      }
    })
  }, [drafts, initialRows])
  const columnSpan = displayedColumns.length + 4

  const update = (next: SampleRecordGridRow[]) => {
    setDrafts(next)
    setDirty(true)
  }

  const updateRow = (rowIndex: number, callback: (row: SampleRecordGridRow) => SampleRecordGridRow) => {
    update(drafts.map((row, index) => index === rowIndex ? callback(row) : row))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await onSave(copyRows(drafts))
      setDirty(false)
      setError(null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (rowIndex: number, file: File) => {
    try {
      const [row, image] = await Promise.all([
        onImageUpload(drafts[rowIndex], file),
        fileToAsset(file),
      ])
      updateRow(rowIndex, () => ({ ...row, images: [image] }))
      setError(null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    }
  }

  const handleAttachmentsUpload = async (rowIndex: number, files: File[]) => {
    try {
      const [row, attachments] = await Promise.all([
        onAttachmentsUpload(drafts[rowIndex], files),
        Promise.all(files.map(fileToAsset)),
      ])
      updateRow(rowIndex, () => ({ ...row, attachments: [...row.attachments, ...attachments] }))
      setError(null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    }
  }

  const handleImageRemove = async (rowIndex: number) => {
    try {
      const row = await onImageRemove(drafts[rowIndex])
      updateRow(rowIndex, () => ({ ...row, images: [] }))
      setError(null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    }
  }

  const handleAttachmentRemove = async (rowIndex: number, attachmentIndex: number) => {
    try {
      const row = await onAttachmentRemove(drafts[rowIndex], attachmentIndex)
      updateRow(rowIndex, () => ({
        ...row,
        attachments: row.attachments.filter((_, index) => index !== attachmentIndex),
      }))
      setError(null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    }
  }

  return (
    <section className="sample-record-grid">
      <table>
        <thead>
          <tr className="sample-record-grid-toolbar">
            <th colSpan={columnSpan}>
              <button type="button" disabled={disabled || saving} onClick={() => update([...drafts, {
                key: `row-${drafts.length + 1}`,
                data: Object.fromEntries(displayedColumns.map((column) => [column, ''])),
                images: [],
                attachments: [],
              }])}>Add row</button>
              <button type="button" disabled={disabled || saving || !dirty} onClick={() => void handleSave()}>Save</button>
            </th>
          </tr>
          <tr>
            <th>key</th>
            {columns.map((column) => <th key={column}>{column}</th>)}
            <th>image</th>
            <th>attachments</th>
            <th>actions</th>
          </tr>
        </thead>
        <tbody>
          {displayedRows.map((row, rowIndex) => (
            <tr key={`${row.key}-${rowIndex}`}>
              <td><input disabled={disabled || saving} value={row.key} onChange={(event) => updateRow(rowIndex, (current) => ({ ...current, key: event.target.value }))} /></td>
              {displayedColumns.map((column) => (
                <td key={column}>
                  <input disabled={disabled || saving} value={inputValue(row.data[column])} onChange={(event) => updateRow(rowIndex, (current) => ({ ...current, data: { ...current.data, [column]: event.target.value } }))} />
                </td>
              ))}
              <td className="sample-record-grid-image">
                {row.images.map((image) => image.href && <img key={image.href} src={image.href} alt={image.name} />)}
                <input type="file" accept="image/*" disabled={disabled || saving} onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void handleImageUpload(rowIndex, file)
                  event.target.value = ''
                }} />
                {row.images.length > 0 && <button type="button" disabled={disabled || saving} onClick={() => void handleImageRemove(rowIndex)}>Remove image</button>}
              </td>
              <td className="sample-record-grid-attachments">
                <input type="file" multiple disabled={disabled || saving} onChange={(event) => {
                  if (event.target.files?.length) void handleAttachmentsUpload(rowIndex, Array.from(event.target.files))
                  event.target.value = ''
                }} />
                <ul>
                  {row.attachments.map((attachment, attachmentIndex) => (
                    <li key={`${attachment.href ?? attachment.name}-${attachmentIndex}`}>
                      {attachment.href ? <a href={attachment.href} download={attachment.name}>{attachment.name}</a> : attachment.name}
                      <button type="button" disabled={disabled || saving} onClick={() => void handleAttachmentRemove(rowIndex, attachmentIndex)}>Remove</button>
                    </li>
                  ))}
                </ul>
              </td>
              <td>
                <button type="button" aria-label="Move up" title="Move up" disabled={disabled || saving || rowIndex === 0} onClick={() => {
                  const next = copyRows(drafts)
                  ;[next[rowIndex], next[rowIndex - 1]] = [next[rowIndex - 1], next[rowIndex]]
                  update(next)
                }}>↑</button>
                <button type="button" aria-label="Move down" title="Move down" disabled={disabled || saving || rowIndex === drafts.length - 1} onClick={() => {
                  const next = copyRows(drafts)
                  ;[next[rowIndex], next[rowIndex + 1]] = [next[rowIndex + 1], next[rowIndex]]
                  update(next)
                }}>↓</button>
                <button type="button" aria-label="Delete row" title="Delete row" disabled={disabled || saving} onClick={() => update(drafts.filter((_, index) => index !== rowIndex))}>×</button>
              </td>
            </tr>
          ))}
          {drafts.length === 0 && <tr><td colSpan={columnSpan}>No records</td></tr>}
        </tbody>
        <tfoot>
          <tr className="sample-record-grid-toolbar">
            <td colSpan={columnSpan}>
              <button type="button" disabled={disabled || saving} onClick={() => update([...drafts, {
                key: `row-${drafts.length + 1}`,
                data: Object.fromEntries(displayedColumns.map((column) => [column, ''])),
                images: [],
                attachments: [],
              }])}>Add row</button>
              <button type="button" disabled={disabled || saving || !dirty} onClick={() => void handleSave()}>Save</button>
            </td>
          </tr>
        </tfoot>
      </table>
      {error && <p role="alert">{error}</p>}
    </section>
  )
}
