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
  mainImage: '',
  images: [],
}

function productImagesText(images = []) {
  return images
    .map((image) => image.url)
    .filter((url) => url && !isEmbeddedImageSource(url))
    .join('\n')
}

function isEmbeddedImageSource(url = '') {
  return String(url).startsWith('data:image/')
}

function imagesFromText(value, productName = 'Producto') {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((url, index) => ({
      url,
      alt: `${productName || 'Producto'} foto ${index + 1}`,
    }))
}

function mergeExternalImageText(existingImages = [], value, productName = 'Producto') {
  const embeddedImages = existingImages.filter((image) => isEmbeddedImageSource(image?.url))
  return [...embeddedImages, ...imagesFromText(value, productName)].slice(0, 8)
}

function normalizeProductImages(images = [], productName = 'Producto') {
  return images
    .filter((image) => image?.url)
    .slice(0, 8)
    .map((image, index) => ({
      url: image.url,
      alt: image.alt || `${productName || 'Producto'} foto ${index + 1}`,
    }))
}

function compressImageFile(file, maxSize = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const image = new Image()
      image.onload = () => {
        const attempts = [
          { maxSize, quality },
          { maxSize: 760, quality: 0.68 },
          { maxSize: 620, quality: 0.64 },
          { maxSize: 520, quality: 0.6 },
        ]

        for (const attempt of attempts) {
          const scale = Math.min(1, attempt.maxSize / Math.max(image.width, image.height))
          const canvas = document.createElement('canvas')
          canvas.width = Math.max(1, Math.round(image.width * scale))
          canvas.height = Math.max(1, Math.round(image.height * scale))
          const context = canvas.getContext('2d')

          if (!context) {
            reject(new Error('No se pudo procesar la imagen.'))
            return
          }

          context.drawImage(image, 0, 0, canvas.width, canvas.height)
          const dataUrl = canvas.toDataURL('image/jpeg', attempt.quality)
          if (dataUrl.length <= 480000 || attempt === attempts[attempts.length - 1]) {
            resolve(dataUrl)
            return
          }
        }
      }
      image.onerror = () => reject(new Error('No se pudo procesar una imagen.'))
      image.src = String(reader.result || '')
    }
    reader.onerror = () => reject(new Error('No se pudo leer una imagen.'))
    reader.readAsDataURL(file)
  })
}

async function readImageFiles(files, productName = 'Producto') {
  const selectedFiles = Array.from(files || []).filter((file) => file.type.startsWith('image/')).slice(0, 8)

  const images = await Promise.all(
    selectedFiles.map(async (file, index) => ({
      url: await compressImageFile(file),
      alt: `${productName || 'Producto'} foto ${index + 1}`,
    })),
  )

  const tooLarge = images.some((image) => image.url.length > 480000)
  if (tooLarge) {
    throw new Error('Una imagen sigue siendo demasiado pesada. Prueba con una foto mas liviana.')
  }

  return images
}

function AdminField({ label, children }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('products')
  const [notice, setNotice] = useState('')
  const [noticeTone, setNoticeTone] = useState('info')
  const [summary, setSummary] = useState({
    product_count: 0,
    active_product_count: 0,
    order_count: 0,
    low_stock_threshold: 5,
    low_stock_count: 0,
    low_stock_products: [],
  })

  const [products, setProducts] = useState([])
  const [productMeta, setProductMeta] = useState({})
  const [productQ, setProductQ] = useState('')
  const [productPage, setProductPage] = useState(1)
  const [newProduct, setNewProduct] = useState(EMPTY_PRODUCT)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [removingProductSlug, setRemovingProductSlug] = useState('')
  const [expandedProductId, setExpandedProductId] = useState(null)

  const [dragging, setDragging] = useState(null) // { productId, index, isNew }

  const [orders, setOrders] = useState([])
  const [orderMeta, setOrderMeta] = useState({})
  const [orderQ, setOrderQ] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [orderPage, setOrderPage] = useState(1)

  const token = localStorage.getItem('admin_token')

  const showNotice = (message, tone = 'info') => {
    setNotice(message)
    setNoticeTone(tone)
  }

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

  const addImagesToProduct = async (productId, files) => {
    try {
      const product = products.find((item) => item.id === productId)
      const newImages = await readImageFiles(files, product?.name || 'Producto')
      setProducts((prev) => prev.map((item) => {
        if (item.id !== productId) return item
        const imagesList = [...(item.images || []), ...newImages].slice(0, 8)
        const mainImage = item.mainImage || imagesList[0]?.url || ''
        return { ...item, images: imagesList, mainImage }
      }))
    } catch (error) {
      showNotice(error.message, 'error')
    }
  }

  const addImagesToNewProduct = async (files) => {
    try {
      const newImages = await readImageFiles(files, newProduct.name || 'Producto')
      setNewProduct((prev) => {
        const imagesList = [...(prev.images || []), ...newImages].slice(0, 8)
        const mainImage = prev.mainImage || imagesList[0]?.url || ''
        return { ...prev, images: imagesList, mainImage }
      })
    } catch (error) {
      showNotice(error.message, 'error')
    }
  }

  const removeNewProductImage = (indexToRemove) => {
    setNewProduct((prev) => {
      const imagesList = (prev.images || []).filter((_, index) => index !== indexToRemove)
      const mainImage = prev.mainImage === prev.images?.[indexToRemove]?.url ? (imagesList[0]?.url || '') : prev.mainImage
      return { ...prev, images: imagesList, mainImage }
    })
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const allowed = await ensureAuth()
      if (!allowed || !mounted) return
      try {
        await Promise.all([loadSummary(), loadProducts(), loadOrders()])
      } catch (error) {
        if (mounted) showNotice(readApiError(error), 'error')
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
    const pollId = window.setInterval(async () => {
      try {
        await loadSummary()
        await loadOrders({ q: orderQ, dateFrom, dateTo, page: orderPage })
      } catch {
        // Mantener dashboard estable aunque falle un ciclo puntual.
      }
    }, 2500)

    return () => window.clearInterval(pollId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderQ, dateFrom, dateTo, orderPage])

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
      const images = normalizeProductImages(newProduct.images, newProduct.name)
      const payload = {
        ...newProduct,
        price: Number(newProduct.price || 0),
        stock: Number(newProduct.stock || 0),
        is_active: Boolean(newProduct.is_active),
        height_cm: newProduct.height_cm === '' ? null : Number(newProduct.height_cm),
        width_cm: newProduct.width_cm === '' ? null : Number(newProduct.width_cm),
        depth_cm: newProduct.depth_cm === '' ? null : Number(newProduct.depth_cm),
        images,
        mainImage: images[0]?.url || '',
      }
      const response = await adminApi.createProduct(payload)
      showNotice(response.message || 'Producto creado correctamente.')
      setNewProduct(EMPTY_PRODUCT)
      setShowCreateModal(false)
      await Promise.all([loadProducts({ page: 1 }), loadSummary()])
      setProductPage(1)
    } catch (error) {
      showNotice(readApiError(error), 'error')
    }
  }

  const onUpdateProduct = async (product) => {
    try {
      const images = normalizeProductImages(product.images, product.name)
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
        images,
        mainImage: images[0]?.url || '',
      }
      const response = await adminApi.updateProduct(product.slug, payload)
      showNotice(response.message)
      await Promise.all([loadProducts(), loadSummary()])
    } catch (error) {
      showNotice(readApiError(error), 'error')
    }
  }

  const removeProductImage = async (productId, indexToRemove) => {
    const product = products.find((item) => item.id === productId)
    if (!product) return

    const imagesList = (product.images || []).filter((_, index) => index !== indexToRemove)
    const mainImage = product.mainImage === product.images?.[indexToRemove]?.url ? (imagesList[0]?.url || '') : product.mainImage

    const updatedProduct = { ...product, images: imagesList, mainImage }

    setProducts((prev) => prev.map((item) => (
      item.id === productId ? updatedProduct : item
    )))

    if (updatedProduct.slug) {
      await onUpdateProduct(updatedProduct)
    }
  }

  const reorderArray = (arr, fromIndex, toIndex) => {
    const copy = [...arr]
    const [moved] = copy.splice(fromIndex, 1)
    copy.splice(toIndex, 0, moved)
    return copy
  }

  const reorderProductImages = (productId, fromIndex, toIndex) => {
    let updatedProduct = null
    setProducts((prev) => prev.map((p) => {
      if (p.id !== productId) return p
      const imagesList = reorderArray(p.images || [], fromIndex, toIndex)
      const mainImage = imagesList[0]?.url || ''
      updatedProduct = { ...p, images: imagesList, mainImage }
      return updatedProduct
    }))
    if (updatedProduct) {
      onUpdateProduct(updatedProduct).catch(() => {})
    }
    setDragging(null)
  }

  const reorderNewProductImages = (fromIndex, toIndex) => {
    setNewProduct((prev) => {
      const imagesList = reorderArray(prev.images || [], fromIndex, toIndex)
      const mainImage = imagesList[0]?.url || ''
      return { ...prev, images: imagesList, mainImage }
    })
    setDragging(null)
  }

  const onDeleteProduct = async (slug) => {
    setRemovingProductSlug(slug)

    await new Promise((resolve) => setTimeout(resolve, 220))

    try {
      const response = await adminApi.deleteProduct(slug)
      showNotice(response.message || 'Producto eliminado correctamente.')
      await Promise.all([loadProducts(), loadSummary()])
    } catch (error) {
      showNotice(readApiError(error), 'error')
    } finally {
      setRemovingProductSlug('')
    }
  }

  const onOrderDecision = async (orderId, action) => {
    try {
      const response = action === 'accept' ? await adminApi.acceptOrder(orderId) : await adminApi.rejectOrder(orderId)
      showNotice(response.message)
      await Promise.all([loadOrders(), loadSummary()])
    } catch (error) {
      showNotice(readApiError(error), 'error')
    }
  }

  const editableProducts = useMemo(
    () => products.map((product) => ({ ...product })),
    [products],
  )

  return (
    <div className="app-shell">
      <AdminHeader
        tab={tab}
        onChangeTab={setTab}
        onLogout={onLogout}
        lowStockProducts={summary.low_stock_products || []}
        lowStockThreshold={summary.low_stock_threshold || 5}
      />
      {noticeTone === 'error' && notice && (
        <div className="center-notice-layer">
          <NoticeBanner message={notice} tone={noticeTone} />
        </div>
      )}
      <main className="container admin-layout">
        {noticeTone !== 'error' && <NoticeBanner message={notice} tone={noticeTone} />}
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

            <div className="product-list">
              {editableProducts.map((product) => (
                <article
                  className={`product-list-item ${expandedProductId === product.id ? 'is-open' : ''} ${removingProductSlug === product.slug ? 'is-removing' : ''} ${product.is_low_stock ? 'is-low-stock' : ''}`}
                  key={product.id}
                >
                  <button
                    type="button"
                    className="product-list-summary"
                    onClick={() => setExpandedProductId((current) => (current === product.id ? null : product.id))}
                    aria-expanded={expandedProductId === product.id}
                  >
                    <span className="product-list-thumb">
                      {product.images?.[0]?.url ? (
                        <img src={product.images[0].url} alt={product.images[0].alt || product.name} />
                      ) : (
                        <span>{product.name.slice(0, 2)}</span>
                      )}
                    </span>
                    <span className="product-list-main">
                      <strong>{product.name}</strong>
                      <small>{product.slug}</small>
                    </span>
                    <span className="product-list-meta">{formatCurrency(product.price)}</span>
                    <span className="product-list-meta">Stock {product.stock}</span>
                    <span className={`chip ${product.is_active ? '' : 'is-muted'}`}>
                      {product.is_active ? 'Activo' : 'Oculto'}
                    </span>
                    {product.is_low_stock && (
                      <span className={`stock-badge ${product.stock_status === 'out_of_stock' ? 'is-critical' : ''}`}>
                        {product.stock_status_label}
                      </span>
                    )}
                  </button>

                  {expandedProductId === product.id && (
                    <div className="product-edit-panel">
                      <div className="admin-form-grid">
                        <AdminField label="Nombre del producto">
                          <input value={product.name} onChange={(e) => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, name: e.target.value } : p))} />
                        </AdminField>
                        <AdminField label="ID">
                          <input value={product.slug} onChange={(e) => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, slug: e.target.value } : p))} />
                        </AdminField>
                        <AdminField label="Precio">
                          <input type="number" step="0.01" value={product.price} onChange={(e) => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, price: e.target.value } : p))} />
                        </AdminField>
                        <AdminField label="Stock">
                          <input type="number" value={product.stock} onChange={(e) => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, stock: e.target.value } : p))} />
                        </AdminField>
                      </div>

                      <AdminField label="Descripcion">
                        <textarea value={product.description || ''} onChange={(e) => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, description: e.target.value } : p))}></textarea>
                      </AdminField>

                      <div className="product-images-editor">
                        <span className="admin-field-title">Fotos del producto</span>
                        <div className="product-image-previews">
                          {(product.images || []).length > 0
                            ? product.images.map((image, index) => {
                                return (
                                    <div
                                      className={`product-image-preview relative group ${(dragging && !dragging.isNew && dragging.productId === product.id && dragging.index === index) ? 'is-dragging' : ''}`}
                                      key={`${image.url}-${index}`}
                                       draggable
                                       onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(index)); setDragging({ productId: product.id, index, isNew: false }) }}
                                       onDragEnd={() => setDragging(null)}
                                       onDragOver={(e) => e.preventDefault()}
                                       onDrop={(e) => {
                                         const from = parseInt(e.dataTransfer.getData('text/plain'), 10)
                                          if (!Number.isNaN(from)) reorderProductImages(product.id, from, index)
                                        }}
                                    >
                                    <img src={image.url} alt={image.alt || product.name} />
                                    <button
                                      type="button"
                                      className="image-remove-btn"
                                      onClick={() => setProducts((prev) => prev.map((p) => {
                                        if (p.id !== product.id) return p
                                        const imagesList = (p.images || []).filter((_, i) => i !== index)
                                        const mainImage = p.mainImage === image.url ? (imagesList[0]?.url || '') : p.mainImage
                                        return { ...p, images: imagesList, mainImage }
                                      }))}
                                    >
                                      ×
                                    </button>
                                  </div>
                                )
                              })
                            : (
                                <span className="muted">Sin fotos cargadas</span>
                              )}
                        </div>
                        <span className="image-editor-note">Fotos cargadas como miniaturas. Agrega URLs externas solo si las necesitas.</span>
                        <AdminField label="URLs externas">
                          <textarea
                            value={productImagesText(product.images || [])}
                            onChange={(e) => setProducts((prev) => prev.map((p) => (
                              p.id === product.id
                                ? { ...p, images: mergeExternalImageText(p.images || [], e.target.value, product.name) }
                                : p
                            )))}
                            placeholder="Una URL por linea"
                          />
                        </AdminField>
                        <div className="card-actions">
                          <label className="btn-alt file-btn">
                            Cargar fotos
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={async (e) => {
                                await addImagesToProduct(product.id, e.target.files)
                                e.target.value = ''
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      <div className="admin-form-grid">
                        <AdminField label="Talla">
                          <input value={product.size || ''} onChange={(e) => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, size: e.target.value } : p))} placeholder="Opcional" />
                        </AdminField>
                        <AdminField label="Altura cm">
                          <input type="number" step="0.01" value={product.height_cm || ''} onChange={(e) => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, height_cm: e.target.value } : p))} />
                        </AdminField>
                        <AdminField label="Ancho cm">
                          <input type="number" step="0.01" value={product.width_cm || ''} onChange={(e) => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, width_cm: e.target.value } : p))} />
                        </AdminField>
                        <AdminField label="Profundidad cm">
                          <input type="number" step="0.01" value={product.depth_cm || ''} onChange={(e) => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, depth_cm: e.target.value } : p))} />
                        </AdminField>
                      </div>

                      <label className="method">
                        <input type="checkbox" checked={Boolean(product.is_active)} onChange={(e) => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_active: e.target.checked } : p))} />
                        Publicado en catalogo
                      </label>
                      <div className="card-actions">
                        <button type="button" onClick={() => onUpdateProduct(product)}>Guardar cambios</button>
                        <button type="button" className="btn-danger" onClick={() => onDeleteProduct(product.slug)}>Eliminar</button>
                      </div>
                    </div>
                  )}
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
        <div className="modal-overlay admin-create-overlay" role="dialog" aria-modal="true" onClick={() => setShowCreateModal(false)}>
          <section className="modal-card admin-create-card" onClick={(e) => e.stopPropagation()}>
            <h3>Agregar producto</h3>
            <form className="stack" onSubmit={onCreateProduct}>
              <div className="admin-form-grid">
                <AdminField label="Nombre del producto">
                  <input placeholder="Ej: BOLSO 4" value={newProduct.name} onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))} required />
                </AdminField>
                <AdminField label="Precio">
                  <input type="number" step="0.01" min="0" placeholder="Ej: 29990" value={newProduct.price} onChange={(e) => setNewProduct((prev) => ({ ...prev, price: e.target.value }))} required />
                </AdminField>
                <AdminField label="Stock">
                  <input type="number" min="0" placeholder="Ej: 12" value={newProduct.stock} onChange={(e) => setNewProduct((prev) => ({ ...prev, stock: e.target.value }))} required />
                </AdminField>
              </div>
              <AdminField label="Descripcion">
                <textarea placeholder="Describe el producto para el catalogo" value={newProduct.description} onChange={(e) => setNewProduct((prev) => ({ ...prev, description: e.target.value }))}></textarea>
              </AdminField>
              <div className="product-images-editor">
                <span className="admin-field-title">Fotos del producto</span>
                <div className="product-image-previews">
                  {(newProduct.images || []).length > 0
                    ? newProduct.images.map((image, index) => {
                        return (
                          <div
                            className={`product-image-preview relative group ${(dragging && dragging.isNew && dragging.index === index) ? 'is-dragging' : ''}`}
                            key={`${image.url}-${index}`}
                              draggable
                              onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(index)); setDragging({ productId: null, index, isNew: true }) }}
                              onDragEnd={() => setDragging(null)}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                const from = parseInt(e.dataTransfer.getData('text/plain'), 10)
                                if (!Number.isNaN(from)) reorderNewProductImages(from, index)
                              }}
                          >
                            <img src={image.url} alt={image.alt || newProduct.name} />
                            <button
                              type="button"
                              className="image-remove-btn"
                              onClick={() => setNewProduct((prev) => {
                                const imagesList = (prev.images || []).filter((_, i) => i !== index)
                                const mainImage = prev.mainImage === image.url ? (imagesList[0]?.url || '') : prev.mainImage
                                return { ...prev, images: imagesList, mainImage }
                              })}
                            >
                              ×
                            </button>
                          </div>
                        )
                      })
                    : (
                        <span className="muted">Sin fotos cargadas</span>
                      )}
                </div>
                <span className="image-editor-note">Fotos cargadas como miniaturas. Agrega URLs externas solo si las necesitas.</span>
                <AdminField label="URLs externas">
                  <textarea
                    value={productImagesText(newProduct.images || [])}
                    onChange={(e) => setNewProduct((prev) => ({
                      ...prev,
                      images: mergeExternalImageText(prev.images || [], e.target.value, prev.name),
                    }))}
                    placeholder="Una URL por linea"
                  />
                </AdminField>
                <div className="card-actions">
                  <label className="btn-alt file-btn">
                    Cargar fotos
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={async (e) => {
                        await addImagesToNewProduct(e.target.files)
                        e.target.value = ''
                      }}
                    />
                  </label>
                </div>
              </div>
              <div className="admin-form-grid">
                <AdminField label="Talla">
                  <input placeholder="Opcional" value={newProduct.size} onChange={(e) => setNewProduct((prev) => ({ ...prev, size: e.target.value }))} />
                </AdminField>
                <AdminField label="Altura cm">
                  <input type="number" step="0.01" min="0" placeholder="Ej: 30" value={newProduct.height_cm} onChange={(e) => setNewProduct((prev) => ({ ...prev, height_cm: e.target.value }))} />
                </AdminField>
                <AdminField label="Ancho cm">
                  <input type="number" step="0.01" min="0" placeholder="Ej: 42" value={newProduct.width_cm} onChange={(e) => setNewProduct((prev) => ({ ...prev, width_cm: e.target.value }))} />
                </AdminField>
                <AdminField label="Profundidad cm">
                  <input type="number" step="0.01" min="0" placeholder="Ej: 14" value={newProduct.depth_cm} onChange={(e) => setNewProduct((prev) => ({ ...prev, depth_cm: e.target.value }))} />
                </AdminField>
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