import { AppProvider } from './context/AppContext'
import { Shell } from './components/layout/Shell'

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
