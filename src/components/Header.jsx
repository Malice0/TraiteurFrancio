import { NavLink } from 'react-router-dom'
import logo from '/logo.svg'

const navItems = [
  { to: '/', label: 'Devis' },
  { to: '/historique', label: 'Historique' },
  { to: '/clients', label: 'Clients' },
]

export default function Header() {
  return (
    <header className="app-header no-print">
      <div className="brand-lockup">
        <img src={logo} alt="FCMA Ti Kaz Traiteur" className="brand-logo" />
        <div className="brand-copy">
          <span className="brand-eyebrow">FCMA Ti Kaz Traiteur</span>
          <strong className="brand-title">Devis, clients et facturation</strong>
          <p className="brand-subtitle">Un espace simple pour vendre proprement et suivre chaque demande.</p>
        </div>
      </div>

      <nav className="app-nav" aria-label="Navigation principale">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
