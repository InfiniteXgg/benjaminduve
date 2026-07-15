import { api } from './client'

export const storeApi = {
  async listProducts(params = {}) {
    const { data } = await api.get('/products', { params })
    return data
  },

  async getProduct(slug) {
    const { data } = await api.get(`/products/${slug}`)
    return data
  },

  async listHeroSlides() {
    const { data } = await api.get('/hero-slides')
    return data
  },

  async createOrder(payload) {
    const { data } = await api.post('/orders', payload)
    return data
  },

  async getOrderSummary(orderId, orderToken) {
    const { data } = await api.get(`/orders/${orderId}/summary`, {
      params: { order_token: orderToken },
    })
    return data
  },

  async submitPayment(orderId, payload) {
    const { data } = await api.post(`/orders/${orderId}/payment`, payload)
    return data
  },

  async cancelOrder(orderId, payload) {
    const { data } = await api.post(`/orders/${orderId}/cancel`, payload)
    return data
  },
}
