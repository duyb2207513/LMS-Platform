export function useAnalyticsFormatter() {
  function formatSeconds(seconds: number): string {
    if (!seconds || seconds <= 0) return '0 phút'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours} giờ ${minutes} phút`
    }
    return `${minutes} phút`
  }

  function formatPercent(value: number, decimals: number = 1): string {
    if (value === undefined || value === null || isNaN(value)) return '0%'
    return `${Number(value).toFixed(decimals)}%`
  }

  function formatMoney(amount: number, currency: string = 'VND'): string {
    if (amount === undefined || amount === null || isNaN(amount)) return '0 ₫'
    try {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: currency || 'VND',
        maximumFractionDigits: 0,
      }).format(amount)
    } catch {
      return `${amount.toLocaleString('vi-VN')} ₫`
    }
  }

  function formatDate(dateString: string): string {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  return {
    formatSeconds,
    formatPercent,
    formatMoney,
    formatDate,
  }
}
