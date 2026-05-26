import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import PublicHeader from '../components/PublicHeader'
import NoticeBanner from '../components/NoticeBanner'
import { storeApi } from '../api/storeApi'
import { readApiError } from '../utils'

const ORDER_NOTICE_KEY = 'bdv_order_notice'

export default function PaymentGatewayPage() {
  const navigate = useNavigate()
  const { orderId } = useParams()
  const [params] = useSearchParams()
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(true)
  const hasSubmittedRef = useRef(false)

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

  const submitToGateway = async () => {
    if (!token) {
      setNotice('No se encontro el token del pedido para continuar con el pago.')
      setBusy(false)
      return
    }

    try {
      await storeApi.submitPayment(orderId, {
        order_token: token,
        payment_method: 'gateway_pending',
      })
      localStorage.setItem(ORDER_NOTICE_KEY, 'Tu pedido esta en espera de aprobacion del administrador.')
      navigate(`/pedido/${orderId}?token=${encodeURIComponent(token)}`)
    } catch (error) {
      setNotice(readApiError(error))
      setBusy(false)
    }
  }

  useEffect(() => {
    if (hasSubmittedRef.current) return
    hasSubmittedRef.current = true

    void submitToGateway()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, token])

  useEffect(() => {
    if (!notice) return
    const id = setTimeout(() => setNotice(''), 2600)
    return () => clearTimeout(id)
  }, [notice])

  return (
    <div className="app-shell">
      <PublicHeader />
      <main className="container">
        <NoticeBanner message={notice} />
        <section className="panel">
          <h2>Pasarela de pago</h2>
          <p className="muted">Placeholder temporal para integrar la API de pago real.</p>
          <div className="stack spacer-top">
            <div className="row-card">
              <span>Pedido</span>
              <strong>#{orderId}</strong>
            </div>
            <div className="row-card">
              <span>Estado</span>
              <strong>{busy ? 'Enviando pago...' : 'No fue posible enviar el pago'}</strong>
            </div>
          </div>
          {!busy && (
            <div className="card-actions spacer-top">
              <Link className="btn-alt" to={`/pedido/${orderId}?token=${encodeURIComponent(token)}`}>
                Volver al pedido
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
