import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../api/adminApi'
import BrandLogo from '../components/BrandLogo'
import NoticeBanner from '../components/NoticeBanner'
import { readApiError } from '../utils'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setNotice('')
    try {
      const response = await adminApi.login({ email, password })
      localStorage.setItem('admin_token', response.token)
      localStorage.setItem('admin_user', JSON.stringify(response.user))
      navigate('/admin')
    } catch (error) {
      setNotice(readApiError(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="container login-screen">
      <section className="panel login-card">
        <div className="brand-center">
          <BrandLogo />
        </div>
        <h2>Acceso administrador</h2>
        <NoticeBanner message={notice} />
        <form className="stack" onSubmit={onSubmit}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Clave" required />
          <button type="submit" disabled={busy}>{busy ? 'Ingresando...' : 'Ingresar'}</button>
        </form>
      </section>
    </main>
  )
}
