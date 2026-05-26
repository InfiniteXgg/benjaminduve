import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import PreCheckoutPage from './pages/PreCheckoutPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderPage from './pages/OrderPage'
import PaymentGatewayPage from './pages/PaymentGatewayPage'
import FinalOrderSummaryPage from './pages/FinalOrderSummaryPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'

function AdminProtectedRoute({ children }) {
  const token = localStorage.getItem('admin_token')
  if (!token) return <Navigate to="/admin/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/producto/:slug" element={<ProductPage />} />
      <Route path="/carrito" element={<CartPage />} />
      <Route path="/pre-checkout" element={<PreCheckoutPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/pedido/:orderId" element={<OrderPage />} />
      <Route path="/pedido/:orderId/pasarela" element={<PaymentGatewayPage />} />
      <Route path="/pedido/:orderId/resumen-final" element={<FinalOrderSummaryPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={(
          <AdminProtectedRoute>
            <AdminDashboardPage />
          </AdminProtectedRoute>
        )}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
