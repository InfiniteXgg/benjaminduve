import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminHeader from '../components/AdminHeader'
import NoticeBanner from '../components/NoticeBanner'
import { adminApi } from '../api/adminApi'
import { formatCurrency, readApiError } from '../utils'

const EMPTY_PRODUCT = {
  name: '',
  description: '',
  size: '',
  height_cm: '',
  width_cm: '',
  depth_cm: '',
  price: '',
  stock: '',
  is_active: true,
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('products')
  const [notice, setNotice] = useState('')
  const [summary, setSummary] = useState({ product_count: 0, active_product_count: 0, order_count: 0 })

  const [products, setProducts] = useState([])
  const [productMeta, setProductMeta] = useState({})
  const [productQ, setProductQ] = useState('')
  const [productPage, setProductPage] = useState(1)
  const [newProduct, setNewProduct] = useState(EMPTY_PRODUCT)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [removingProductSlug, setRemovingProductSlug] = useState('')

  const [orders, setOrders] = useState([])
  const [orderMeta, setOrderMeta] = useState({})
  const [orderQ, setOrderQ] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [orderPage, setOrderPage] = useState(1)

  const token = localStorage.getItem('admin_token')

  const ensureAuth = async () => {
    if (!token) {
      navigate('/admin/login')
      return false
    }
    try {
      await adminApi.me()
      return true
    } catch {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      navigate('/admin/login')
      return false
    }
  }

  const loadSummary = async () => {
    const response = await adminApi.summary()
    setSummary(response)
  }

  const loadProducts = async (options = {}) => {
    const q = options.q ?? productQ
    const page = options.page ?? productPage
    const response = await adminApi.listProducts({ q, page })
    setProducts(response.data || [])
    setProductMeta(response.meta || {})
  }

  const loadOrders = async (options = {}) => {
    const q = options.q ?? orderQ
    const dateFromValue = options.dateFrom ?? dateFrom
    const dateToValue = options.dateTo ?? dateTo
    const page = options.page ?? orderPage
    const response = await adminApi.listOrders({
      q,
      date_from: dateFromValue,
      date_to: dateToValue,
      page,
    })
    setOrders(response.data || [])
    setOrderMeta(response.meta || {})
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const allowed = await ensureAuth()
      if (!allowed || !mounted) return
      try {
        await Promise.all([loadSummary(), loadProducts(), loadOrders()])
      } catch (error) {
        if (mounted) setNotice(readApiError(error))
      }
    })()
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!notice) return
    const id = setTimeout(() => setNotice(''), 2600)
    return () => clearTimeout(id)
  }, [notice])

  useEffect(() => {
    if (tab !== 'orders') return

    const pollId = window.setInterval(async () => {
      try {
        await Promise.all([
          loadOrders({ q: orderQ, dateFrom, dateTo, page: orderPage }),
          loadSummary(),
        ])
      } catch {
        // Mantener dashboard estable aunque falle un ciclo puntual.
      }
    }, 4000)

    return () => window.clearInterval(pollId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, orderQ, dateFrom, dateTo, orderPage])

  useEffect(() => {
    if (!showCreateModal) return

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowCreateModal(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [showCreateModal])

  const onLogout = async () => {
    try {
      await adminApi.logout()
    } catch {
      // no-op
    } finally {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      navigate('/admin/login')
    }
  }

  const onCreateProduct = async (event) => {
    event.preventDefault()
    try {
      const payload = {
        ...newProduct,
        price: Number(newProduct.price || 0),
        stock: Number(newProduct.stock || 0),
        is_active: Boolean(newProduct.is_active),
        height_cm: newProduct.height_cm === '' ? null : Number(newProduct.height_cm),
        width_cm: newProduct.width_cm === '' ? null : Number(newProduct.width_cm),
        depth_cm: newProduct.depth_cm === '' ? null : Number(newProduct.depth_cm),
      }
      const response = await adminApi.createProduct(payload)
      setNotice(response.message || 'Producto creado correctamente.')
      setNewProduct(EMPTY_PRODUCT)
      setShowCreateModal(false)
      await Promise.all([loadProducts({ page: 1 }), loadSummary()])
      setProductPage(1)
    } catch (error) {
      setNotice(readApiError(error))
    }
  }

  const onUpdateProduct = async (product) => {
    try {
      const payload = {
        name: product.name,
        slug: product.slug,
        description: product.description,
        size: product.size,
        height_cm: product.height_cm === '' ? null : product.height_cm,
        width_cm: product.width_cm === '' ? null : product.width_cm,
        depth_cm: product.depth_cm === '' ? null : product.depth_cm,
        price: Number(product.price || 0),
        stock: Number(product.stock || 0),
        is_active: Boolean(product.is_active),
      }
      const response = await adminApi.updateProduct(product.slug, payload)
      setNotice(response.message)
      await Promise.all([loadProducts(), loadSummary()])
    } catch (error) {
      setNotice(readApiError(error))
    }
  }

  const onDeleteProduct = async (slug) => {
    setRemovingProductSlug(slug)

    await new Promise((resolve) => setTimeout(resolve, 220))

    try {
      const response = await adminApi.deleteProduct(slug)
      setNotice(response.message || 'Producto eliminado correctamente.')
      await Promise.all([loadProducts(), loadSummary()])
    } catch (error) {
      setNotice(readApiError(error))
    } finally {
      setRemovingProductSlug('')
    }
  }

  const onOrderDecision = async (orderId, action) => {
    try {
      const response = action === 'accept' ? await adminApi.acceptOrder(orderId) : await adminApi.rejectOrder(orderId)
      setNotice(response.message)
      await Promise.all([loadOrders(), loadSummary()])
    } catch (error) {
      setNotice(readApiError(error))
    }
  }

  const editableProducts = useMemo(
    () => products.map((product) => ({ ...product })),
    [products],
  )

  return (
    <div className="app-shell">
      <AdminHeader tab={tab} onChangeTab={setTab} onLogout={onLogout} />
      <main className="container admin-layout">
        <NoticeBanner message={notice} />
        <section className="panel">
          <h3>Control general</h3>
          <div className="stats-grid">
            <div className="stat-box"><span>Productos totales</span><strong>{summary.product_count}</strong></div>
            <div className="stat-box"><span>Productos activos</span><strong>{summary.active_product_count}</strong></div>
            <div className="stat-box"><span>Pedidos</span><strong>{summary.order_count}</strong></div>
          </div>
        </section>

        {tab === 'products' ? (
          <section className="panel">
            <div className="product-toolbar">
              <button type="button" onClick={() => setShowCreateModal(true)}>Agregar producto</button>
              <div className="search-row product-search-inline">
                <input value={productQ} onChange={(e) => setProductQ(e.target.value)} placeholder="Buscar producto..." />
                <button
                  type="button"
                  onClick={async () => {
                    setProductPage(1)
                    await loadProducts({ q: productQ, page: 1 })
                  }}
                >
                  Buscar
                </button>
                <button
                  type="button"
                  className="btn-alt"
                  onClick={async () => {
                    setProductQ('')
                    setProductPage(1)
                    await loadProducts({ q: '', page: 1 })
                  }}
                >
                  Limpiar
                </button>
              </div>
            </div>

            <div className="stack compact-stack">
              {editableProducts.map((product) => (
                <article
                  className={`row-card column product-editor ${removingProductSlug === product.slug ? 'is-removing' : ''}`}
                  key={product.id}
                >
                  <div className="triple">
                    <input value={product.name} onChange={(e) => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, name: e.target.value } : p))} />
                    <input value={product.slug} onChange={(e) => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, slug: e.target.value } : p))} />
                    <input type="number" step="0.01" value={product.price} onChange={(e) => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, price: e.target.value } : p))} />
                  </div>
                  <textarea value={product.description || ''} onChange={(e) => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, description: e.target.value } : p))}></textarea>
                  <div className="triple">
                    <input value={product.size || ''} onChange={(e) => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, size: e.target.value } : p))} placeholder="Talla" />
                    <input type="number" step="0.01" value={product.height_cm || ''} onChange={(e) => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, height_cm: e.target.value } : p))} placeholder="Altura" />
                    <input type="number" step="0.01" value={product.width_cm || ''} onChange={(e) => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, width_cm: e.target.value } : p))} placeholder="Ancho" />
                  </div>
                  <div className="triple">
                    <input type="number" step="0.01" value={product.depth_cm || ''} onChange={(e) => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, depth_cm: e.target.value } : p))} placeholder="Profundidad" />
                    <input type="number" value={product.stock} onChange={(e) => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, stock: e.target.value } : p))} />
                    <label className="method">
                      <input type="checkbox" checked={Boolean(product.is_active)} onChange={(e) => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_active: e.target.checked } : p))} />
                      Activo
                    </label>
                  </div>
                  <div className="card-actions">
                    <button type="button" onClick={() => onUpdateProduct(product)}>Guardar</button>
                    <button type="button" className="btn-danger" onClick={() => onDeleteProduct(product.slug)}>Eliminar</button>
                  </div>
                </article>
              ))}
            </div>
            <div className="pagination">
              <button
                type="button"
                disabled={productPage <= 1}
                onClick={async () => {
                  const next = Math.max(1, productPage - 1)
                  setProductPage(next)
                  await loadProducts({ page: next })
                }}
              >
                Anterior
              </button>
              <span>Pagina {productMeta.current_page || 1} de {productMeta.last_page || 1}</span>
              <button
                type="button"
                disabled={productPage >= (productMeta.last_page || 1)}
                onClick={async () => {
                  const next = Math.min(productMeta.last_page || 1, productPage + 1)
                  setProductPage(next)
                  await loadProducts({ page: next })
                }}
              >
                Siguiente
              </button>
            </div>
          </section>
        ) : (
          <section className="panel">
            <div className="filter-row">
              <input value={orderQ} onChange={(e) => setOrderQ(e.target.value)} placeholder="Buscar por cliente, correo o estado" />
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              <button
                type="button"
                onClick={async () => {
                  setOrderPage(1)
                  await loadOrders({ q: orderQ, dateFrom, dateTo, page: 1 })
                }}
              >
                Filtrar
              </button>
              <button
                type="button"
                className="btn-alt"
                onClick={async () => {
                  setOrderQ('')
                  setDateFrom('')
                  setDateTo('')
                  setOrderPage(1)
                  await loadOrders({ q: '', dateFrom: '', dateTo: '', page: 1 })
                }}
              >
                Limpiar
              </button>
            </div>

            <div className="orders-compact">
              <div className="orders-head">
                <span>ID</span>
                <span>Cliente</span>
                <span>Estado</span>
                <span>Pago</span>
                <span>Total</span>
                <span>Accion</span>
              </div>
              {orders.map((order) => (
                <article className="orders-row" key={order.id}>
                  <span className="mono">#{order.id}</span>
                  <span>
                    <strong>{order.customer_name}</strong>
                    <small>{order.customer_email}</small>
                  </span>
                  <span>
                    <small>{order.review_status_label}</small>
                    <small>{order.status_label}</small>
                  </span>
                  <span>
                    <small>{order.payment_status_label}</small>
                  </span>
                  <span><strong>{formatCurrency(order.total)}</strong></span>
                  <span>
                    {order.admin_review_status === 'pending' && order.status === 'pending' ? (
                      <div className="card-actions">
                        <button type="button" onClick={() => onOrderDecision(order.id, 'accept')}>Aceptar</button>
                        <button type="button" className="btn-danger" onClick={() => onOrderDecision(order.id, 'reject')}>Rechazar</button>
                      </div>
                    ) : order.status === 'cancelled' ? (
                      <small>Pedido cancelado</small>
                    ) : (
                      <small>Decision registrada</small>
                    )}
                  </span>
                </article>
              ))}
            </div>

            <div className="pagination">
              <button
                type="button"
                disabled={orderPage <= 1}
                onClick={async () => {
                  const next = Math.max(1, orderPage - 1)
                  setOrderPage(next)
                  await loadOrders({ page: next })
                }}
              >
                Anterior
              </button>
              <span>Pagina {orderMeta.current_page || 1} de {orderMeta.last_page || 1}</span>
              <button
                type="button"
                disabled={orderPage >= (orderMeta.last_page || 1)}
                onClick={async () => {
                  const next = Math.min(orderMeta.last_page || 1, orderPage + 1)
                  setOrderPage(next)
                  await loadOrders({ page: next })
                }}
              >
                Siguiente
              </button>
            </div>
          </section>
        )}
      </main>

      {tab === 'products' && showCreateModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setShowCreateModal(false)}>
          <section className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Agregar producto</h3>
            <form className="stack" onSubmit={onCreateProduct}>
              <input placeholder="Nombre" value={newProduct.name} onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))} required />
              <textarea placeholder="Descripcion" value={newProduct.description} onChange={(e) => setNewProduct((prev) => ({ ...prev, description: e.target.value }))}></textarea>
              <div className="triple">
                <input placeholder="Talla (opcional)" value={newProduct.size} onChange={(e) => setNewProduct((prev) => ({ ...prev, size: e.target.value }))} />
                <input type="number" step="0.01" min="0" placeholder="Altura cm" value={newProduct.height_cm} onChange={(e) => setNewProduct((prev) => ({ ...prev, height_cm: e.target.value }))} />
                <input type="number" step="0.01" min="0" placeholder="Ancho cm" value={newProduct.width_cm} onChange={(e) => setNewProduct((prev) => ({ ...prev, width_cm: e.target.value }))} />
              </div>
              <div className="triple">
                <input type="number" step="0.01" min="0" placeholder="Profundidad cm" value={newProduct.depth_cm} onChange={(e) => setNewProduct((prev) => ({ ...prev, depth_cm: e.target.value }))} />
                <input type="number" step="0.01" min="0" placeholder="Precio" value={newProduct.price} onChange={(e) => setNewProduct((prev) => ({ ...prev, price: e.target.value }))} required />
                <input type="number" min="0" placeholder="Stock" value={newProduct.stock} onChange={(e) => setNewProduct((prev) => ({ ...prev, stock: e.target.value }))} required />
              </div>
              <label className="method">
                <input type="checkbox" checked={newProduct.is_active} onChange={(e) => setNewProduct((prev) => ({ ...prev, is_active: e.target.checked }))} />
                Publicado en catalogo
              </label>
              <div className="card-actions">
                <button type="submit">Guardar producto</button>
                <button type="button" className="btn-alt" onClick={() => setShowCreateModal(false)}>Cancelar</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
