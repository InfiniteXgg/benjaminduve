import BrandLogo from './BrandLogo'

export default function AdminHeader({ tab, onChangeTab, onLogout }) {
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
        <button className="nav-btn" onClick={onLogout}>Cerrar sesion</button>
      </div>
    </header>
  )
}

