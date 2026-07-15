import { api } from './client'

export const adminApi = {
  async login(payload) {
    const { data } = await api.post('/admin/login', payload)
    return data
  },

  async me() {
    const { data } = await api.get('/admin/me')
    return data
  },

  async logout() {
    const { data } = await api.post('/admin/logout')
    return data
  },

  async summary() {
    const { data } = await api.get('/admin/summary')
    return data
  },

  async listProducts(params = {}) {
    const { data } = await api.get('/admin/products', { params })
    return data
  },

  async createProduct(payload) {
    const { data } = await api.post('/admin/products', payload)
    return data
  },

  async updateProduct(productId, payload) {
    const { data } = await api.put(`/admin/products/${productId}`, payload)
    return data
  },

  async deleteProduct(productId) {
    const { data } = await api.delete(`/admin/products/${productId}`)
    return data
  },

  async deleteProductImage(productId, imageId) {
    const { data } = await api.delete(`/admin/products/${productId}/images/${imageId}`)
    return data
  },

  async listHeroSlides() {
    const { data } = await api.get('/admin/hero-slides')
    return data
  },

  async createHeroSlide(payload) {
    const { data } = await api.post('/admin/hero-slides', payload)
    return data
  },

  async updateHeroSlide(slideId, payload) {
    const { data } = await api.put(`/admin/hero-slides/${slideId}`, payload)
    return data
  },

  async deleteHeroSlide(slideId) {
    const { data } = await api.delete(`/admin/hero-slides/${slideId}`)
    return data
  },

  async listOrders(params = {}) {
    const { data } = await api.get('/admin/orders', { params })
    return data
  },

  async acceptOrder(orderId) {
    const { data } = await api.post(`/admin/orders/${orderId}/accept`)
    return data
  },

  async rejectOrder(orderId) {
    const { data } = await api.post(`/admin/orders/${orderId}/reject`)
    return data
  },

  async deleteOrder(orderId, restoreStock = false) {
    const { data } = await api.delete(`/admin/orders/${orderId}`, {
      params: { restore_stock: restoreStock ? 1 : 0 },
    })
    return data
  },
}
