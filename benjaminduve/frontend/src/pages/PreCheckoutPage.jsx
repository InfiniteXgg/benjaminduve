import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PublicHeader from '../components/PublicHeader'
import NoticeBanner from '../components/NoticeBanner'
import { useCart } from '../context/CartContext'
import { formatCurrency } from '../utils'

const RECEIPT_DRAFT_KEY = 'bdv_receipt_draft_v1'

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

export default function PreCheckoutPage() {
  const navigate = useNavigate()
  const { items, total } = useCart()
  const [draft, setDraft] = useState(loadDraft)
  const [notice, setNotice] = useState('')
  const [noticeTone, setNoticeTone] = useState('info')

  useEffect(() => {
    localStorage.setItem(RECEIPT_DRAFT_KEY, JSON.stringify(draft))
  }, [draft])

  useEffect(() => {
    if (!notice) return
    const id = setTimeout(() => setNotice(''), 2600)
    return () => clearTimeout(id)
  }, [notice])

  const requiredDraftOk = useMemo(() => {
    return (
      draft.customer_name.trim() !== ''
      && draft.customer_email.trim() !== ''
      && draft.billing_tax_id.trim() !== ''
      && draft.billing_address.trim() !== ''
      && draft.billing_city.trim() !== ''
    )
  }, [draft])

  const continuePurchase = () => {
    if (items.length === 0) {
      setNoticeTone('error')
      setNotice('Tu carrito esta vacio.')
      return
    }

    if (!requiredDraftOk) {
      setNoticeTone('error')
      setNotice('Completa los datos obligatorios para continuar.')
      return
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.customer_email.trim())
    if (!emailOk) {
      setNoticeTone('error')
      setNotice('Ingresa un correo valido para continuar.')
      return
    }

    const taxIdOk = /^[0-9kK.-]{7,40}$/.test(draft.billing_tax_id.trim())
    if (!taxIdOk) {
      setNoticeTone('error')
      setNotice('El RUT/Documento no tiene un formato valido.')
      return
    }

    navigate('/checkout?auto=1')
  }

  return (
    <div className="app-shell">
      <PublicHeader />
      <main className="container">
        <NoticeBanner message={notice} tone={noticeTone} />
        <section className="panel">
          <h2>Datos del pedido</h2>
          <p className="muted">Completa el formulario y revisa el resumen antes de pasar a la compra.</p>

          {items.length === 0 ? (
            <p className="muted spacer-top">No hay productos en el carrito.</p>
          ) : (
            <>
              <div className="stack spacer-top">
                {items.map((item) => (
                  <div key={item.id} className="row-card">
                    <strong>{item.name} x {item.quantity}</strong>
                    <span>{formatCurrency(Number(item.price) * Number(item.quantity))}</span>
                  </div>
                ))}
              </div>
              <p className="spacer-top"><strong>Total: {formatCurrency(total)}</strong></p>

              <section className="panel spacer-top">
                <h3>Formulario de boleta electronica</h3>
                <p className="muted">Completa los datos siguiendo el formato indicado en cada campo.</p>
                <div className="stack spacer-top">
                  <div className="triple">
                    <div className="stack">
                      <input
                        value={draft.customer_name}
                        onChange={(e) => setDraft((prev) => ({ ...prev, customer_name: e.target.value }))}
                        placeholder="Nombre completo"
                      />
                      <p className="muted">Formato: nombre y apellido, min. 3 caracteres.</p>
                    </div>
                    <div className="stack">
                      <input
                        type="email"
                        value={draft.customer_email}
                        onChange={(e) => setDraft((prev) => ({ ...prev, customer_email: e.target.value }))}
                        placeholder="Correo"
                      />
                      <p className="muted">Formato: correo@dominio.com</p>
                    </div>
                    <div className="stack">
                      <input
                        value={draft.billing_tax_id}
                        onChange={(e) => setDraft((prev) => ({ ...prev, billing_tax_id: e.target.value }))}
                        placeholder="RUT / Documento"
                      />
                      <p className="muted">Formato: 12345678-9 o 12.345.678-9</p>
                    </div>
                  </div>
                  <div className="triple">
                    <div className="stack">
                      <input
                        value={draft.billing_address}
                        onChange={(e) => setDraft((prev) => ({ ...prev, billing_address: e.target.value }))}
                        placeholder="Direccion"
                      />
                      <p className="muted">Formato: calle y numero, min. 6 caracteres.</p>
                    </div>
                    <div className="stack">
                      <input
                        value={draft.billing_city}
                        onChange={(e) => setDraft((prev) => ({ ...prev, billing_city: e.target.value }))}
                        placeholder="Ciudad / Comuna"
                      />
                      <p className="muted">Formato: ciudad o comuna, min. 2 caracteres.</p>
                    </div>
                    <div className="stack">
                      <input
                        value={draft.billing_contact_phone}
                        onChange={(e) => setDraft((prev) => ({ ...prev, billing_contact_phone: e.target.value }))}
                        placeholder="Telefono (opcional)"
                      />
                      <p className="muted">Formato: +56912345678 o 912345678 (opcional).</p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          <div className="card-actions spacer-top">
            <Link className="btn-alt btn-back-fixed" to="/carrito">Volver</Link>
            <button type="button" onClick={continuePurchase}>Guardar datos y continuar</button>
          </div>
        </section>
      </main>
    </div>
  )
}
