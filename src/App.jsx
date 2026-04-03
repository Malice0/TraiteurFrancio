import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Accueil from './pages/Accueil'
import Historique from './pages/Historique'
import Clients from './pages/Clients'
import { appBaseUrl } from './config/runtime'
import './styles/global.css'

export default function App() {
  return (
    <BrowserRouter basename={appBaseUrl}>
      <Header />
      <Routes>
        <Route path="/"           element={<Accueil />} />
        <Route path="/historique" element={<Historique />} />
        <Route path="/clients"    element={<Clients />} />
      </Routes>
    </BrowserRouter>
  )
}
