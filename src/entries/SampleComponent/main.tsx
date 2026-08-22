import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../../index.css'
import { DbProvider } from '../../hooks/useDb'
import { SampleComponent } from '../../components/SampleComponent'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DbProvider>
      <SampleComponent />
    </DbProvider>
  </StrictMode>,
)
