import { QQ_BASE, YF_CHART_BASE, YF_SEARCH_BASE } from '../config/api.js'

// Timeframe config: { label, ktype for QQ, range for Yahoo, limit }
const tfConfig = {
  '1d':  { ktype: '5min', limit: 300 },
  '5d':  { ktype: '15min', limit: 300 },
  '1mo': { ktype: '60min', limit: 300 },
  '3mo': { ktype: 'day', limit: 100 },
  '6mo': { ktype: 'day', limit: 150 },
  '1y':  { ktype: 'day', limit: 300 },
  '5y':  { ktype: 'week', limit: 300 },
}

function getQQPrefix(symbol) {
  const s = symbol.toUpperCase()
  if (s.endsWith('.SS')) return 'sh' + s.replace('.SS', '')
  if (s.endsWith('.SZ')) return 'sz' + s.replace('.SZ', '')
  if (s.endsWith('.HK')) return 'hk' + s.replace('.HK', '')
  if (s === '^GSPC') return 'us.INX'
  if (s === '^IXIC') return 'us.IXIC'
  if (s === '^DJI') return 'us.DJI'
  if (s === '^HSI') return 'hkHSI'
  if (s === '^HSTECH') return 'hkHSTECH'
  if (s.startsWith('^') && s.endsWith('.SS')) return 'sh' + s.replace(/(^\^|\.SS$)/g, '')
  if (s.startsWith('^') && s.endsWith('.SZ')) return 'sz' + s.replace(/(^\^|\.SZ$)/g, '')
  return 'us' + s
}

async function fetchFromQQ(symbol, timeframe) {
  const prefix = getQQPrefix(symbol)
  let config = tfConfig[timeframe] || tfConfig['1mo']

  // First try the requested ktype
  let resp = await fetch(`${QQ_BASE}/appstock/app/fqkline/get?param=${prefix},${config.ktype},,,${config.limit},qfq`)
  if (!resp.ok) throw new Error(`QQ ${resp.status}`)
  let json = await resp.json()

  // If code != 0, the ktype might not be supported for this market. Fall back to daily.
  if (json.code !== 0) {
    resp = await fetch(`${QQ_BASE}/appstock/app/fqkline/get?param=${prefix},day,,,200,qfq`)
    if (!resp.ok) throw new Error(`QQ ${resp.status}`)
    json = await resp.json()
    if (json.code !== 0) throw new Error('QQ Finance: API error code ' + json.code)
    config = { ktype: 'day', limit: 200 }
  }

  const stockData = json.data?.[prefix]
  if (!stockData) throw new Error('QQ Finance: No data for ' + prefix)

  // Try multiple key formats: qfq{ktype}, {ktype}, qt{ktype}
  let lines = null
  const keysToTry = [`qfq${config.ktype}`, config.ktype]
  for (const k of keysToTry) {
    if (stockData[k]?.length) { lines = stockData[k]; break }
  }
  if (!lines?.length) throw new Error('QQ Finance: No kline data')

  const data = []
  let prevClose = null, totalVolume = 0

  // QQ kline format: [date, open, close, high, low, volume]
  for (const line of lines) {
    const dateStr = line[0]
    const open = parseFloat(line[1]), close = parseFloat(line[2])
    const high = parseFloat(line[3]), low = parseFloat(line[4])
    const volume = parseFloat(line[5]) || 0
    if (isNaN(open)) continue
    data.push([open, close, low, high, volume, dateStr])
    totalVolume += volume
    if (prevClose === null && data.length > 1) prevClose = data[0][1]
  }

  if (!data.length) throw new Error('No valid data points')
  const last = data[data.length - 1]
  const currency = symbol.endsWith('.SS') || symbol.endsWith('.SZ') ? 'CNY' : symbol.endsWith('.HK') ? 'HKD' : 'USD'

  return {
    data, source: 'qq',
    meta: {
      symbol, name: symbol, exchange: '', currency,
      previousClose: prevClose || last[1],
      regularMarketPrice: last[1],
      regularMarketDayHigh: last[3], regularMarketDayLow: last[2],
      regularMarketVolume: totalVolume,
    },
  }
}

// Yahoo fallback
const yfMap = { '1d': ['5m','1d'], '5d': ['15m','5d'], '1mo': ['1h','1mo'], '3mo': ['1d','3mo'], '6mo': ['1d','6mo'], '1y': ['1d','1y'], '5y': ['1wk','5y'] }

async function fetchFromYahoo(symbol, timeframe) {
  const [interval, range] = yfMap[timeframe] || ['1d', '1mo']
  const path = `/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&includePrePost=false`
  const resp = await fetch(`${YF_CHART_BASE}${path}`)
  if (!resp.ok) throw new Error(`Yahoo ${resp.status}`)
  const json = await resp.json()
  const result = json.chart?.result?.[0]
  if (!result) throw new Error('No data')
  return processYahoo(result)
}

function processYahoo(result) {
  const meta = result.meta, quotes = result.indicators.quote[0]
  const adjclose = result.indicators.adjclose?.[0]?.adjclose
  const data = []
  for (let i = 0; i < result.timestamp.length; i++) {
    const o = quotes.open[i], h = quotes.high[i], l = quotes.low[i]
    const c = adjclose ? adjclose[i] : quotes.close[i]
    if (o == null || h == null || l == null || c == null) continue
    data.push([o, c, l, h, quotes.volume[i] || 0])
  }
  return { data, source: 'yahoo', meta: { symbol: meta.symbol, name: meta.shortName || meta.symbol, exchange: meta.exchangeName || '', currency: meta.currency || 'USD', previousClose: meta.previousClose || meta.chartPreviousClose, regularMarketPrice: meta.regularMarketPrice, regularMarketDayHigh: meta.regularMarketDayHigh, regularMarketDayLow: meta.regularMarketDayLow, regularMarketVolume: meta.regularMarketVolume, fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh, fiftyTwoWeekLow: meta.fiftyTwoWeekLow, marketCap: meta.marketCap } }
}

export async function fetchStockData(symbol, timeframe = '1mo') {
  try { return await fetchFromQQ(symbol, timeframe) }
  catch (e) { console.warn('QQ failed:', e.message) }
  return await fetchFromYahoo(symbol, timeframe)
}

export async function searchStocks(query) {
  try {
    const resp = await fetch(`${YF_SEARCH_BASE}/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8`)
    if (resp.ok) { const json = await resp.json(); return json.quotes || [] }
  } catch {}
  return []
}

export async function fetchPriceSnapshot(symbol) {
  try { const { meta } = await fetchStockData(symbol, '1d'); return meta }
  catch { return null }
}
