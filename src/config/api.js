// Dev: Vite proxy handles /api/* → external hosts (no CORS issues)
// Prod: call external hosts directly (CORS permitting)
export const QQ_BASE = import.meta.env.DEV
  ? '/api/qq'
  : 'https://web.ifzq.gtimg.cn'

export const YF_CHART_BASE = import.meta.env.DEV
  ? '/api/yf-chart'
  : 'https://query1.finance.yahoo.com'

export const YF_SEARCH_BASE = import.meta.env.DEV
  ? '/api/yf-search'
  : 'https://query2.finance.yahoo.com'
