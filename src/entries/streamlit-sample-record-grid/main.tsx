import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../../index.css'
import StreamlitSampleRecordGrid from '../../adapters/streamlit/SampleRecordGrid/StreamlitSampleRecordGrid'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StreamlitSampleRecordGrid />
  </StrictMode>,
)
