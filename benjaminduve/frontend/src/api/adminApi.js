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

  async updateProduct(productSlug, payload) {
    const { data } = await api.put(`/admin/products/${productSlug}`, payload)
    return data
  },

  async deleteProduct(productSlug) {
    const { data } = await api.delete(`/admin/products/${productSlug}`)
    return data
  },

  async deleteProductImage(productSlug, imageId) {
    const { data } = await api.delete(`/admin/products/${productSlug}/images/${imageId}`)
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
}

