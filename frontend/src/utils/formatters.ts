export function formatMoney(value: number | undefined | null, currency = 'VND'): string {
  if (value === undefined || value === null || isNaN(value)) {
    return currency === 'VND' ? '0 ₫' : '0'
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency || 'VND',
    maximumFractionDigits: currency === 'VND' ? 0 : 2,
  }).format(value)
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}
