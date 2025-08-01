import SitOutScene from './components/SitOutScene'
import './styles/SitOut.css'

// Import test utilities in development
if (import.meta.env.DEV) {
  import('./utils/testTTS');
}

function App() {
  return <SitOutScene />
}

export default App
