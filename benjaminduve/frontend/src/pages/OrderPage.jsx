import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import PublicHeader from '../components/PublicHeader'
import NoticeBanner from '../components/NoticeBanner'
import { storeApi } from '../api/storeApi'
import { useCart } from '../context/CartContext'
import { formatCurrency, readApiError } from '../utils'

const RECEIPT_DRAFT_KEY = 'bdv_receipt_draft_v1'
const ORDER_CART_RESTORE_KEY = 'bdv_order_cart_restore_v1'
const ORDER_NOTICE_KEY = 'bdv_order_notice'
const CART_NOTICE_KEY = 'bdv_cart_notice'

export default function OrderPage() {
  const navigate = useNavigate()
  const { restoreCart } = useCart()
  const { orderId } = useParams()
  const [params] = useSearchParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const token = useMemo(() => {
    const fromQuery = params.get('token')
    if (fromQuery) return fromQuery
    try {
      const latest = JSON.parse(localStorage.getItem('latest_order') || '{}')
      if (String(latest.id) === String(orderId)) return latest.token || ''
    } catch {
      return ''
    }
    return ''
  }, [orderId, params])

  const fetchOrder = async () => {
    if (!token) {
      setNotice('Token de pedido no disponible.')
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response = await storeApi.getOrderSummary(orderId, token)
      setOrder(response.data)
    } catch (error) {
      setNotice(readApiError(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrder()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, token])

  useEffect(() => {
    const flash = localStorage.getItem(ORDER_NOTICE_KEY)
    if (!flash) return
    setNotice(flash)
    localStorage.removeItem(ORDER_NOTICE_KEY)
  }, [])

  useEffect(() => {
    if (!notice) return
    const id = setTimeout(() => setNotice(''), 2600)
    return () => clearTimeout(id)
  }, [notice])

  const cancelOrder = async () => {
    if (!order || !token) return
    setBusy(true)
    try {
      const response = await storeApi.cancelOrder(order.id, { order_token: token })
      setOrder(response.data)
      localStorage.removeItem(RECEIPT_DRAFT_KEY)
      localStorage.removeItem('latest_order')
      restoreCartFromSnapshot()
      localStorage.setItem(CART_NOTICE_KEY, 'Compra cancelada.')
      navigate('/carrito')
    } catch (error) {
      setNotice(readApiError(error))
    } finally {
      setBusy(false)
    }
  }

  const waitingAdminDecision = order?.admin_review_status === 'pending' && order?.status === 'pending'
  const receiptDate = order?.electronic_receipt?.issued_at
    ? new Date(order.electronic_receipt.issued_at).toLocaleString('es-CL')
    : '-'

  const printReceipt = () => {
    window.print()
  }

  const restoreCartFromSnapshot = useCallback(() => {
    try {
      const restoreRaw = localStorage.getItem(ORDER_CART_RESTORE_KEY)
      if (restoreRaw) {
        const restoreItems = JSON.parse(restoreRaw)
        if (Array.isArray(restoreItems)) {
          restoreCart(restoreItems)
        }
      }
    } catch {
      // Si el snapshot esta corrupto, no modificamos el carrito actual.
    }
    localStorage.removeItem(ORDER_CART_RESTORE_KEY)
  }, [restoreCart])

  useEffect(() => {
    if (!order?.should_reset_checkout_data) return

    localStorage.removeItem(RECEIPT_DRAFT_KEY)
    localStorage.removeItem('latest_order')
    restoreCartFromSnapshot()
    localStorage.setItem(CART_NOTICE_KEY, 'Pago rechazado. Puedes volver a intentarlo cuando quieras.')
    navigate('/', { replace: true })
  }, [navigate, order?.should_reset_checkout_data, restoreCartFromSnapshot])

  useEffect(() => {
    if (!order?.can_print_receipt) return

    restoreCart([])
    localStorage.removeItem(RECEIPT_DRAFT_KEY)
    localStorage.removeItem(ORDER_CART_RESTORE_KEY)
    localStorage.setItem('latest_order', JSON.stringify({ id: order.id, token }))
  }, [order?.can_print_receipt, order?.id, restoreCart, token])

  useEffect(() => {
    if (!order || !token) return
    const shouldPoll = order.admin_review_status === 'pending' && order.status === 'pending'
    if (!shouldPoll) return

    const pollId = window.setInterval(async () => {
      try {
        const response = await storeApi.getOrderSummary(orderId, token)
        setOrder(response.data)
      } catch {
        // Si falla el polling, no interrumpimos el flujo del usuario.
      }
    }, 3000)

    return () => window.clearInterval(pollId)
  }, [order, orderId, token])

  return (
    <div className="app-shell">
      <PublicHeader />
      <main className="container">
        <NoticeBanner message={notice} />
        {loading ? (
          <section className="panel">Cargando pedido...</section>
        ) : !order ? (
          <section className="panel">No se encontro el pedido.</section>
        ) : (
          <>
            <section className="panel">
              <h2>Pedido #{order.id}</h2>
              <div className="chips">
                <span className="chip">Revision: {order.admin_review_label}</span>
                <span className="chip">Estado: {order.status_label}</span>
                <span className="chip">Pago: {order.payment_status_label}</span>
              </div>
              <div className="stack">
                {order.items.map((item) => (
                  <div className="row-card" key={item.id}>
                    <strong>{item.product_name} x {item.quantity}</strong>
                    <span>{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <p className="spacer-top"><strong>Total: {formatCurrency(order.total)}</strong></p>
            </section>

            {order.can_print_receipt ? (
              <section className="panel receipt-card">
                <div className="receipt-head">
                  <div>
                    <h3>Boleta electronica</h3>
                    <p className="muted">Numero: {order.electronic_receipt?.number}</p>
                    <p className="muted">Fecha: {receiptDate}</p>
                  </div>
                </div>

                <div className="receipt-customer">
                  <div><span>Cliente</span><strong>{order.customer_name}</strong></div>
                  <div><span>Correo</span><strong>{order.customer_email}</strong></div>
                  <div><span>RUT</span><strong>{order.billing?.tax_id}</strong></div>
                  <div><span>Direccion</span><strong>{order.billing?.address}</strong></div>
                  <div><span>Ciudad</span><strong>{order.billing?.city}</strong></div>
                </div>

                <div className="receipt-table-wrap">
                  <table className="receipt-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cant.</th>
                        <th>Unitario</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.product_name}</td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.unit_price)}</td>
                          <td>{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="receipt-total">
                  <span>Subtotal</span>
                  <strong>{formatCurrency(order.total)}</strong>
                </div>

                <div className="card-actions spacer-top no-print">
                  <button type="button" onClick={printReceipt}>Imprimir boleta</button>
                  <a className="btn-alt" href="/">Volver al home</a>
                </div>
              </section>
            ) : (
              <section className="panel">
                <h3>Boleta electronica</h3>
                <p className="muted">La boleta final se habilita cuando el pago sea aceptado.</p>
              </section>
            )}

            {waitingAdminDecision && (
              <div className="modal-overlay no-print waiting-overlay">
                <section className="modal-card waiting-card">
                  <div className="waiting-spinner" aria-hidden="true"></div>
                  <h3>Esperando aprobacion del pago</h3>
                  <p className="muted">Tu pedido esta en revision. Te avisaremos cuando cambie el estado.</p>
                  <div className="card-actions spacer-top">
                    <button type="button" className="btn-danger" onClick={cancelOrder} disabled={busy}>
                      {busy ? 'Cancelando...' : 'Cancelar pago'}
                    </button>
                  </div>
                </section>
              </div>
            )}

            {order.admin_review_status === 'pending' && !waitingAdminDecision && (
              <section className="panel">
                <h3>Pedido en espera</h3>
                <p className="muted">Tu pedido esta en espera de aprobacion.</p>
              </section>
            )}

          </>
        )}
      </main>
    </div>
  )
}
