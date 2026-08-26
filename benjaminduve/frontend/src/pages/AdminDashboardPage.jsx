import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminHeader from '../components/AdminHeader'
import NoticeBanner from '../components/NoticeBanner'
import { adminApi } from '../api/adminApi'
import { formatCurrency, readApiError } from '../utils'

const EMPTY_PRODUCT = {
  name: '',
  slug: '',
  description: '',
  size: '',
  height_cm: '',
  width_cm: '',
  depth_cm: '',
  price: '',
  stock: '',
  is_active: true,
  mainImage: '',
  images: [],
}

const EMPTY_HERO_SLIDE = {
  eyebrow: '',
  title: '',
  cta: 'Ver catalogo',
  image: '',
  image_width: null,
  image_height: null,
  crop_focus_x: 0.5,
  crop_focus_y: 0.5,
  crop_zoom: 1,
  product_id: '',
  sort_order: 0,
  is_active: true,
}

const EMPTY_ACCOUNT_FORM = {
  email: '',
  current_password: '',
  password: '',
  password_confirmation: '',
}

const HERO_CROP_WIDTH = 1600
const HERO_CROP_HEIGHT = 900

function normalizeProductImages(images = [], productName = 'Producto') {
  return images
    .filter((image) => image?.url)
    .slice(0, 8)
    .map((image, index) => ({
      url: image.url,
      alt: image.alt || `${productName || 'Producto'} foto ${index + 1}`,
    }))
}

function compressImageFile(file, maxSize = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const image = new Image()
      image.onload = () => {
        const attempts = [
          { maxSize, quality },
          { maxSize: 760, quality: 0.68 },
          { maxSize: 620, quality: 0.64 },
          { maxSize: 520, quality: 0.6 },
        ]

        for (const attempt of attempts) {
          const scale = Math.min(1, attempt.maxSize / Math.max(image.width, image.height))
          const canvas = document.createElement('canvas')
          canvas.width = Math.max(1, Math.round(image.width * scale))
          canvas.height = Math.max(1, Math.round(image.height * scale))
          const context = canvas.getContext('2d')

          if (!context) {
            reject(new Error('No se pudo procesar la imagen.'))
            return
          }

          context.drawImage(image, 0, 0, canvas.width, canvas.height)
          const dataUrl = canvas.toDataURL('image/jpeg', attempt.quality)
          if (dataUrl.length <= 480000 || attempt === attempts[attempts.length - 1]) {
            resolve(dataUrl)
            return
          }
        }
      }
      image.onerror = () => reject(new Error('No se pudo procesar una imagen.'))
      image.src = String(reader.result || '')
    }
    reader.onerror = () => reject(new Error('No se pudo leer una imagen.'))
    reader.readAsDataURL(file)
  })
}

function readCropImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Selecciona una imagen valida.'))
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const image = new Image()
      image.onload = () => {
        const attempts = [
          { maxSize: 2200, quality: 0.86 },
          { maxSize: 1800, quality: 0.8 },
          { maxSize: 1500, quality: 0.74 },
          { maxSize: 1200, quality: 0.68 },
        ]

        for (const attempt of attempts) {
          const scale = Math.min(1, attempt.maxSize / Math.max(image.width, image.height))
          const canvas = document.createElement('canvas')
          canvas.width = Math.max(1, Math.round(image.width * scale))
          canvas.height = Math.max(1, Math.round(image.height * scale))
          const context = canvas.getContext('2d')

          if (!context) {
            reject(new Error('No se pudo procesar la imagen.'))
            return
          }

          context.drawImage(image, 0, 0, canvas.width, canvas.height)
          const source = canvas.toDataURL('image/jpeg', attempt.quality)

          if (source.length <= 2200000 || attempt === attempts[attempts.length - 1]) {
            resolve({
              source,
              imageWidth: canvas.width,
              imageHeight: canvas.height,
            })
            return
          }
        }
      }
      image.onerror = () => reject(new Error('No se pudo procesar una imagen.'))
      image.src = String(reader.result || '')
    }
    reader.onerror = () => reject(new Error('No se pudo leer una imagen.'))
    reader.readAsDataURL(file)
  })
}

function readCropSource(source) {
  return new Promise((resolve, reject) => {
    if (!source) {
      reject(new Error('No hay una imagen para recortar.'))
      return
    }

    const image = new Image()
    image.onload = () => {
      resolve({
        source,
        imageWidth: image.naturalWidth || image.width,
        imageHeight: image.naturalHeight || image.height,
      })
    }
    image.onerror = () => reject(new Error('No se pudo procesar una imagen.'))
    image.src = source
  })
}

function cropBounds(imageWidth, imageHeight, zoom) {
  const scale = Math.max(HERO_CROP_WIDTH / imageWidth, HERO_CROP_HEIGHT / imageHeight) * zoom
  const scaledWidth = imageWidth * scale
  const scaledHeight = imageHeight * scale
  const minFocusX = Math.min(0.5, HERO_CROP_WIDTH / 2 / scaledWidth)
  const minFocusY = Math.min(0.5, HERO_CROP_HEIGHT / 2 / scaledHeight)

  return {
    scale,
    scaledWidth,
    scaledHeight,
    widthPercent: (scaledWidth / HERO_CROP_WIDTH) * 100,
    heightPercent: (scaledHeight / HERO_CROP_HEIGHT) * 100,
    minFocusX,
    maxFocusX: 1 - minFocusX,
    minFocusY,
    maxFocusY: 1 - minFocusY,
  }
}

function cropSelection(crop) {
  const bounds = cropBounds(crop.imageWidth, crop.imageHeight, crop.zoom)
  const width = HERO_CROP_WIDTH / bounds.scale
  const height = HERO_CROP_HEIGHT / bounds.scale
  const left = clamp((crop.focusX * crop.imageWidth) - (width / 2), 0, crop.imageWidth - width)
  const top = clamp((crop.focusY * crop.imageHeight) - (height / 2), 0, crop.imageHeight - height)

  return {
    left: `${(left / crop.imageWidth) * 100}%`,
    top: `${(top / crop.imageHeight) * 100}%`,
    width: `${(width / crop.imageWidth) * 100}%`,
    height: `${(height / crop.imageHeight) * 100}%`,
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function clampHeroCrop(crop) {
  const bounds = cropBounds(crop.imageWidth, crop.imageHeight, crop.zoom)

  return {
    ...crop,
    focusX: clamp(crop.focusX, bounds.minFocusX, bounds.maxFocusX),
    focusY: clamp(crop.focusY, bounds.minFocusY, bounds.maxFocusY),
  }
}

async function readImageFiles(files, productName = 'Producto') {
  const selectedFiles = Array.from(files || []).filter((file) => file.type.startsWith('image/')).slice(0, 8)

  const images = await Promise.all(
    selectedFiles.map(async (file, index) => ({
      url: await compressImageFile(file),
      alt: `${productName || 'Producto'} foto ${index + 1}`,
    })),
  )

  const tooLarge = images.some((image) => image.url.length > 480000)
  if (tooLarge) {
    throw new Error('Una imagen sigue siendo demasiado pesada. Prueba con una foto mas liviana.')
  }

  return images
}

function AdminField({ label, children }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

const heroSlidePayload = (slide) => ({
  eyebrow: slide.eyebrow,
  title: slide.title,
  cta: slide.cta,
  image: slide.image,
  image_width: slide.image_width ? Number(slide.image_width) : null,
  image_height: slide.image_height ? Number(slide.image_height) : null,
  crop_focus_x: Number(slide.crop_focus_x ?? 0.5),
  crop_focus_y: Number(slide.crop_focus_y ?? 0.5),
  crop_zoom: Number(slide.crop_zoom ?? 1),
  product_id: slide.product_id ? Number(slide.product_id) : null,
  sort_order: Number(slide.sort_order || 0),
  is_active: Boolean(slide.is_active),
})

function serializeHeroSlide(slide) {
  return JSON.stringify(heroSlidePayload(slide))
}

function heroImageStyle(slide) {
  if (!slide.image_width || !slide.image_height) return null

  const bounds = cropBounds(
    Number(slide.image_width),
    Number(slide.image_height),
    Number(slide.crop_zoom ?? 1),
  )
  const focusX = Number(slide.crop_focus_x ?? 0.5)
  const focusY = Number(slide.crop_focus_y ?? 0.5)

  return {
    width: `${bounds.widthPercent}%`,
    height: `${bounds.heightPercent}%`,
    left: `${50 - (focusX * bounds.widthPercent)}%`,
    top: `${50 - (focusY * bounds.heightPercent)}%`,
  }
}

function centerHeroSlideEditor(slideId) {
  window.requestAnimationFrame(() => {
    const node = document.querySelector(`[data-hero-slide-id="${slideId}"]`)
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

function storedAdminUser() {
  try {
    return JSON.parse(localStorage.getItem('admin_user') || '{}')
  } catch {
    return {}
  }
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('products')
  const [notice, setNotice] = useState('')
  const [noticeTone, setNoticeTone] = useState('info')
  const [showAccountSettings, setShowAccountSettings] = useState(false)
  const [accountForm, setAccountForm] = useState(() => ({
    ...EMPTY_ACCOUNT_FORM,
    email: storedAdminUser().email || '',
  }))
  const [accountBusy, setAccountBusy] = useState(false)
  const [summary, setSummary] = useState({
    product_count: 0,
    active_product_count: 0,
    order_count: 0,
    low_stock_threshold: 5,
    low_stock_count: 0,
    low_stock_products: [],
  })

  const [products, setProducts] = useState([])
  const [productMeta, setProductMeta] = useState({})
  const [productQ, setProductQ] = useState('')
  const [productPage, setProductPage] = useState(1)
  const [newProduct, setNewProduct] = useState(EMPTY_PRODUCT)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [removingProductSlug, setRemovingProductSlug] = useState('')
  const [expandedProductId, setExpandedProductId] = useState(null)

  const [dragging, setDragging] = useState(null) // { productId, index, isNew }

  const [heroSlides, setHeroSlides] = useState([])
  const [heroSlideBaselines, setHeroSlideBaselines] = useState({})
  const [newHeroSlide, setNewHeroSlide] = useState(EMPTY_HERO_SLIDE)
  const [removingHeroSlideId, setRemovingHeroSlideId] = useState('')
  const [heroCropper, setHeroCropper] = useState(null)
  const [heroProductOptions, setHeroProductOptions] = useState([])
  const heroCropDragRef = useRef(null)

  const [orders, setOrders] = useState([])
  const [orderMeta, setOrderMeta] = useState({})
  const [orderQ, setOrderQ] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [orderPage, setOrderPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [removingOrderId, setRemovingOrderId] = useState('')

  const token = localStorage.getItem('admin_token')

  const showNotice = (message, tone = 'info') => {
    setNotice(message)
    setNoticeTone(tone)
  }

  const ensureAuth = async () => {
    if (!token) {
      navigate('/admin/login')
      return false
    }
    try {
      await adminApi.me()
      return true
    } catch {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      navigate('/admin/login')
      return false
    }
  }

  const loadSummary = async () => {
    const response = await adminApi.summary()
    setSummary(response)
  }

  const loadProducts = async (options = {}) => {
    const q = options.q ?? productQ
    const page = options.page ?? productPage
    const response = await adminApi.listProducts({ q, page })
    setProducts(response.data || [])
    setProductMeta(response.meta || {})
  }

  const loadOrders = async (options = {}) => {
    const q = options.q ?? orderQ
    const dateFromValue = options.dateFrom ?? dateFrom
    const dateToValue = options.dateTo ?? dateTo
    const page = options.page ?? orderPage
    const response = await adminApi.listOrders({
      q,
      date_from: dateFromValue,
      date_to: dateToValue,
      page,
    })
    setOrders(response.data || [])
    setOrderMeta(response.meta || {})
  }

  const loadHeroSlides = async () => {
    const response = await adminApi.listHeroSlides()
    const slides = response.data || []
    setHeroSlides(slides)
    setHeroSlideBaselines(Object.fromEntries(slides.map((slide) => [slide.id, serializeHeroSlide(slide)])))
  }

  const loadHeroProductOptions = async () => {
    const response = await adminApi.listProducts({ per_page: 100 })
    setHeroProductOptions(response.data || [])
  }

  const addImagesToProduct = async (productId, files) => {
    try {
      const product = products.find((item) => item.id === productId)
      const newImages = await readImageFiles(files, product?.name || 'Producto')
      setProducts((prev) => prev.map((item) => {
        if (item.id !== productId) return item
        const imagesList = [...(item.images || []), ...newImages].slice(0, 8)
        const mainImage = item.mainImage || imagesList[0]?.url || ''
        return { ...item, images: imagesList, mainImage }
      }))
    } catch (error) {
      showNotice(error.message, 'error')
    }
  }

  const addImagesToNewProduct = async (files) => {
    try {
      const newImages = await readImageFiles(files, newProduct.name || 'Producto')
      setNewProduct((prev) => {
        const imagesList = [...(prev.images || []), ...newImages].slice(0, 8)
        const mainImage = prev.mainImage || imagesList[0]?.url || ''
        return { ...prev, images: imagesList, mainImage }
      })
    } catch (error) {
      showNotice(error.message, 'error')
    }
  }

  const openHeroCropper = async (slideId, files) => {
    try {
      const [file] = Array.from(files || [])
      if (!file) return
      const image = await readCropImage(file)

      setHeroCropper({
        targetId: slideId,
        source: image.source,
        imageWidth: image.imageWidth,
        imageHeight: image.imageHeight,
        originalSource: image.source,
        originalWidth: image.imageWidth,
        originalHeight: image.imageHeight,
        zoom: 1,
        focusX: 0.5,
        focusY: 0.5,
        isDragging: false,
      })
    } catch (error) {
      showNotice(error.message, 'error')
    }
  }

  const reopenHeroCropper = async (slideId, slide) => {
    try {
      const source = slide.image
      const image = slide.image_width && slide.image_height
        ? {
            source,
            imageWidth: slide.image_width,
            imageHeight: slide.image_height,
          }
        : await readCropSource(source)

      if (!image.source || !image.imageWidth || !image.imageHeight) {
        showNotice('No se pudo reabrir la imagen para recortar.', 'error')
        return
      }

      setHeroCropper({
        targetId: slideId,
        source: image.source,
        imageWidth: image.imageWidth,
        imageHeight: image.imageHeight,
        zoom: 1,
        focusX: Number(slide.crop_focus_x ?? 0.5),
        focusY: Number(slide.crop_focus_y ?? 0.5),
        isDragging: false,
      })
    } catch (error) {
      showNotice(error.message, 'error')
    }
  }

  const updateHeroCropper = (updates) => {
    setHeroCropper((current) => {
      if (!current) return current
      return clampHeroCrop({ ...current, ...updates })
    })
  }

  const onHeroCropPointerDown = (event) => {
    if (!heroCropper) return
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    heroCropDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      focusX: heroCropper.focusX,
      focusY: heroCropper.focusY,
      zoom: heroCropper.zoom,
      imageWidth: heroCropper.imageWidth,
      imageHeight: heroCropper.imageHeight,
    }
    setHeroCropper((current) => current ? { ...current, isDragging: true } : current)
  }

  const onHeroCropPointerMove = (event) => {
    const drag = heroCropDragRef.current
    if (!drag) return
    event.preventDefault()
    const frame = event.currentTarget.getBoundingClientRect()
    const bounds = cropBounds(drag.imageWidth, drag.imageHeight, drag.zoom)
    const horizontalRange = bounds.maxFocusX - bounds.minFocusX
    const verticalRange = bounds.maxFocusY - bounds.minFocusY
    const deltaX = (event.clientX - drag.startX) / frame.width
    const deltaY = (event.clientY - drag.startY) / frame.height
    const nextFocusX = drag.focusX - (deltaX * horizontalRange)
    const nextFocusY = drag.focusY - (deltaY * verticalRange)

    updateHeroCropper({ focusX: nextFocusX, focusY: nextFocusY })
  }

  const onHeroCropPointerUp = (event) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    heroCropDragRef.current = null
    setHeroCropper((current) => current ? { ...current, isDragging: false } : current)
  }

  const applyHeroCrop = async () => {
    if (!heroCropper) return

    try {
      const targetId = heroCropper.targetId
      const crop = clampHeroCrop(heroCropper)
      const cropData = {
        image: crop.source,
        image_width: crop.imageWidth,
        image_height: crop.imageHeight,
        crop_focus_x: crop.focusX,
        crop_focus_y: crop.focusY,
        crop_zoom: crop.zoom,
      }

      if (heroCropper.targetId === 'new') {
        setNewHeroSlide((prev) => ({
          ...prev,
          ...cropData,
        }))
      } else {
        setHeroSlides((prev) => prev.map((slide) => (
          slide.id === heroCropper.targetId
            ? {
                ...slide,
                ...cropData,
              }
            : slide
        )))
      }

      setHeroCropper(null)
      centerHeroSlideEditor(targetId)
    } catch (error) {
      showNotice(error.message, 'error')
    }
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const allowed = await ensureAuth()
      if (!allowed || !mounted) return
      try {
        await Promise.all([loadSummary(), loadProducts(), loadOrders(), loadHeroSlides(), loadHeroProductOptions()])
      } catch (error) {
        if (mounted) showNotice(readApiError(error), 'error')
      }
    })()
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!notice) return
    const id = setTimeout(() => setNotice(''), 2600)
    return () => clearTimeout(id)
  }, [notice])

  // Live-search for products while typing (debounced)
  useEffect(() => {
    const id = setTimeout(() => {
      setProductPage(1)
      loadProducts({ q: productQ, page: 1 }).catch(() => {})
    }, 300)

    return () => clearTimeout(id)
  }, [productQ])

  useEffect(() => {
    const pollId = window.setInterval(async () => {
      try {
        await loadSummary()
        await loadOrders({ q: orderQ, dateFrom, dateTo, page: orderPage })
      } catch {
        // Mantener dashboard estable aunque falle un ciclo puntual.
      }
    }, 2500)

    return () => window.clearInterval(pollId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderQ, dateFrom, dateTo, orderPage])

  useEffect(() => {
    if (!showCreateModal) return

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowCreateModal(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [showCreateModal])

  const onUpdateAccount = async (event) => {
    event.preventDefault()

    if (accountForm.password && accountForm.password !== accountForm.password_confirmation) {
      showNotice('La confirmacion de contrasena no coincide.', 'error')
      return
    }

    setAccountBusy(true)
    try {
      const payload = {
        email: accountForm.email.trim(),
        current_password: accountForm.current_password,
        password: accountForm.password || null,
        password_confirmation: accountForm.password_confirmation || null,
      }
      const response = await adminApi.updateAccount(payload)
      if (response.user) {
        localStorage.setItem('admin_user', JSON.stringify(response.user))
        setAccountForm({
          ...EMPTY_ACCOUNT_FORM,
          email: response.user.email || '',
        })
      }
      setShowAccountSettings(false)
      showNotice(response.message || 'Cuenta actualizada correctamente.')
    } catch (error) {
      showNotice(readApiError(error), 'error')
    } finally {
      setAccountBusy(false)
    }
  }

  const onLogout = async () => {
    try {
      await adminApi.logout()
    } catch {
      // no-op
    } finally {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      navigate('/admin/login')
    }
  }

  const onCreateProduct = async (event) => {
    event.preventDefault()
    try {
      const images = normalizeProductImages(newProduct.images, newProduct.name)
      const payload = {
        ...newProduct,
        price: Number(newProduct.price || 0),
        stock: Number(newProduct.stock || 0),
        is_active: Boolean(newProduct.is_active),
        height_cm: newProduct.height_cm === '' ? null : Number(newProduct.height_cm),
        width_cm: newProduct.width_cm === '' ? null : Number(newProduct.width_cm),
        depth_cm: newProduct.depth_cm === '' ? null : Number(newProduct.depth_cm),
        images,
        mainImage: images[0]?.url || '',
      }
      const response = await adminApi.createProduct(payload)
      showNotice(response.message || 'Producto creado correctamente.')
      setNewProduct(EMPTY_PRODUCT)
      setShowCreateModal(false)
      await Promise.all([loadProducts({ page: 1 }), loadSummary()])
      setProductPage(1)
    } catch (error) {
      showNotice(readApiError(error), 'error')
    }
  }

  const onUpdateProduct = async (product) => {
    try {
      const images = normalizeProductImages(product.images, product.name)
      const payload = {
        name: product.name,
        slug: product.slug,
        description: product.description,
        size: product.size,
        height_cm: product.height_cm === '' ? null : product.height_cm,
        width_cm: product.width_cm === '' ? null : product.width_cm,
        depth_cm: product.depth_cm === '' ? null : product.depth_cm,
        price: Number(product.price || 0),
        stock: Number(product.stock || 0),
        is_active: Boolean(product.is_active),
        images,
        mainImage: images[0]?.url || '',
      }
      const response = await adminApi.updateProduct(product.id, payload)
      showNotice(response.message)
      await Promise.all([loadProducts(), loadSummary()])
    } catch (error) {
      showNotice(readApiError(error), 'error')
    }
  }

  const onCreateHeroSlide = async (event) => {
    event.preventDefault()
    try {
      const payload = heroSlidePayload({
        ...newHeroSlide,
        sort_order: newHeroSlide.sort_order || heroSlides.length,
      })
      const response = await adminApi.createHeroSlide(payload)
      showNotice(response.message || 'Slide creado correctamente.')
      setNewHeroSlide({ ...EMPTY_HERO_SLIDE, sort_order: heroSlides.length + 1 })
      await loadHeroSlides()
    } catch (error) {
      showNotice(readApiError(error), 'error')
    }
  }

  const onUpdateHeroSlide = async (slide) => {
    try {
      const response = await adminApi.updateHeroSlide(slide.id, heroSlidePayload(slide))
      showNotice(response.message || 'Slide actualizado.')
      await loadHeroSlides()
    } catch (error) {
      showNotice(readApiError(error), 'error')
    }
  }

  const onDeleteHeroSlide = async (slideId) => {
    setRemovingHeroSlideId(slideId)
    await new Promise((resolve) => setTimeout(resolve, 180))

    try {
      const response = await adminApi.deleteHeroSlide(slideId)
      showNotice(response.message || 'Slide eliminado.')
      await loadHeroSlides()
    } catch (error) {
      showNotice(readApiError(error), 'error')
    } finally {
      setRemovingHeroSlideId('')
    }
  }

  const hasHeroSlideChanges = (slide) => (
    heroSlideBaselines[slide.id] !== serializeHeroSlide(slide)
  )

  const removeProductImage = async (productId, indexToRemove) => {
    const product = products.find((item) => item.id === productId)
    if (!product) return

    const image = product.images?.[indexToRemove]
    if (!image) return

    if (image.id && product.slug) {
      try {
        const response = await adminApi.deleteProductImage(product.id, image.id)
        showNotice(response.message || 'Imagen eliminada correctamente.')
        await loadProducts()
        return
      } catch (error) {
        showNotice(readApiError(error), 'error')
        return
      }
    }

    const imagesList = (product.images || []).filter((_, index) => index !== indexToRemove)
    const mainImage = product.mainImage === image.url ? (imagesList[0]?.url || '') : product.mainImage
    const updatedProduct = { ...product, images: imagesList, mainImage }

    setProducts((prev) => prev.map((item) => (
      item.id === productId ? updatedProduct : item
    )))

    if (updatedProduct.slug) await onUpdateProduct(updatedProduct)
  }

  const reorderArray = (arr, fromIndex, toIndex) => {
    const copy = [...arr]
    const [moved] = copy.splice(fromIndex, 1)
    copy.splice(toIndex, 0, moved)
    return copy
  }

  const reorderProductImages = (productId, fromIndex, toIndex) => {
    let updatedProduct = null
    setProducts((prev) => prev.map((p) => {
      if (p.id !== productId) return p
      const imagesList = reorderArray(p.images || [], fromIndex, toIndex)
      const mainImage = imagesList[0]?.url || ''
      updatedProduct = { ...p, images: imagesList, mainImage }
      return updatedProduct
    }))
    if (updatedProduct) {
      onUpdateProduct(updatedProduct).catch(() => {})
    }
    setDragging(null)
  }

  const reorderNewProductImages = (fromIndex, toIndex) => {
    setNewProduct((prev) => {
      const imagesList = reorderArray(prev.images || [], fromIndex, toIndex)
      const mainImage = imagesList[0]?.url || ''
      return { ...prev, images: imagesList, mainImage }
    })
    setDragging(null)
  }

  const onDeleteProduct = async (id) => {
    setRemovingProductSlug(id)

    await new Promise((resolve) => setTimeout(resolve, 220))

    try {
      const response = await adminApi.deleteProduct(id)
      showNotice(response.message || 'Producto eliminado correctamente.')
      await Promise.all([loadProducts(), loadSummary()])
    } catch (error) {
      showNotice(readApiError(error), 'error')
    } finally {
      setRemovingProductSlug('')
    }
  }

  const onOrderDecision = async (orderId, action) => {
    try {
      const response = action === 'accept' ? await adminApi.acceptOrder(orderId) : await adminApi.rejectOrder(orderId)
      showNotice(response.message)
      await Promise.all([loadOrders(), loadSummary()])
    } catch (error) {
      showNotice(readApiError(error), 'error')
    }
  }

  const onDeleteOrder = async (orderId, restoreStock = false) => {
    setRemovingOrderId(orderId)

    await new Promise((resolve) => setTimeout(resolve, 220))

    try {
      const response = await adminApi.deleteOrder(orderId, restoreStock)
      showNotice(response.message || 'Pedido eliminado correctamente.')
      setSelectedOrder(null)
      await Promise.all([loadOrders(), loadSummary()])
    } catch (error) {
      showNotice(readApiError(error), 'error')
    } finally {
      setRemovingOrderId('')
    }
  }

  const editableProducts = useMemo(
    () => products.map((product) => ({ ...product })),
    [products],
  )

  return (
    <div className="app-shell">
      <AdminHeader
        tab={tab}
        onChangeTab={setTab}
        onLogout={onLogout}
        onOpenAccountSettings={() => {
          setAccountForm({
            ...EMPTY_ACCOUNT_FORM,
            email: storedAdminUser().email || accountForm.email || '',
          })
          setShowAccountSettings(true)
        }}
        lowStockProducts={summary.low_stock_products || []}
        lowStockThreshold={summary.low_stock_threshold || 5}
      />
      {noticeTone === 'error' && notice && (
        <div className="center-notice-layer">
          <NoticeBanner message={notice} tone={noticeTone} />
        </div>
      )}
      <main className="container admin-layout">
        {noticeTone !== 'error' && <NoticeBanner message={notice} tone={noticeTone} />}
        <section className="panel">
          <h3>Control general</h3>
          <div className="stats-grid">
            <div className="stat-box"><span>Productos totales</span><strong>{summary.product_count}</strong></div>
            <div className="stat-box"><span>Productos activos</span><strong>{summary.active_product_count}</strong></div>
            <div className="stat-box"><span>Pedidos</span><strong>{summary.order_count}</strong></div>
          </div>
        </section>


        {tab === 'products' ? (
          <section className="panel">
            <div className="product-toolbar">
              <button type="button" onClick={() => setShowCreateModal(true)}>Agregar producto</button>
              <div className="search-row product-search-inline">
                <input
                  value={productQ}
                  onChange={(e) => setProductQ(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      setProductPage(1)
                      await loadProducts({ q: productQ, page: 1 })
                    }
                  }}
                  placeholder="Buscar producto..."
                />
                <button
                  type="button"
                  onClick={async () => {
                    setProductPage(1)
                    await loadProducts({ q: productQ, page: 1 })
                  }}
                >
                  Buscar
                </button>
                <button
                  type="button"
                  className="btn-alt"
                  onClick={async () => {
                    setProductQ('')
                    setProductPage(1)
                    await loadProducts({ q: '', page: 1 })
                  }}
                >
                  Limpiar
                </button>
              </div>
            </div>

            <div className="product-list">
              {editableProducts.map((product) => (
                <article
                  className={`product-list-item ${expandedProductId === product.id ? 'is-open' : ''} ${removingProductSlug === product.slug ? 'is-removing' : ''} ${product.is_low_stock ? 'is-low-stock' : ''}`}
                  key={product.id}
                >
                  <button
                    type="button"
                    className="product-list-summary"
                    onClick={() => setExpandedProductId((current) => (current === product.id ? null : product.id))}
                    aria-expanded={expandedProductId === product.id}
                  >
                    <span className="product-list-thumb">
                      {product.images?.[0]?.url ? (
                        <img src={product.images[0].url} alt={product.images[0].alt || product.name} />
                      ) : (
                        <span>{product.name.slice(0, 2)}</span>
                      )}
                    </span>
                    <span className="product-list-main">
                      <strong>{product.name}</strong>
                      <small>{product.slug}</small>
                    </span>
                    <span className="product-list-meta">{formatCurrency(product.price)}</span>
                    <span className="product-list-meta">Stock {product.stock}</span>
                    <span className={`chip ${product.is_active ? '' : 'is-muted'}`}>
                      {product.is_active ? 'Activo' : 'Oculto'}
                    </span>
                    {product.is_low_stock && (
                      <span className={`stock-badge ${product.stock_status === 'out_of_stock' ? 'is-critical' : ''}`}>
                        {product.stock_status_label}
                      </span>
                    )}
                  </button>

                  {expandedProductId === product.id && (
                    <div className="product-edit-panel">
                      <div className="admin-form-grid">
                        <AdminField label="Nombre del producto">
                          <input value={product.name} onChange={(e) => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, name: e.target.value } : p))} />
                        </AdminField>
                        <AdminField label="ID">
                          <input value={product.slug} onChange={(e) => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, slug: e.target.value } : p))} />
                        </AdminField>
                        <AdminField label="Precio">
                          <input type="number" step="0.01" value={product.price} onChange={(e) => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, price: e.target.value } : p))} />
                        </AdminField>
                        <AdminField label="Stock">
                          <input type="number" value={product.stock} onChange={(e) => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, stock: e.target.value } : p))} />
                        </AdminField>
                      </div>

                      <AdminField label="Descripcion">
                        <textarea value={product.description || ''} onChange={(e) => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, description: e.target.value } : p))}></textarea>
                      </AdminField>

                      <div className="product-images-editor">
                        <span className="admin-field-title">Fotos del producto</span>
                        <div className="product-image-previews">
                          {(product.images || []).length > 0
                            ? product.images.map((image, index) => {
                                return (
                                    <div
                                      className={`product-image-preview relative group ${(dragging && !dragging.isNew && dragging.productId === product.id && dragging.index === index) ? 'is-dragging' : ''}`}
                                      key={`${image.url}-${index}`}
                                       draggable
                                       onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(index)); setDragging({ productId: product.id, index, isNew: false }) }}
                                       onDragEnd={() => setDragging(null)}
                                       onDragOver={(e) => e.preventDefault()}
                                       onDrop={(e) => {
                                         const from = parseInt(e.dataTransfer.getData('text/plain'), 10)
                                          if (!Number.isNaN(from)) reorderProductImages(product.id, from, index)
                                        }}
                                    >
                                    <img src={image.url} alt={image.alt || product.name} />
                                    <button
                                      type="button"
                                      className="image-remove-btn"
                                      aria-label={`Eliminar imagen ${index + 1}`}
                                      onClick={() => removeProductImage(product.id, index)}
                                    >
                                      ×
                                    </button>
                                  </div>
                                )
                              })
                            : (
                                <span className="muted">Sin fotos cargadas</span>
                              )}
                        </div>
                        <div className="card-actions">
                          <label className="btn-alt file-btn">
                            Cargar fotos
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={async (e) => {
                                await addImagesToProduct(product.id, e.target.files)
                                e.target.value = ''
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      <div className="admin-form-grid">
                        <AdminField label="Talla">
                          <input value={product.size || ''} onChange={(e) => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, size: e.target.value } : p))} placeholder="Opcional" />
                        </AdminField>
                        <AdminField label="Altura cm">
                          <input type="number" step="0.01" value={product.height_cm || ''} onChange={(e) => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, height_cm: e.target.value } : p))} />
                        </AdminField>
                        <AdminField label="Ancho cm">
                          <input type="number" step="0.01" value={product.width_cm || ''} onChange={(e) => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, width_cm: e.target.value } : p))} />
                        </AdminField>
                        <AdminField label="Profundidad cm">
                          <input type="number" step="0.01" value={product.depth_cm || ''} onChange={(e) => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, depth_cm: e.target.value } : p))} />
                        </AdminField>
                      </div>

                      <label className="method">
                        <input type="checkbox" checked={Boolean(product.is_active)} onChange={(e) => setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_active: e.target.checked } : p))} />
                        Publicado en catalogo
                      </label>
                      <div className="card-actions">
                        <button type="button" onClick={() => onUpdateProduct(product)}>Guardar cambios</button>
                        <button type="button" className="btn-danger" onClick={() => onDeleteProduct(product.id)}>Eliminar</button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
            <nav className="pagination catalog-pagination" aria-label="Paginacion de productos">
              <button
                type="button"
                className="pagination-btn"
                disabled={productPage <= 1}
                onClick={async () => {
                  const next = Math.max(1, productPage - 1)
                  setProductPage(next)
                  await loadProducts({ page: next })
                }}
              >
                ← Anterior
              </button>
              <span className="pagination-info">
                Página {productMeta.current_page || productPage} de {productMeta.last_page || 1}
              </span>
              <button
                type="button"
                className="pagination-btn"
                disabled={productPage >= (productMeta.last_page || 1)}
                onClick={async () => {
                  const next = Math.min(productMeta.last_page || 1, productPage + 1)
                  setProductPage(next)
                  await loadProducts({ page: next })
                }}
              >
                Siguiente →
              </button>
            </nav>
          </section>
        ) : tab === 'carousel' ? (
          <section className="panel">
            <div className="product-toolbar">
              <h3>Carrusel principal</h3>
            </div>

            <form className="carousel-admin-card carousel-admin-card--new" data-hero-slide-id="new" onSubmit={onCreateHeroSlide}>
              <div className="carousel-slide-preview">
                {newHeroSlide.image ? (
                  <img
                    src={newHeroSlide.image}
                    alt={newHeroSlide.title || 'Nuevo slide'}
                    className={heroImageStyle(newHeroSlide) ? 'is-cropped' : ''}
                    style={heroImageStyle(newHeroSlide) || undefined}
                  />
                ) : (
                  <span>Foto</span>
                )}
              </div>
              <div className="carousel-slide-fields">
                <div className="admin-form-grid">
                  <AdminField label="Etiqueta">
                    <input value={newHeroSlide.eyebrow} onChange={(e) => setNewHeroSlide((prev) => ({ ...prev, eyebrow: e.target.value }))} placeholder="Ej: NUEVA COLECCION" required />
                  </AdminField>
                  <AdminField label="Titulo">
                    <input value={newHeroSlide.title} onChange={(e) => setNewHeroSlide((prev) => ({ ...prev, title: e.target.value }))} placeholder="Ej: Invierno 2026" required />
                  </AdminField>
                  <AdminField label="Boton">
                    <input value={newHeroSlide.cta} onChange={(e) => setNewHeroSlide((prev) => ({ ...prev, cta: e.target.value }))} required />
                  </AdminField>
                  <AdminField label="Orden">
                    <input type="number" min="0" value={newHeroSlide.sort_order} onChange={(e) => setNewHeroSlide((prev) => ({ ...prev, sort_order: e.target.value }))} />
                  </AdminField>
                  <AdminField label="Articulo ligado">
                    <select value={newHeroSlide.product_id || ''} onChange={(e) => setNewHeroSlide((prev) => ({ ...prev, product_id: e.target.value }))}>
                      <option value="">Sin articulo</option>
                      {heroProductOptions.map((product) => (
                        <option value={product.id} key={product.id}>{product.name}</option>
                      ))}
                    </select>
                  </AdminField>
                </div>
                <div className="card-actions">
                  <label className="btn-alt file-btn">
                    Cargar foto
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        await openHeroCropper('new', e.target.files)
                        e.target.value = ''
                      }}
                    />
                  </label>
                  {newHeroSlide.image && (
                    <button type="button" className="btn-alt" onClick={() => reopenHeroCropper('new', newHeroSlide)}>
                      Recortar de nuevo
                    </button>
                  )}
                  <label className="method compact-method">
                    <input type="checkbox" checked={Boolean(newHeroSlide.is_active)} onChange={(e) => setNewHeroSlide((prev) => ({ ...prev, is_active: e.target.checked }))} />
                    Publicado
                  </label>
                  <button type="submit">Agregar al carrusel</button>
                </div>
              </div>
            </form>

            <div className="carousel-admin-list">
              {heroSlides.map((slide) => (
                <article className={`carousel-admin-card ${removingHeroSlideId === slide.id ? 'is-removing' : ''}`} data-hero-slide-id={slide.id} key={slide.id}>
                  <div className="carousel-slide-preview">
                    {slide.image ? (
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className={heroImageStyle(slide) ? 'is-cropped' : ''}
                        style={heroImageStyle(slide) || undefined}
                      />
                    ) : (
                      <span>Foto</span>
                    )}
                  </div>
                  <div className="carousel-slide-fields">
                    <div className="admin-form-grid">
                      <AdminField label="Etiqueta">
                        <input value={slide.eyebrow || ''} onChange={(e) => setHeroSlides((prev) => prev.map((item) => item.id === slide.id ? { ...item, eyebrow: e.target.value } : item))} />
                      </AdminField>
                      <AdminField label="Titulo">
                        <input value={slide.title || ''} onChange={(e) => setHeroSlides((prev) => prev.map((item) => item.id === slide.id ? { ...item, title: e.target.value } : item))} />
                      </AdminField>
                      <AdminField label="Boton">
                        <input value={slide.cta || ''} onChange={(e) => setHeroSlides((prev) => prev.map((item) => item.id === slide.id ? { ...item, cta: e.target.value } : item))} />
                      </AdminField>
                      <AdminField label="Orden">
                        <input type="number" min="0" value={slide.sort_order ?? 0} onChange={(e) => setHeroSlides((prev) => prev.map((item) => item.id === slide.id ? { ...item, sort_order: e.target.value } : item))} />
                      </AdminField>
                      <AdminField label="Articulo ligado">
                        <select value={slide.product_id || ''} onChange={(e) => setHeroSlides((prev) => prev.map((item) => item.id === slide.id ? { ...item, product_id: e.target.value } : item))}>
                          <option value="">Sin articulo</option>
                          {heroProductOptions.map((product) => (
                            <option value={product.id} key={product.id}>{product.name}</option>
                          ))}
                        </select>
                      </AdminField>
                    </div>
                    <div className="card-actions">
                      <label className="btn-alt file-btn">
                        Cambiar foto
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            await openHeroCropper(slide.id, e.target.files)
                            e.target.value = ''
                          }}
                        />
                      </label>
                      {slide.image && (
                        <button type="button" className="btn-alt" onClick={() => reopenHeroCropper(slide.id, slide)}>
                          Recortar de nuevo
                        </button>
                      )}
                      <label className="method compact-method">
                        <input type="checkbox" checked={Boolean(slide.is_active)} onChange={(e) => setHeroSlides((prev) => prev.map((item) => item.id === slide.id ? { ...item, is_active: e.target.checked } : item))} />
                        Publicado
                      </label>
                      {hasHeroSlideChanges(slide) && (
                        <button type="button" onClick={() => onUpdateHeroSlide(slide)}>Guardar cambios</button>
                      )}
                      <button type="button" className="btn-danger" onClick={() => onDeleteHeroSlide(slide.id)}>Eliminar</button>
                    </div>
                  </div>
                </article>
              ))}
              {heroSlides.length === 0 && <span className="muted">Sin slides cargados</span>}
            </div>
          </section>
        ) : (
          <section className="panel">
              <div className="filter-row">
              <input
                value={orderQ}
                onChange={(e) => setOrderQ(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    setOrderPage(1)
                    await loadOrders({ q: orderQ, dateFrom, dateTo, page: 1 })
                  }
                }}
                placeholder="Buscar por cliente, correo o estado"
              />
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              <button
                type="button"
                onClick={async () => {
                  setOrderPage(1)
                  await loadOrders({ q: orderQ, dateFrom, dateTo, page: 1 })
                }}
              >
                Filtrar
              </button>
              <button
                type="button"
                className="btn-alt"
                onClick={async () => {
                  setOrderQ('')
                  setDateFrom('')
                  setDateTo('')
                  setOrderPage(1)
                  await loadOrders({ q: '', dateFrom: '', dateTo: '', page: 1 })
                }}
              >
                Limpiar
              </button>
            </div>

            <div className="orders-compact">
              <div className="orders-head">
                <span>ID</span>
                <span>Cliente</span>
                <span>Estado</span>
                <span>Pago</span>
                <span>Total</span>
                <span>Accion</span>
              </div>
              {orders.map((order) => (
                <article className="orders-row" key={order.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedOrder(order)}>
                  <span className="mono">#{order.id}</span>
                  <span>
                    <strong>{order.customer_name}</strong>
                    <small>{order.customer_email}</small>
                  </span>
                  <span>
                    <small>{order.review_status_label}</small>
                    <small>{order.status_label}</small>
                  </span>
                  <span>
                    <small>{order.payment_status_label}</small>
                  </span>
                  <span><strong>{formatCurrency(order.total)}</strong></span>
                  <span>
                    {order.admin_review_status === 'pending' && order.status === 'pending' ? (
                      <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => onOrderDecision(order.id, 'accept')}>Aceptar</button>
                        <button type="button" className="btn-danger" onClick={() => onOrderDecision(order.id, 'reject')}>Rechazar</button>
                      </div>
                    ) : order.status === 'cancelled' ? (
                      <small>Pedido cancelado</small>
                    ) : (
                      <small>Decision registrada</small>
                    )}
                  </span>
                </article>
              ))}
            </div>

            <nav className="pagination catalog-pagination" aria-label="Paginacion de pedidos">
              <button
                type="button"
                className="pagination-btn"
                disabled={orderPage <= 1}
                onClick={async () => {
                  const next = Math.max(1, orderPage - 1)
                  setOrderPage(next)
                  await loadOrders({ page: next })
                }}
              >
                ← Anterior
              </button>
              <span className="pagination-info">
                Página {orderMeta.current_page || orderPage} de {orderMeta.last_page || 1}
              </span>
              <button
                type="button"
                className="pagination-btn"
                disabled={orderPage >= (orderMeta.last_page || 1)}
                onClick={async () => {
                  const next = Math.min(orderMeta.last_page || 1, orderPage + 1)
                  setOrderPage(next)
                  await loadOrders({ page: next })
                }}
              >
                Siguiente →
              </button>
            </nav>
          </section>
        )}
      </main>

      {showAccountSettings && (
        <div className="modal-overlay admin-create-overlay" role="dialog" aria-modal="true" onClick={() => setShowAccountSettings(false)}>
          <section className="modal-card admin-account-card" onClick={(e) => e.stopPropagation()}>
            <h3>Cuenta administrativa</h3>
            <form className="stack" onSubmit={onUpdateAccount}>
              <AdminField label="Correo de acceso">
                <input
                  type="email"
                  value={accountForm.email}
                  onChange={(e) => setAccountForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </AdminField>
              <AdminField label="Contrasena actual">
                <input
                  type="password"
                  value={accountForm.current_password}
                  onChange={(e) => setAccountForm((prev) => ({ ...prev, current_password: e.target.value }))}
                  autoComplete="current-password"
                  required
                />
              </AdminField>
              <div className="admin-form-grid admin-account-password-grid">
                <AdminField label="Nueva contrasena">
                  <input
                    type="password"
                    value={accountForm.password}
                    onChange={(e) => setAccountForm((prev) => ({ ...prev, password: e.target.value }))}
                    autoComplete="new-password"
                    minLength={6}
                    placeholder="Opcional"
                  />
                </AdminField>
                <AdminField label="Confirmar nueva contrasena">
                  <input
                    type="password"
                    value={accountForm.password_confirmation}
                    onChange={(e) => setAccountForm((prev) => ({ ...prev, password_confirmation: e.target.value }))}
                    autoComplete="new-password"
                    minLength={accountForm.password ? 6 : undefined}
                    placeholder="Opcional"
                  />
                </AdminField>
              </div>
              <p className="muted">
                Para cambiar solo el correo, deja vacia la nueva contrasena.
              </p>
              <div className="card-actions">
                <button type="submit" disabled={accountBusy}>
                  {accountBusy ? 'Guardando...' : 'Guardar cuenta'}
                </button>
                <button type="button" className="btn-alt" onClick={() => setShowAccountSettings(false)} disabled={accountBusy}>
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {tab === 'orders' && selectedOrder && (
        <div className="modal-overlay admin-create-overlay" role="dialog" aria-modal="true" onClick={() => setSelectedOrder(null)}>
          <section className="modal-card admin-create-card" onClick={(e) => e.stopPropagation()}>
            <h3>Detalles del Pedido #{selectedOrder.id}</h3>
            <div className="stack">
              <div className="admin-field">
                <span><strong>Cliente</strong></span>
                <span>{selectedOrder.customer_name}</span>
                <span className="muted">{selectedOrder.customer_email}</span>
              </div>
              <div className="admin-field">
                <span><strong>Estado</strong></span>
                <span>{selectedOrder.status_label}</span>
              </div>
              <div className="admin-field">
                <span><strong>Revision Administrador</strong></span>
                <span>{selectedOrder.review_status_label}</span>
              </div>
              <div className="admin-field">
                <span><strong>Pago</strong></span>
                <span>{selectedOrder.payment_status_label}</span>
              </div>
              <div className="admin-field">
                <span><strong>Total</strong></span>
                <span>{formatCurrency(selectedOrder.total)}</span>
              </div>
              <div className="admin-field">
                <span><strong>Productos Pedidos</strong></span>
                <div className="stack">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item) => (
                      <div className="row-card" key={item.id}>
                        <span>
                          <strong>{item.product_name}</strong>
                          <small>Cantidad: {item.quantity}</small>
                        </span>
                        <span><strong>{formatCurrency(item.subtotal)}</strong></span>
                      </div>
                    ))
                  ) : (
                    <span className="muted">Sin productos</span>
                  )}
                </div>
              </div>
            </div>
            <div className="card-actions">
              <button type="button" className="btn-danger" onClick={() => onDeleteOrder(selectedOrder.id, false)} disabled={removingOrderId === selectedOrder.id}>
                {removingOrderId === selectedOrder.id ? 'Eliminando...' : 'Eliminar Pedido'}
              </button>
              {selectedOrder.status === 'paid' && (
                <button
                  type="button"
                  className="btn-alt"
                  onClick={() => onDeleteOrder(selectedOrder.id, true)}
                  disabled={removingOrderId === selectedOrder.id}
                >
                  {removingOrderId === selectedOrder.id ? 'Procesando...' : 'Eliminar y devolver stock'}
                </button>
              )}
              <button type="button" className="btn-alt" onClick={() => setSelectedOrder(null)}>Cerrar</button>
            </div>
          </section>
        </div>
      )}

      {tab === 'products' && showCreateModal && (
        <div className="modal-overlay admin-create-overlay" role="dialog" aria-modal="true" onClick={() => setShowCreateModal(false)}>
          <section className="modal-card admin-create-card" onClick={(e) => e.stopPropagation()}>
            <h3>Agregar producto</h3>
            <form className="stack" onSubmit={onCreateProduct}>
              <div className="admin-form-grid">
                <AdminField label="Nombre del producto">
                  <input placeholder="Ej: BOLSO 4" value={newProduct.name} onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))} required />
                </AdminField>
                <AdminField label="ID del producto">
                  <input placeholder="Ej: bolso-4 (opcional)" value={newProduct.slug} onChange={(e) => setNewProduct((prev) => ({ ...prev, slug: e.target.value }))} />
                </AdminField>
                <AdminField label="Precio">
                  <input type="number" step="0.01" min="0" placeholder="Ej: 29990" value={newProduct.price} onChange={(e) => setNewProduct((prev) => ({ ...prev, price: e.target.value }))} required />
                </AdminField>
                <AdminField label="Stock">
                  <input type="number" min="0" placeholder="Ej: 12" value={newProduct.stock} onChange={(e) => setNewProduct((prev) => ({ ...prev, stock: e.target.value }))} required />
                </AdminField>
              </div>
              <AdminField label="Descripcion">
                <textarea placeholder="Describe el producto para el catalogo" value={newProduct.description} onChange={(e) => setNewProduct((prev) => ({ ...prev, description: e.target.value }))}></textarea>
              </AdminField>
              <div className="product-images-editor">
                <span className="admin-field-title">Fotos del producto</span>
                <div className="product-image-previews">
                  {(newProduct.images || []).length > 0
                    ? newProduct.images.map((image, index) => {
                        return (
                          <div
                            className={`product-image-preview relative group ${(dragging && dragging.isNew && dragging.index === index) ? 'is-dragging' : ''}`}
                            key={`${image.url}-${index}`}
                              draggable
                              onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(index)); setDragging({ productId: null, index, isNew: true }) }}
                              onDragEnd={() => setDragging(null)}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                const from = parseInt(e.dataTransfer.getData('text/plain'), 10)
                                if (!Number.isNaN(from)) reorderNewProductImages(from, index)
                              }}
                          >
                            <img src={image.url} alt={image.alt || newProduct.name} />
                            <button
                              type="button"
                              className="image-remove-btn"
                              onClick={() => setNewProduct((prev) => {
                                const imagesList = (prev.images || []).filter((_, i) => i !== index)
                                const mainImage = prev.mainImage === image.url ? (imagesList[0]?.url || '') : prev.mainImage
                                return { ...prev, images: imagesList, mainImage }
                              })}
                            >
                              ×
                            </button>
                          </div>
                        )
                      })
                    : (
                        <span className="muted">Sin fotos cargadas</span>
                      )}
                </div>
                <div className="card-actions">
                  <label className="btn-alt file-btn">
                    Cargar fotos
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={async (e) => {
                        await addImagesToNewProduct(e.target.files)
                        e.target.value = ''
                      }}
                    />
                  </label>
                </div>
              </div>
              <div className="admin-form-grid">
                <AdminField label="Talla">
                  <input placeholder="Opcional" value={newProduct.size} onChange={(e) => setNewProduct((prev) => ({ ...prev, size: e.target.value }))} />
                </AdminField>
                <AdminField label="Altura cm">
                  <input type="number" step="0.01" min="0" placeholder="Ej: 30" value={newProduct.height_cm} onChange={(e) => setNewProduct((prev) => ({ ...prev, height_cm: e.target.value }))} />
                </AdminField>
                <AdminField label="Ancho cm">
                  <input type="number" step="0.01" min="0" placeholder="Ej: 42" value={newProduct.width_cm} onChange={(e) => setNewProduct((prev) => ({ ...prev, width_cm: e.target.value }))} />
                </AdminField>
                <AdminField label="Profundidad cm">
                  <input type="number" step="0.01" min="0" placeholder="Ej: 14" value={newProduct.depth_cm} onChange={(e) => setNewProduct((prev) => ({ ...prev, depth_cm: e.target.value }))} />
                </AdminField>
              </div>
              <label className="method">
                <input type="checkbox" checked={newProduct.is_active} onChange={(e) => setNewProduct((prev) => ({ ...prev, is_active: e.target.checked }))} />
                Publicado en catalogo
              </label>
              <div className="card-actions">
                <button type="submit">Guardar producto</button>
                <button type="button" className="btn-alt" onClick={() => setShowCreateModal(false)}>Cancelar</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {heroCropper && (
        <div className="modal-overlay hero-crop-overlay" role="dialog" aria-modal="true" onClick={() => setHeroCropper(null)}>
          <section className="modal-card hero-cropper-card" onClick={(e) => e.stopPropagation()}>
            <h3>Recortar foto del carrusel</h3>
            <div className="hero-crop-layout">
              <div className="hero-crop-workspace">
                <div
                  className={`hero-crop-frame ${heroCropper.isDragging ? 'is-dragging' : ''}`}
                  onPointerDown={onHeroCropPointerDown}
                  onPointerMove={onHeroCropPointerMove}
                  onPointerUp={onHeroCropPointerUp}
                  onPointerCancel={onHeroCropPointerUp}
                >
                  {(() => {
                    const bounds = cropBounds(heroCropper.imageWidth, heroCropper.imageHeight, heroCropper.zoom)
                    return (
                      <img
                        src={heroCropper.source}
                        alt="Recorte del carrusel"
                        draggable="false"
                        style={{
                          width: `${bounds.widthPercent}%`,
                          height: `${bounds.heightPercent}%`,
                          left: `${50 - (heroCropper.focusX * bounds.widthPercent)}%`,
                          top: `${50 - (heroCropper.focusY * bounds.heightPercent)}%`,
                        }}
                      />
                    )
                  })()}
                  <div className="hero-crop-guides" aria-hidden="true" />
                </div>
              </div>
              <div className="hero-crop-overview" aria-hidden="true">
                <div
                  className="hero-crop-overview-canvas"
                  style={{ aspectRatio: `${heroCropper.imageWidth} / ${heroCropper.imageHeight}` }}
                >
                  <img src={heroCropper.source} alt="" draggable="false" />
                  <span className="hero-crop-selection" style={cropSelection(heroCropper)} />
                </div>
              </div>
            </div>
            <div className="hero-crop-controls">
              <div className="hero-crop-actions">
                <button type="button" onClick={applyHeroCrop}>Usar recorte</button>
                <button type="button" className="btn-alt" onClick={() => setHeroCropper(null)}>Cancelar</button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
