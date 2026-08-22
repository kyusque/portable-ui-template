import './App.css'
import { DbProvider } from './hooks/useDb'
import { SampleComponent } from './components/SampleComponent'
import { NoteList } from './components/NoteList'
import { DbControls } from './components/DbControls'

function App() {
  return (
    <DbProvider>
      <div style={{ padding: '1rem' }}>
        <h1>portable-ui-template</h1>
        <DbControls />
        <SampleComponent />
        <NoteList />
      </div>
    </DbProvider>
  )
}

export default App
