import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import PublicHeader from '../components/PublicHeader'
import NoticeBanner from '../components/NoticeBanner'
import { useCart } from '../context/CartContext'
import { storeApi } from '../api/storeApi'
import { formatCurrency, readApiError, validateRut } from '../utils'

const RECEIPT_DRAFT_KEY = 'bdv_receipt_draft_v1'
const ORDER_CART_RESTORE_KEY = 'bdv_order_cart_restore_v1'

const EMPTY_DRAFT = {
  customer_name: '',
  customer_email: '',
  billing_tax_id: '',
  billing_address: '',
  billing_city: '',
  billing_contact_phone: '',
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(RECEIPT_DRAFT_KEY)
    if (!raw) return EMPTY_DRAFT
    const parsed = JSON.parse(raw)
    return { ...EMPTY_DRAFT, ...parsed }
  } catch {
    return EMPTY_DRAFT
  }
}

function sanitizeDraft(raw) {
  return {
    customer_name: (raw.customer_name || '').trim(),
    customer_email: (raw.customer_email || '').trim().toLowerCase(),
    billing_tax_id: (raw.billing_tax_id || '').trim(),
    billing_address: (raw.billing_address || '').trim(),
    billing_city: (raw.billing_city || '').trim(),
    billing_contact_phone: (raw.billing_contact_phone || '').trim(),
  }
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { items, total, clearCart } = useCart()
  const [receiptDraft, setReceiptDraft] = useState(loadDraft)
  const [notice, setNotice] = useState('')
  const [noticeTone, setNoticeTone] = useState('info')
  const [submitting, setSubmitting] = useState(false)
  const autoSubmittedRef = useRef(false)

  useEffect(() => {
    localStorage.setItem(RECEIPT_DRAFT_KEY, JSON.stringify(receiptDraft))
  }, [receiptDraft])

  const hasRequiredDraft = (
    receiptDraft.customer_name.trim() !== ''
    && receiptDraft.customer_email.trim() !== ''
    && receiptDraft.billing_tax_id.trim() !== ''
    && receiptDraft.billing_address.trim() !== ''
    && receiptDraft.billing_city.trim() !== ''
  )

  const submitOrder = async () => {
    const sanitizedDraft = sanitizeDraft(receiptDraft)

    if (items.length === 0) {
      setNoticeTone('error')
      setNotice('Tu carrito esta vacio.')
      return
    }

    if (!hasRequiredDraft) {
      setNoticeTone('error')
      setNotice('Faltan datos obligatorios para generar la boleta electronica.')
      return
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedDraft.customer_email)
    if (!emailOk) {
      setNoticeTone('error')
      setNotice('Ingresa un correo valido para continuar.')
      return
    }

    const rutResult = validateRut(sanitizedDraft.billing_tax_id)
    if (!rutResult.valid) {
      setNoticeTone('error')
      setNotice(rutResult.message)
      return
    }

    if (submitting) return

    setSubmitting(true)
    setNotice('')

    try {
      const payload = {
        customer_name: sanitizedDraft.customer_name,
        customer_email: sanitizedDraft.customer_email,
        billing_document_type: 'boleta_electronica',
        billing_tax_id: sanitizedDraft.billing_tax_id,
        billing_address: sanitizedDraft.billing_address,
        billing_city: sanitizedDraft.billing_city,
        billing_contact_phone: sanitizedDraft.billing_contact_phone || null,
        items: items.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
      }
      const response = await storeApi.createOrder(payload)
      const order = response.data
      localStorage.setItem(ORDER_CART_RESTORE_KEY, JSON.stringify(items))
      clearCart()
      localStorage.removeItem(RECEIPT_DRAFT_KEY)
      localStorage.setItem('latest_order', JSON.stringify({ id: order.id, token: order.public_token }))
      navigate(`/pedido/${order.id}?token=${encodeURIComponent(order.public_token)}`)
    } catch (error) {
      const isValidationError = Number(error?.response?.status) === 422
      setNoticeTone('error')
      setNotice(
        isValidationError
          ? 'Por favor usa el formato recomendado para cada dato.'
          : readApiError(error),
      )
    } finally {
      setSubmitting(false)
    }
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    await submitOrder()
  }

  useEffect(() => {
    const auto = searchParams.get('auto') === '1'
    if (!auto || autoSubmittedRef.current) return
    if (items.length === 0 || !hasRequiredDraft) return

    autoSubmittedRef.current = true
    setNoticeTone('info')
    setNotice('Guardando datos y avanzando...')
    void submitOrder()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, hasRequiredDraft, searchParams])

  useEffect(() => {
    if (!notice) return
    const id = setTimeout(() => setNotice(''), 2600)
    return () => clearTimeout(id)
  }, [notice])

  return (
    <div className="app-shell">
      <PublicHeader />
      <main className="container">
        <NoticeBanner message={notice} tone={noticeTone} />
        <section className="panel">
          <h2>Datos del pedido</h2>
          {items.length === 0 ? (
            <p className="muted">No hay productos para procesar.</p>
          ) : !hasRequiredDraft ? (
            <div className="stack">
              <p className="muted">Faltan datos del cliente para continuar con la compra.</p>
              <div className="card-actions">
                <Link className="btn-alt" to="/pre-checkout">Volver a completar datos</Link>
              </div>
            </div>
          ) : (
            <>
              <div className="stack">
                {items.map((item) => (
                  <div key={item.id} className="row-card">
                    <strong>{item.name} x {item.quantity}</strong>
                    <span>{formatCurrency(Number(item.price) * Number(item.quantity))}</span>
                  </div>
                ))}
              </div>
              <p className="spacer-top"><strong>Total: {formatCurrency(total)}</strong></p>

              <section className="panel spacer-top">
                <h3>Resumen de boleta electronica</h3>
                <p className="muted">Verifica estos datos antes de generar el pedido.</p>
                <div className="stack spacer-top">
                  <div className="triple">
                    <div className="stack">
                      <input
                        value={receiptDraft.customer_name}
                        onChange={(e) => setReceiptDraft((prev) => ({ ...prev, customer_name: e.target.value }))}
                        placeholder="Nombre completo"
                        required
                      />
                      <p className="muted">Formato: nombre y apellido, min. 3 caracteres.</p>
                    </div>
                    <div className="stack">
                      <input
                        type="email"
                        value={receiptDraft.customer_email}
                        onChange={(e) => setReceiptDraft((prev) => ({ ...prev, customer_email: e.target.value }))}
                        placeholder="Correo"
                        required
                      />
                      <p className="muted">Formato: correo@dominio.com</p>
                    </div>
                    <div className="stack">
                      <input
                        value={receiptDraft.billing_tax_id}
                        onChange={(e) => setReceiptDraft((prev) => ({ ...prev, billing_tax_id: e.target.value }))}
                        placeholder="RUT / Documento"
                        required
                      />
                      <p className="muted">Formato: 12345678-9 o 12.345.678-9</p>
                    </div>
                  </div>
                  <div className="triple">
                    <div className="stack">
                      <input
                        value={receiptDraft.billing_address}
                        onChange={(e) => setReceiptDraft((prev) => ({ ...prev, billing_address: e.target.value }))}
                        placeholder="Direccion"
                        required
                      />
                      <p className="muted">Formato: calle y numero, min. 6 caracteres.</p>
                    </div>
                    <div className="stack">
                      <input
                        value={receiptDraft.billing_city}
                        onChange={(e) => setReceiptDraft((prev) => ({ ...prev, billing_city: e.target.value }))}
                        placeholder="Ciudad / Comuna"
                        required
                      />
                      <p className="muted">Formato: ciudad o comuna, min. 2 caracteres.</p>
                    </div>
                    <div className="stack">
                      <input
                        value={receiptDraft.billing_contact_phone}
                        onChange={(e) => setReceiptDraft((prev) => ({ ...prev, billing_contact_phone: e.target.value }))}
                        placeholder="Telefono (opcional)"
                      />
                      <p className="muted">Formato: +56912345678 o 912345678 (opcional).</p>
                    </div>
                  </div>
                </div>
              </section>

              <form className="stack spacer-top" onSubmit={onSubmit}>
                <div className="card-actions checkout-actions">
                  <Link className="btn-alt btn-back-fixed" to="/pre-checkout">Volver</Link>
                  <button type="submit" disabled={submitting}>{submitting ? 'Procesando...' : 'Generar pedido'}</button>
                </div>
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  )
}
