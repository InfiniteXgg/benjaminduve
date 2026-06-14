import { NavLink } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import BrandLogo from './BrandLogo'
import ThemeToggle from './ThemeToggle'

export default function PublicHeader({ onSearchClick = null }) {
  const { distinctCount } = useCart()

  return (
    <header className="top-header">
      <div className="header-wrap">
        <div className="header-left">
          {onSearchClick && (
            <button
              type="button"
              className="header-search-trigger"
              onClick={onSearchClick}
              aria-label="Buscar productos"
              title="Buscar productos"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <circle cx="11" cy="11" r="6"></circle>
                <path d="M16 16l4 4"></path>
              </svg>
            </button>
          )}
        </div>

        <div className="header-center">
          <a href="/" className="brand-link" aria-label="Ir al home">
            <BrandLogo />
          </a>
        </div>

        <div className="header-right">
          <NavLink to="/carrito" className="nav-btn cart-btn icon-btn" aria-label="Carrito">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9">
              <path d="M6 6h15l-1.5 9h-12z"></path>
              <path d="M6 6L5 3H2"></path>
              <circle cx="9" cy="20" r="1.2"></circle>
              <circle cx="18" cy="20" r="1.2"></circle>
            </svg>
            {distinctCount > 0 && <span className="cart-badge">{distinctCount}</span>}
          </NavLink>
          <ThemeToggle />
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
        </div>
      </div>
    </header>
  )
}
