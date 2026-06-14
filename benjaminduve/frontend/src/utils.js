export const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

export const readApiError = (error, fallback = 'Ocurrio un error inesperado.') => {
  return error?.response?.data?.message || fallback
}

function calculateRutVerifier(body) {
  const series = [2, 3, 4, 5, 6, 7]
  let sum = 0
  let seriesIndex = 0

  for (let i = body.length - 1; i >= 0; i -= 1) {
    sum += Number(body[i]) * series[seriesIndex]
    seriesIndex = (seriesIndex + 1) % series.length
  }

  const remainder = 11 - (sum % 11)

  if (remainder === 11) return '0'
  if (remainder === 10) return 'K'
  return String(remainder)
}

export function validateRut(rut) {
  const trimmed = String(rut || '').trim()

  if (!trimmed) {
    return { valid: false, message: 'El RUT ingresado no es válido.' }
  }

  const match = trimmed.match(/^(\d{1,2}(?:\.\d{3})*|\d{7,8})-([\dkK])$/)
  if (!match) {
    return { valid: false, message: 'El RUT ingresado no es válido.' }
  }

  const body = match[1].replace(/\./g, '')
  const providedVerifier = match[2].toUpperCase()
  const calculatedVerifier = calculateRutVerifier(body)

  if (providedVerifier !== calculatedVerifier) {
    return { valid: false, message: 'El RUT ingresado no es válido.' }
  }

  return { valid: true, message: '' }
}

