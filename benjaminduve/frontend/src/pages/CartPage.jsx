import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PublicHeader from '../components/PublicHeader'
import NoticeBanner from '../components/NoticeBanner'
import { useCart } from '../context/CartContext'
import { formatCurrency } from '../utils'

const CART_NOTICE_KEY = 'bdv_cart_notice'

export default function CartPage() {
  const navigate = useNavigate()
  const { items, total, updateItemQuantity, removeItem } = useCart()
  const [notice, setNotice] = useState('')
  const [noticeTone, setNoticeTone] = useState('info')
  const [removingItems, setRemovingItems] = useState({})
  const [quantityDrafts, setQuantityDrafts] = useState({})
  const [quantityErrors, setQuantityErrors] = useState({})

  useEffect(() => {
    const flash = localStorage.getItem(CART_NOTICE_KEY)
    if (!flash) return
    setNotice(flash)
    localStorage.removeItem(CART_NOTICE_KEY)
  }, [])

  useEffect(() => {
    if (!notice) return
    const id = setTimeout(() => setNotice(''), 3200)
    return () => clearTimeout(id)
  }, [notice])

  const onRemoveItem = (productId) => {
    if (removingItems[productId]) return

    setRemovingItems((current) => ({ ...current, [productId]: true }))
    window.setTimeout(() => {
      removeItem(productId)
      setRemovingItems((current) => {
        const next = { ...current }
        delete next[productId]
        return next
      })
    }, 260)
  }

  const onUpdateQuantity = (productId, nextQuantity) => {
    setQuantityDrafts((current) => ({ ...current, [productId]: nextQuantity }))
    setQuantityErrors((current) => {
      const next = { ...current }
      delete next[productId]
      return next
    })
  }

  const onCommitQuantity = (productId) => {
    const draft = quantityDrafts[productId]
    if (draft == null) return

    const parsedQuantity = Number(draft)
    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1) {
      const message = 'Ingresa una cantidad válida.'
      setQuantityErrors((current) => ({ ...current, [productId]: message }))
      setNoticeTone('error')
      setNotice(message)
      return
    }

    const result = updateItemQuantity(productId, parsedQuantity)
    if (!result.ok) {
      setQuantityErrors((current) => ({ ...current, [productId]: result.message }))
      setNoticeTone('error')
      setNotice(result.message)
      return
    }

    setNoticeTone('info')
    setNotice(result.message)
    setQuantityErrors((current) => {
      const next = { ...current }
      delete next[productId]
      return next
    })
    setQuantityDrafts((current) => {
      const next = { ...current }
      delete next[productId]
      return next
    })
  }

  return (
    <div className="app-shell">
      <PublicHeader />
      <main className="container">
        <NoticeBanner message={notice} tone={noticeTone} />
        <section className="panel">
          <h2>Carrito</h2>
          {items.length === 0 ? (
            <p className="muted">No hay productos en el carrito.</p>
          ) : (
            <>
              <div className="stack">
                {items.map((item) => (
                  <article key={item.id} className={`row-card cart-item ${removingItems[item.id] ? 'is-removing' : ''}`}>
                    <div>
                      <strong>{item.name}</strong>
                      <p className="muted">
                        Precio: {formatCurrency(item.price)} | Stock: {item.stock}
                      </p>
                      <p className="muted">
                        Subtotal: {formatCurrency(Number(item.price) * Number(item.quantity))}
                      </p>
                    </div>
                    <div className="card-actions">
                      <input
                        type="number"
                        min="1"
                        value={quantityDrafts[item.id] ?? item.quantity}
                        className={quantityErrors[item.id] ? 'is-invalid' : undefined}
                        onChange={(e) => onUpdateQuantity(item.id, e.target.value)}
                        onBlur={() => onCommitQuantity(item.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            onCommitQuantity(item.id)
                          }
                        }}
                        aria-invalid={Boolean(quantityErrors[item.id])}
                      />
                      <button type="button" onClick={() => onRemoveItem(item.id)} disabled={Boolean(removingItems[item.id])}>
                        Quitar
                      </button>
                    </div>
                    {quantityErrors[item.id] && <p className="field-error">{quantityErrors[item.id]}</p>}
                  </article>
                ))}
              </div>
              <div className="resume-row">
                <strong>Total: {formatCurrency(total)}</strong>
                <button type="button" onClick={() => navigate('/pre-checkout')}>Continuar con pedido</button>
              </div>
            </>
          )}
          <div className="spacer-top">
            <Link className="btn-alt" to="/">Seguir comprando</Link>
          </div>
        </section>
      </main>
    </div>
  )
}
