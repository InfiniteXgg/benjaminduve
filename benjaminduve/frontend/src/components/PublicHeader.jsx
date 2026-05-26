import { NavLink } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import BrandLogo from './BrandLogo'

export default function PublicHeader() {
  const { distinctCount } = useCart()

  return (
    <header className="top-header">
      <div className="header-wrap">
        <a href="/" className="brand-link" aria-label="Ir al home">
          <BrandLogo />
        </a>
        <nav className="header-nav">
          <a href="/" className="nav-btn">
            HOME
          </a>
          <NavLink to="/carrito" className="nav-btn cart-btn">
            Carrito
            {distinctCount > 0 && <span className="cart-badge">{distinctCount}</span>}
          </NavLink>
          <a
            href="https://instagram.com/benjaminduve"
            className="nav-btn icon-btn"
            target="_blank"
            rel="noopener noreferrer"
            title="@benjaminduve"
            aria-label="Instagram de Benjaminduve"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9">
              <rect x="3" y="3" width="18" height="18" rx="5"></rect>
              <circle cx="12" cy="12" r="4.1"></circle>
              <circle cx="17.6" cy="6.4" r="1.1"></circle>
            </svg>
          </a>
        </nav>
      </div>
    </header>
  )
}
