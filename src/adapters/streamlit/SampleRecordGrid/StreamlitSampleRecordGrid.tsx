import { useEffect, useState } from 'react'
import { Streamlit, type RenderData } from 'streamlit-component-lib'
import {
  SampleRecordGrid,
  type SampleRecordGridAsset,
  type SampleRecordGridRow,
} from '../../../components/SampleRecordGrid/SampleRecordGrid'

interface SampleRecordGridArgs {
  columns?: string[]
  rows?: Array<Record<string, unknown>>
  images?: SampleRecordGridAsset[]
  attachments?: SampleRecordGridAsset[]
  revision?: number
}

function assets(value: unknown): SampleRecordGridAsset[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is SampleRecordGridAsset => (
    typeof item === 'object'
    && item !== null
    && typeof item.name === 'string'
    && (item.href === undefined || typeof item.href === 'string')
  ))
}

function toTableRows(args: SampleRecordGridArgs): SampleRecordGridRow[] {
  return (args.rows ?? []).map((value, index) => {
    const { key, images, attachments, ...data } = value
    return {
      key: typeof key === 'string' ? key : `row-${index + 1}`,
      data,
      images: assets(images).length ? assets(images) : index === 0 ? args.images ?? [] : [],
      attachments: assets(attachments).length ? assets(attachments) : index === 0 ? args.attachments ?? [] : [],
    }
  })
}

function StreamlitSampleRecordGrid() {
  const [renderData, setRenderData] = useState<RenderData<SampleRecordGridArgs>>({ args: {}, disabled: false })
  const { args, disabled } = renderData

  useEffect(() => {
    const onRender = (event: Event) => setRenderData((event as CustomEvent<RenderData<SampleRecordGridArgs>>).detail)
    Streamlit.events.addEventListener(Streamlit.RENDER_EVENT, onRender)
    Streamlit.setComponentReady()
    return () => Streamlit.events.removeEventListener(Streamlit.RENDER_EVENT, onRender)
  }, [])

  return (
    <SampleRecordGrid
      initialRows={toTableRows(args)}
      columns={args.columns ?? []}
      revision={args.revision ?? 0}
      disabled={disabled}
      onSave={(drafts) => {
        Streamlit.setComponentValue({
          rows: drafts.map((row) => ({ key: row.key, ...row.data, images: row.images, attachments: row.attachments })),
        })
      }}
      onImageUpload={async (row) => row}
      onImageRemove={(row) => row}
      onAttachmentsUpload={async (row) => row}
      onAttachmentRemove={(row) => row}
      onStateChange={() => Streamlit.setFrameHeight()}
    />
  )
}

export default StreamlitSampleRecordGrid
