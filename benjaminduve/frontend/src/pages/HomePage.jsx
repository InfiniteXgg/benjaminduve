import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PublicHeader from '../components/PublicHeader'
import HeroCarousel from '../components/HeroCarousel'
import NoticeBanner from '../components/NoticeBanner'
import { storeApi } from '../api/storeApi'
import { useCart } from '../context/CartContext'
import { formatCurrency, readApiError } from '../utils'

const CART_NOTICE_KEY = 'bdv_cart_notice'

function productMeasurementItems(product) {
  const rawSize = (product.size || '').trim()
  if (rawSize !== '') return [{ label: 'Talla', value: rawSize }]

  const measures = []
  if (product.height_cm) measures.push({ label: 'Alto', value: `${product.height_cm} cm` })
  if (product.width_cm) measures.push({ label: 'Ancho', value: `${product.width_cm} cm` })
  if (product.depth_cm) measures.push({ label: 'Profundidad', value: `${product.depth_cm} cm` })
  return measures
}

function productImages(product) {
  if (Array.isArray(product?.images) && product.images.length > 0) {
    return product.images
  }

  return [
    { id: 'main', alt: product?.name || 'Producto' },
    { id: 'detail', alt: `${product?.name || 'Producto'} detalle` },
    { id: 'texture', alt: `${product?.name || 'Producto'} material` },
  ]
}

export default function HomePage() {
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1 })
  const [loading, setLoading] = useState(true)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [resultsAnimationKey, setResultsAnimationKey] = useState(0)
  const [notice, setNotice] = useState('')
  const [noticeTone, setNoticeTone] = useState('info')
  const [searchDraft, setSearchDraft] = useState(params.get('q') || '')
  const [searchPanelOpen, setSearchPanelOpen] = useState(false)
  const [searchPanelClosing, setSearchPanelClosing] = useState(false)
  const [searchPanelCloseTimeout, setSearchPanelCloseTimeout] = useState(null)
  const searchPanelRef = useRef(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [detailQuantity, setDetailQuantity] = useState(1)
  const [detailError, setDetailError] = useState('')
  const { addItem } = useCart()

  const search = params.get('q') || ''
  const page = Number(params.get('page') || 1)

  useEffect(() => {
    setSearchDraft(search)
  }, [search])

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    storeApi
      .listProducts({ q: search, page })
      .then((response) => {
        if (!isMounted) return
        setProducts(response.data || [])
        setMeta({
          currentPage: response.meta?.current_page || 1,
          lastPage: response.meta?.last_page || 1,
        })
        setResultsAnimationKey((current) => current + 1)
      })
      .catch((error) => {
        if (!isMounted) return
        setNotice(readApiError(error))
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
          setHasLoadedOnce(true)
        }
      })

    return () => {
      isMounted = false
    }
  }, [search, page])

  useEffect(() => {
    if (!notice) return
    const id = setTimeout(() => setNotice(''), 2600)
    return () => clearTimeout(id)
  }, [notice])

  useEffect(() => {
    const flash = localStorage.getItem(CART_NOTICE_KEY)
    if (!flash) return
    setNotice(flash)
    setNoticeTone('error')
    localStorage.removeItem(CART_NOTICE_KEY)
  }, [])

  useEffect(() => {
    const id = setTimeout(() => {
      const value = searchDraft.trim()
      if (value === search) return

      const next = new URLSearchParams()
      if (value) next.set('q', value)
      next.set('page', '1')
      setParams(next)
    }, 260)

    return () => clearTimeout(id)
  }, [searchDraft, search, setParams])

  const openSearchPanel = () => {
    if (searchPanelCloseTimeout) clearTimeout(searchPanelCloseTimeout)
    setSearchPanelClosing(false)
    setSearchPanelOpen(true)
  }

  const closeSearchPanel = () => {
    if (searchPanelCloseTimeout) clearTimeout(searchPanelCloseTimeout)
    setSearchPanelClosing(true)
    window.setTimeout(() => {
      setSearchPanelOpen(false)
      setSearchPanelClosing(false)
    }, 220)
  }

  const toggleSearchPanel = () => {
    if (searchPanelCloseTimeout) clearTimeout(searchPanelCloseTimeout)
    if (searchPanelOpen) {
      closeSearchPanel()
    } else {
      openSearchPanel()
    }
  }

  const handleSearchInputBlur = (event) => {
    const panel = searchPanelRef.current
    if (panel && event.relatedTarget && panel.contains(event.relatedTarget)) {
      return
    }

    const timeout = window.setTimeout(() => {
      closeSearchPanel()
    }, 180)
    setSearchPanelCloseTimeout(timeout)
  }

  const handleSearchInputFocus = () => {
    if (searchPanelCloseTimeout) clearTimeout(searchPanelCloseTimeout)
  }

  useEffect(() => {
    if (!searchPanelOpen) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeSearchPanel()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [searchPanelOpen])

  const goToPage = (nextPage) => {
    const next = new URLSearchParams(params)
    if (search) next.set('q', search)
    next.set('page', String(nextPage))
    setParams(next)
  }

  const showInitialLoading = loading && !hasLoadedOnce
  const selectedImages = selectedProduct ? productImages(selectedProduct) : []
  const selectedMeasurementItems = selectedProduct ? productMeasurementItems(selectedProduct) : []

  useEffect(() => {
    if (!selectedProduct) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedProduct(null)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [selectedProduct])

  const openProductModal = (product) => {
    setSelectedProduct(product)
    setSelectedImageIndex(0)
    setDetailQuantity(1)
    setDetailError('')
  }

  const addSelectedProduct = () => {
    if (!selectedProduct) return

    const qty = Number(detailQuantity || 1)
    const stock = Number(selectedProduct.stock || 0)

    if (!Number.isFinite(qty) || qty < 1) {
      setDetailError('Ingresa una cantidad valida.')
      return
    }

    if (qty > stock) {
      setDetailError(`Stock insuficiente. Solo hay ${stock} unidad(es).`)
      return
    }

    const result = addItem(selectedProduct, qty)
    if (!result.ok) {
      setDetailError(result.message)
      return
    }

    setNotice(result.message)
    setNoticeTone('info')
    setSelectedProduct(null)
  }

  return (
    <div className="app-shell">
      <PublicHeader onSearchClick={toggleSearchPanel} />
      {searchPanelOpen && (
        <div className={`catalog-search-layer ${searchPanelClosing ? 'is-closing' : 'is-open'}`} role="presentation">
          <button
            type="button"
            className="catalog-search-backdrop"
            aria-label="Cerrar busqueda"
            onClick={closeSearchPanel}
          />
          <section
            ref={searchPanelRef}
            className="catalog-search-panel"
            role="dialog"
            aria-label="Buscar productos"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="catalog-search-content">
              <span className="muted">Buscar en catalogo</span>
              <input
                autoFocus
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                onBlur={handleSearchInputBlur}
                onFocus={handleSearchInputFocus}
                placeholder="Escribe el nombre de un producto..."
                aria-label="Buscar producto"
              />
            </div>
          </section>
        </div>
      )}
      {selectedProduct && (
        <div className="product-modal-overlay" role="presentation" onMouseDown={() => setSelectedProduct(null)}>
          <section
            className="product-modal"
            role="dialog"
            aria-modal="true"
            aria-label={selectedProduct.name}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="search-close-btn product-modal-close"
              onClick={() => setSelectedProduct(null)}
              aria-label="Cerrar detalle"
              title="Cerrar detalle"
            >
              X
            </button>
            <div className="product-modal-gallery">
              <div className="product-modal-main-image">
                {selectedImages[selectedImageIndex]?.url ? (
                  <img
                    src={selectedImages[selectedImageIndex].url}
                    alt={selectedImages[selectedImageIndex].alt || selectedProduct.name}
                  />
                ) : (
                  <span>{selectedProduct.name}</span>
                )}
              </div>
              <div className="product-modal-thumbs">
                {selectedImages.map((image, index) => (
                  <button
                    type="button"
                    key={image.id || image.url || index}
                    className={`product-modal-thumb ${index === selectedImageIndex ? 'active' : ''}`}
                    onClick={() => setSelectedImageIndex(index)}
                    aria-label={`Foto ${index + 1}`}
                  >
                    {image.url ? <img src={image.url} alt={image.alt || selectedProduct.name} /> : <span>{index + 1}</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="product-modal-info">
              <div>
                <h2>{selectedProduct.name}</h2>
                <p className="price">{formatCurrency(selectedProduct.price)}</p>
              </div>
              <p>{selectedProduct.description || 'Sin descripcion disponible.'}</p>
              <div className="product-detail-grid">
                <div className="stock-detail-card">
                  <span className="muted">Stock</span>
                  <strong>{selectedProduct.stock}</strong>
                </div>
                <div>
                  <span className="muted">Medidas</span>
                  {selectedMeasurementItems.length > 0 ? (
                    <ul className="measurement-list">
                      {selectedMeasurementItems.map((measure) => (
                        <li key={measure.label}>
                          <span>{measure.label}</span>
                          <strong>{measure.value}</strong>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <strong>-</strong>
                  )}
                </div>
              </div>
              <div className="product-modal-actions">
                <input
                  type="number"
                  min="1"
                  max={selectedProduct.stock}
                  value={detailQuantity}
                  onChange={(event) => setDetailQuantity(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addSelectedProduct()
                    }
                  }}
                  aria-label="Cantidad"
                />
                <button type="button" onClick={addSelectedProduct} disabled={selectedProduct.stock <= 0}>
                  {selectedProduct.stock <= 0 ? 'Sin stock' : 'Agregar al carrito'}
                </button>
              </div>
              {detailError && <p className="field-error">{detailError}</p>}
            </div>
          </section>
        </div>
      )}
      <HeroCarousel />
      <main className="container">
        <NoticeBanner message={notice} tone={noticeTone} />

        {showInitialLoading ? (
          <section className="panel">Cargando productos...</section>
        ) : products.length === 0 ? (
          <section className="panel">No hay productos disponibles.</section>
        ) : (
          <>
            <section id="catalogo" className="grid catalog-results" key={resultsAnimationKey}>
              {products.map((product) => (
                <article key={product.id} className="card catalog-card">
                  <button
                    type="button"
                    className="catalog-card-image"
                    onClick={() => openProductModal(product)}
                    aria-label={`Ver detalle de ${product.name}`}
                  >
                    {product.images?.[0]?.url ? (
                      <img src={product.images[0].url} alt={product.images[0].alt || product.name} />
                    ) : (
                      <span>{product.name}</span>
                    )}
                  </button>
                  <h3>{product.name}</h3>
                  <p className="price">{formatCurrency(product.price)}</p>
                </article>
              ))}
            </section>
            {meta.lastPage > 1 && (
              <nav className="pagination catalog-pagination" aria-label="Paginacion del catalogo">
                <button
                  type="button"
                  className="pagination-btn"
                  disabled={meta.currentPage <= 1}
                  onClick={() => goToPage(meta.currentPage - 1)}
                >
                  ← Anterior
                </button>
                <span className="pagination-info">
                  Página {meta.currentPage} de {meta.lastPage}
                </span>
                <button
                  type="button"
                  className="pagination-btn"
                  disabled={meta.currentPage >= meta.lastPage}
                  onClick={() => goToPage(meta.currentPage + 1)}
                >
                  Siguiente →
                </button>
              </nav>
            )}
          </>
        )}
      </main>
    </div>
  )
}
