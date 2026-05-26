import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PublicHeader from '../components/PublicHeader'
import NoticeBanner from '../components/NoticeBanner'
import { storeApi } from '../api/storeApi'
import { useCart } from '../context/CartContext'
import { formatCurrency, readApiError } from '../utils'

export default function ProductPage() {
  const { slug } = useParams()
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const { addItem } = useCart()

  useEffect(() => {
    let mounted = true
    setLoading(true)

    storeApi
      .getProduct(slug)
      .then((response) => {
        if (mounted) setProduct(response.data)
      })
      .catch((error) => {
        if (mounted) setNotice(readApiError(error))
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [slug])

  useEffect(() => {
    if (!notice) return
    const id = setTimeout(() => setNotice(''), 2600)
    return () => clearTimeout(id)
  }, [notice])

  const onAdd = () => {
    if (!product) return
    const result = addItem(product, quantity)
    setNotice(result.message)
  }

  return (
    <div className="app-shell">
      <PublicHeader />
      <main className="container">
        <NoticeBanner message={notice} />
        {loading ? (
          <section className="panel">Cargando producto...</section>
        ) : !product ? (
          <section className="panel">Producto no encontrado.</section>
        ) : (
          <section className="panel">
            <div className="placeholder detail-placeholder">Placeholder de imagen de producto</div>
            <h1>{product.name}</h1>
            <p className="price">{formatCurrency(product.price)}</p>
            <p className="muted">{product.description || 'Sin descripcion disponible.'}</p>
            <p className="muted">Stock disponible: {product.stock}</p>
            <div className="card-actions">
              <Link className="btn-alt" to="/">Volver al catalogo</Link>
              <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value || 1))} />
              <button type="button" onClick={onAdd} disabled={product.stock <= 0}>
                {product.stock <= 0 ? 'Sin stock' : 'Agregar al carrito'}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
