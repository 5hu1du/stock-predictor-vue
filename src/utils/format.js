export function formatVolume(v) {
  if (!v) return '--'
  if (v > 1e9) return (v / 1e9).toFixed(1) + 'B'
  if (v > 1e6) return (v / 1e6).toFixed(1) + 'M'
  if (v > 1e3) return (v / 1e3).toFixed(1) + 'K'
  return v.toString()
}

export function formatMarketCap(mc) {
  if (!mc) return '--'
  if (mc > 1e12) return '$' + (mc / 1e12).toFixed(2) + 'T'
  if (mc > 1e9) return '$' + (mc / 1e9).toFixed(2) + 'B'
  if (mc > 1e6) return '$' + (mc / 1e6).toFixed(2) + 'M'
  return '$' + mc
}

export function formatPrice(price, currency = 'USD') {
  if (price == null) return '--'
  const sym = currency === 'CNY' ? '¥' : '$'
  return sym + price.toFixed(2)
}

export function formatChange(change, pct) {
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)} (${sign}${pct.toFixed(2)}%)`
}
