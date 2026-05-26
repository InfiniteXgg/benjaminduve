import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import PublicHeader from '../components/PublicHeader'
import NoticeBanner from '../components/NoticeBanner'
import { storeApi } from '../api/storeApi'
import { formatCurrency, readApiError } from '../utils'

export default function FinalOrderSummaryPage() {
  const { orderId } = useParams()
  const [params] = useSearchParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')

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

  useEffect(() => {
    const fetchOrder = async () => {
      if (!token) {
        setNotice('No se pudo validar el pedido.')
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

    fetchOrder()
  }, [orderId, token])

  useEffect(() => {
    if (!token || order?.can_print_receipt) return

    const pollId = window.setInterval(async () => {
      try {
        const response = await storeApi.getOrderSummary(orderId, token)
        setOrder(response.data)
      } catch {
        // Mantener pantalla estable aunque falle una consulta puntual.
      }
    }, 8000)

    return () => window.clearInterval(pollId)
  }, [order?.can_print_receipt, orderId, token])

  const printReceipt = () => {
    window.print()
  }

  const receiptDate = order?.electronic_receipt?.issued_at
    ? new Date(order.electronic_receipt.issued_at).toLocaleString('es-CL')
    : '-'

  return (
    <div className="app-shell">
      <PublicHeader />
      <main className="container">
        <NoticeBanner message={notice} />
        {loading ? (
          <section className="panel">Cargando resumen final...</section>
        ) : !order ? (
          <section className="panel">No se encontro el pedido.</section>
        ) : !order.can_print_receipt ? (
          <section className="panel">
            <h2>Resumen del pedido</h2>
            <p className="muted">El pago aun no ha sido aceptado por administracion.</p>
            <Link className="btn-alt" to={`/pedido/${order.id}?token=${encodeURIComponent(token)}`}>
              Volver al pedido
            </Link>
          </section>
        ) : (
          <>
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
            </section>

            <section className="panel no-print">
              <h3>Pedido aprobado</h3>
              <p className="muted">Tu pago fue aceptado y el pedido esta confirmado.</p>
              <div className="card-actions spacer-top">
                <button type="button" onClick={printReceipt}>Imprimir boleta</button>
                <a className="btn-alt" href="/">Volver al home</a>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
