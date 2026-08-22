import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../../index.css'
import { DbProvider } from '../../hooks/useDb'
import { NoteList } from '../../components/NoteList'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DbProvider>
      <NoteList />
    </DbProvider>
  </StrictMode>,
)
