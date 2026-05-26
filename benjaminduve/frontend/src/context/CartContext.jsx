import { createContext, useContext, useMemo, useState } from 'react'

const CART_KEY = 'bdv_cart_v1'

const CartContext = createContext(null)

const loadInitialCart = () => {
  try {
    const raw = localStorage.getItem(CART_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadInitialCart)

  const persist = (next) => {
    setItems(next)
    localStorage.setItem(CART_KEY, JSON.stringify(next))
  }

  const addItem = (product, quantity = 1) => {
    const qty = Math.max(1, Number(quantity) || 1)
    const existing = items.find((item) => item.id === product.id)

    const stock = Number(product.stock || 0)
    if (qty > stock) {
      return { ok: false, message: `Stock insuficiente. Solo hay ${stock} unidad(es).` }
    }

    if (!existing) {
      const next = [...items, { ...product, quantity: qty }]
      persist(next)
      return { ok: true, message: 'Producto agregado al carrito.' }
    }

    const nextQty = existing.quantity + qty
    if (nextQty > stock) {
      return { ok: false, message: `Stock insuficiente. Solo hay ${stock} unidad(es).` }
    }

    const next = items.map((item) =>
      item.id === product.id ? { ...item, quantity: nextQty } : item,
    )
    persist(next)
    return { ok: true, message: 'Cantidad actualizada en carrito.' }
  }

  const updateItemQuantity = (productId, quantity) => {
    const qty = Math.max(1, Number(quantity) || 1)
    const product = items.find((item) => item.id === productId)
    if (!product) return { ok: false, message: 'Producto no encontrado en carrito.' }

    if (qty > Number(product.stock || 0)) {
      return {
        ok: false,
        message: `Stock insuficiente. Solo hay ${product.stock} unidad(es).`,
      }
    }

    const next = items.map((item) => (item.id === productId ? { ...item, quantity: qty } : item))
    persist(next)
    return { ok: true, message: 'Carrito actualizado.' }
  }

  const removeItem = (productId) => {
    const next = items.filter((item) => item.id !== productId)
    persist(next)
  }

  const clearCart = () => persist([])

  const restoreCart = (rawItems) => {
    if (!Array.isArray(rawItems)) {
      persist([])
      return
    }

    const sanitized = rawItems
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        ...item,
        quantity: Math.max(1, Number(item.quantity) || 1),
      }))

    persist(sanitized)
  }

  const totals = useMemo(() => {
    const distinct = items.length
    const total = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0)
    return { distinct, total }
  }, [items])

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateItemQuantity,
        removeItem,
        clearCart,
        restoreCart,
        distinctCount: totals.distinct,
        total: totals.total,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart debe usarse dentro de CartProvider')
  }
  return context
}
