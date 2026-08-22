import { useEffect, useState } from 'react'
import { Streamlit, type RenderData } from 'streamlit-component-lib'
import {
  SampleTableInspector,
  type SampleTableInspectorRow,
} from '../../../components/SampleTableInspector/SampleTableInspector'

interface SampleTableInspectorArgs {
  rows?: Array<Record<string, unknown>>
}

function rows(value: unknown): SampleTableInspectorRow[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((row) => {
    if (typeof row !== 'object' || row === null) return []
    const value = row as Record<string, unknown>
    if (typeof value.key !== 'string' || typeof value.data !== 'string') return []
    return [{ key: value.key, data: value.data }]
  })
}

export default function StreamlitSampleTableInspector() {
  const [renderData, setRenderData] = useState<RenderData<SampleTableInspectorArgs>>({ args: {}, disabled: false })

  useEffect(() => {
    const onRender = (event: Event) => setRenderData(
      (event as CustomEvent<RenderData<SampleTableInspectorArgs>>).detail,
    )
    Streamlit.events.addEventListener(Streamlit.RENDER_EVENT, onRender)
    Streamlit.setComponentReady()
    return () => Streamlit.events.removeEventListener(Streamlit.RENDER_EVENT, onRender)
  }, [])

  useEffect(() => {
    Streamlit.setFrameHeight()
  }, [renderData.args.rows])

  return <SampleTableInspector rows={rows(renderData.args.rows)} />
}
