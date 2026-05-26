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

