import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../../index.css'
import StreamlitSampleTableInspector from '../../adapters/streamlit/SampleTableInspector/StreamlitSampleTableInspector'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StreamlitSampleTableInspector />
  </StrictMode>,
)
