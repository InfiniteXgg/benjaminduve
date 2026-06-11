import { useState, useRef, useEffect } from 'react'
import BrandLogo from './BrandLogo'
import ThemeToggle from './ThemeToggle'

export default function AdminHeader({ tab, onChangeTab, onLogout, lowStockProducts = [], lowStockThreshold = 5 }) {
  const [bellOpen, setBellOpen] = useState(false)
  const dropdownRef = useRef(null)
  const alertCount = lowStockProducts.length

  useEffect(() => {
    if (!bellOpen) return
    const onClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [bellOpen])

  return (
    <header className="top-header">
      <div className="header-wrap">
        <div className="admin-brand-block">
          <span className="brand-static" aria-label="Panel administrativo">
            <BrandLogo compact />
          </span>
          <span className="admin-brand-text">Panel administrativo</span>
          <button className={`nav-btn ${tab === 'products' ? 'active' : ''}`} onClick={() => onChangeTab('products')}>
            Productos
          </button>
          <button className={`nav-btn ${tab === 'orders' ? 'active' : ''}`} onClick={() => onChangeTab('orders')}>
            Pedidos
          </button>
        </div>
        <div className="header-actions">
          <ThemeToggle />
          <div className="bell-container" ref={dropdownRef}>
            <button
              className={`nav-btn icon-btn bell-btn ${alertCount > 0 ? 'has-alerts' : ''}`}
              onClick={() => setBellOpen((prev) => !prev)}
              aria-label="Notificaciones"
              title="Notificaciones"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {alertCount > 0 && <span className="bell-badge">{alertCount}</span>}
            </button>
            {bellOpen && (
              <div className="bell-dropdown">
                <div className="bell-dropdown-header">
                  <strong>Alertas de stock</strong>
                  {alertCount === 0 && <span className="muted">Sin alertas</span>}
                </div>
                {alertCount > 0 && (
                  <>
                    <p className="bell-dropdown-summary">
                      {alertCount} producto(s) con stock &le; {lowStockThreshold} unidad(es)
                    </p>
                    <ul className="bell-dropdown-list">
                      {lowStockProducts.map((product) => (
                        <li key={product.id} className={`bell-dropdown-item ${product.stock_status === 'out_of_stock' ? 'is-critical' : ''}`}>
                          <span className="bell-item-name">{product.name}</span>
                          <span className={`stock-badge ${product.stock_status === 'out_of_stock' ? 'is-critical' : ''}`}>
                            {product.stock_status_label}
                          </span>
                          <span className="bell-item-stock">
                            {product.stock === 0 ? 'Sin unidades' : `${product.stock} uds.`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
          <button className="nav-btn" onClick={onLogout}>Cerrar sesion</button>
        </div>
      </div>
    </header>
  )
}
