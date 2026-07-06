import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PublicHeader from '../components/PublicHeader'
import NoticeBanner from '../components/NoticeBanner'
import { useCart } from '../context/CartContext'
import { formatCurrency, validateRut } from '../utils'

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
  const [fieldErrors, setFieldErrors] = useState({})

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

  const validateFields = () => {
    const nextErrors = {}
    const trimmedName = draft.customer_name.trim()
    const trimmedEmail = draft.customer_email.trim()
    const trimmedTaxId = draft.billing_tax_id.trim()
    const trimmedAddress = draft.billing_address.trim()
    const trimmedCity = draft.billing_city.trim()

    if (trimmedName.length < 3) {
      nextErrors.customer_name = 'Ingresa nombre y apellido válido.'
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.customer_email = 'Ingresa un correo válido.'
    }

    if (!trimmedTaxId) {
      nextErrors.billing_tax_id = 'Ingresa RUT o documento.'
    } else {
      const result = validateRut(trimmedTaxId)
      if (!result.valid) {
        nextErrors.billing_tax_id = result.message || 'El RUT ingresado no es válido.'
      }
    }

    if (trimmedAddress.length < 6) {
      nextErrors.billing_address = 'Ingresa dirección válida.'
    }

    if (trimmedCity.length < 2) {
      nextErrors.billing_city = 'Ingresa ciudad o comuna válida.'
    }

    setFieldErrors(nextErrors)
    return nextErrors
  }

  const continuePurchase = () => {
    if (items.length === 0) {
      setNoticeTone('error')
      setNotice('Tu carrito esta vacio.')
      return
    }

    const errors = validateFields()
    if (Object.keys(errors).length > 0) {
      setNoticeTone('error')
      setNotice('Corrige los campos marcados en rojo para continuar.')
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
                        className={fieldErrors.customer_name ? 'is-invalid' : undefined}
                        value={draft.customer_name}
                        onChange={(e) => {
                          setDraft((prev) => ({ ...prev, customer_name: e.target.value }))
                          setFieldErrors((current) => {
                            const next = { ...current }
                            delete next.customer_name
                            return next
                          })
                        }}
                        placeholder="Nombre completo"
                        aria-invalid={Boolean(fieldErrors.customer_name)}
                      />
                      <p className="muted">Formato: nombre y apellido, min. 3 caracteres.</p>
                      {fieldErrors.customer_name && <p className="field-error">{fieldErrors.customer_name}</p>}
                    </div>
                    <div className="stack">
                      <input
                        className={fieldErrors.customer_email ? 'is-invalid' : undefined}
                        type="email"
                        value={draft.customer_email}
                        onChange={(e) => {
                          setDraft((prev) => ({ ...prev, customer_email: e.target.value }))
                          setFieldErrors((current) => {
                            const next = { ...current }
                            delete next.customer_email
                            return next
                          })
                        }}
                        placeholder="Correo"
                        aria-invalid={Boolean(fieldErrors.customer_email)}
                      />
                      <p className="muted">Formato: correo@dominio.com</p>
                      {fieldErrors.customer_email && <p className="field-error">{fieldErrors.customer_email}</p>}
                    </div>
                    <div className="stack">
                      <input
                        className={fieldErrors.billing_tax_id ? 'is-invalid' : undefined}
                        value={draft.billing_tax_id}
                        onChange={(e) => {
                          setDraft((prev) => ({ ...prev, billing_tax_id: e.target.value }))
                          setFieldErrors((current) => {
                            const next = { ...current }
                            delete next.billing_tax_id
                            return next
                          })
                        }}
                        onBlur={() => validateFields()}
                        placeholder="RUT / Documento"
                        aria-invalid={Boolean(fieldErrors.billing_tax_id)}
                      />
                      <p className="muted">Formato: 12345678-9 o 12.345.678-9</p>
                      {fieldErrors.billing_tax_id && <p className="field-error">{fieldErrors.billing_tax_id}</p>}
                    </div>
                  </div>
                  <div className="triple">
                    <div className="stack">
                      <input
                        className={fieldErrors.billing_address ? 'is-invalid' : undefined}
                        value={draft.billing_address}
                        onChange={(e) => {
                          setDraft((prev) => ({ ...prev, billing_address: e.target.value }))
                          setFieldErrors((current) => {
                            const next = { ...current }
                            delete next.billing_address
                            return next
                          })
                        }}
                        onBlur={() => validateFields()}
                        placeholder="Direccion"
                        aria-invalid={Boolean(fieldErrors.billing_address)}
                      />
                      <p className="muted">Formato: calle y numero, min. 6 caracteres.</p>
                      {fieldErrors.billing_address && <p className="field-error">{fieldErrors.billing_address}</p>}
                    </div>
                    <div className="stack">
                      <input
                        className={fieldErrors.billing_city ? 'is-invalid' : undefined}
                        value={draft.billing_city}
                        onChange={(e) => {
                          setDraft((prev) => ({ ...prev, billing_city: e.target.value }))
                          setFieldErrors((current) => {
                            const next = { ...current }
                            delete next.billing_city
                            return next
                          })
                        }}
                        onBlur={() => validateFields()}
                        placeholder="Ciudad / Comuna"
                        aria-invalid={Boolean(fieldErrors.billing_city)}
                      />
                      <p className="muted">Formato: ciudad o comuna, min. 2 caracteres.</p>
                      {fieldErrors.billing_city && <p className="field-error">{fieldErrors.billing_city}</p>}
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
