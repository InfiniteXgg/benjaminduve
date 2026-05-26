import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PublicHeader from '../components/PublicHeader'
import NoticeBanner from '../components/NoticeBanner'
import { storeApi } from '../api/storeApi'
import { useCart } from '../context/CartContext'
import { formatCurrency, readApiError } from '../utils'

const CART_NOTICE_KEY = 'bdv_cart_notice'

function productMeasurementsText(product) {
  const rawSize = (product.size || '').trim()
  if (rawSize !== '') return `Talla: ${rawSize}`

  const measures = []
  if (product.height_cm) measures.push(`Alto ${product.height_cm} cm`)
  if (product.width_cm) measures.push(`Ancho ${product.width_cm} cm`)
  if (product.depth_cm) measures.push(`Prof. ${product.depth_cm} cm`)
  if (measures.length === 0) return ''
  return `Medidas: ${measures.join(' | ')}`
}

export default function HomePage() {
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 })
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [noticeTone, setNoticeTone] = useState('info')
  const [quantityInputs, setQuantityInputs] = useState({})
  const [quantityPickerOpen, setQuantityPickerOpen] = useState({})
  const [quantityErrors, setQuantityErrors] = useState({})
  const { addItem } = useCart()

  const search = params.get('q') || ''
  const page = Number(params.get('page') || 1)

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    storeApi
      .listProducts({ q: search, page })
      .then((response) => {
        if (!isMounted) return
        setProducts(response.data || [])
        setMeta(response.meta || { current_page: 1, last_page: 1 })
      })
      .catch((error) => {
        if (!isMounted) return
        setNotice(readApiError(error))
      })
      .finally(() => {
        if (isMounted) setLoading(false)
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

  const onSearch = (event) => {
    event.preventDefault()
    const value = event.target.q.value.trim()
    const next = new URLSearchParams()
    if (value) next.set('q', value)
    next.set('page', '1')
    setParams(next)
  }

  const onAdd = (product) => {
    if (!quantityPickerOpen[product.id]) {
      setQuantityPickerOpen((prev) => ({ ...prev, [product.id]: true }))
      setQuantityInputs((prev) => ({ ...prev, [product.id]: prev[product.id] || 1 }))
      setQuantityErrors((prev) => ({ ...prev, [product.id]: '' }))
      return
    }

    const qty = Number(quantityInputs[product.id] || 1)
    const stock = Number(product.stock || 0)

    if (!Number.isFinite(qty) || qty < 1) {
      setQuantityErrors((prev) => ({ ...prev, [product.id]: 'Ingresa una cantidad valida.' }))
      return
    }

    if (qty > stock) {
      setQuantityErrors((prev) => ({
        ...prev,
        [product.id]: `Stock insuficiente. Solo hay ${stock} unidad(es).`,
      }))
      return
    }

    const result = addItem(product, qty)
    setNotice(result.message)
    setNoticeTone(result.ok ? 'info' : 'error')
    if (!result.ok) {
      setQuantityErrors((prev) => ({ ...prev, [product.id]: result.message }))
      return
    }

    setQuantityErrors((prev) => ({ ...prev, [product.id]: '' }))
    setQuantityInputs((prev) => ({ ...prev, [product.id]: 1 }))
    setQuantityPickerOpen((prev) => ({ ...prev, [product.id]: false }))
  }

  return (
    <div className="app-shell">
      <PublicHeader />
      <main className="container">
        <NoticeBanner message={notice} tone={noticeTone} />

        <section className="panel">
          <h2>Catalogo</h2>
          <p className="muted">Explora los productos de Benjaminduve.</p>
          <form className="search-row" onSubmit={onSearch}>
            <input name="q" defaultValue={search} placeholder="Buscar producto..." />
            <button type="submit">Buscar</button>
          </form>
        </section>

        {loading ? (
          <section className="panel">Cargando productos...</section>
        ) : products.length === 0 ? (
          <section className="panel">No hay productos disponibles.</section>
        ) : (
          <>
            <section className="grid">
              {products.map((product) => (
                <article key={product.id} className="card">
                  <div className="placeholder">Placeholder de imagen</div>
                  <h3>{product.name}</h3>
                  <p className="muted">{product.description || 'Sin descripcion aun.'}</p>
                  {productMeasurementsText(product) && (
                    <p className="muted">{productMeasurementsText(product)}</p>
                  )}
                  <p className="price">{formatCurrency(product.price)}</p>
                  <p className="muted">Stock: {product.stock}</p>
                  <div className="card-actions">
                    <Link className="btn-alt" to={`/producto/${product.slug}`}>
                      Ver detalle
                    </Link>
                    <div className={`qty-slot ${quantityPickerOpen[product.id] ? 'open' : ''}`}>
                      <input
                        type="number"
                        min="1"
                        value={quantityInputs[product.id] || 1}
                        tabIndex={quantityPickerOpen[product.id] ? 0 : -1}
                        aria-hidden={!quantityPickerOpen[product.id]}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            onAdd(product)
                          }
                        }}
                        onChange={(e) =>
                          setQuantityInputs((prev) => ({
                            ...prev,
                            [product.id]: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <button type="button" onClick={() => onAdd(product)} disabled={product.stock <= 0}>
                      {product.stock <= 0 ? 'Sin stock' : 'Anadir'}
                    </button>
                  </div>
                  {quantityErrors[product.id] && (
                    <p className="field-error">{quantityErrors[product.id]}</p>
                  )}
                </article>
              ))}
            </section>
            <section className="panel pagination">
              <button
                type="button"
                onClick={() => setParams((prev) => {
                  const next = new URLSearchParams(prev)
                  next.set('page', String(Math.max(1, page - 1)))
                  return next
                })}
                disabled={page <= 1}
              >
                Anterior
              </button>
              <span>Pagina {meta.current_page} de {meta.last_page}</span>
              <button
                type="button"
                onClick={() => setParams((prev) => {
                  const next = new URLSearchParams(prev)
                  next.set('page', String(Math.min(meta.last_page || 1, page + 1)))
                  return next
                })}
                disabled={page >= (meta.last_page || 1)}
              >
                Siguiente
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
