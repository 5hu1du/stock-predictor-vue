import { QQ_BASE, YF_CHART_BASE, YF_SEARCH_BASE } from '../config/api.js'
import { hotStocks } from '../data/hotStocks.js'

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
  if (s.endsWith('.SS')) return { prefix: 'sh' + s.replace('.SS', ''), market: 'cn' }
  if (s.endsWith('.SZ')) return { prefix: 'sz' + s.replace('.SZ', ''), market: 'cn' }
  if (s.endsWith('.HK')) {
    // Pad HK code to 5 digits: 0700 → 00700
    const code = s.replace('.HK', '')
    return { prefix: 'hk' + code.padStart(5, '0'), market: 'hk' }
  }
  if (s === '^GSPC') return { prefix: 'us.INX', market: 'us' }
  if (s === '^IXIC') return { prefix: 'us.IXIC', market: 'us' }
  if (s === '^DJI') return { prefix: 'us.DJI', market: 'us' }
  if (s === '^HSI') return { prefix: 'hkHSI', market: 'hk' }
  if (s === '^HSTECH') return { prefix: 'hkHSTECH', market: 'hk' }
  if (s.startsWith('^') && s.endsWith('.SS')) return { prefix: 'sh' + s.replace(/(^\^|\.SS$)/g, ''), market: 'cn' }
  if (s.startsWith('^') && s.endsWith('.SZ')) return { prefix: 'sz' + s.replace(/(^\^|\.SZ$)/g, ''), market: 'cn' }
  return { prefix: 'us' + s.replace('-', '.') + '.OQ', market: 'us' }
}

async function fetchFromQQ(symbol, timeframe) {
  const { prefix, market } = getQQPrefix(symbol)
  let config = tfConfig[timeframe] || tfConfig['1mo']

  // HK stocks use hkfqkline; US & A-share stocks use fqkline
  const endpoint = market === 'hk' ? 'hkfqkline' : 'fqkline'

  // Try requested ktype first, fall back to daily
  let json = null
  for (const [ktype, limit] of [[config.ktype, config.limit], ['day', 200]]) {
    const url = `${QQ_BASE}/appstock/app/${endpoint}/get?param=${prefix},${ktype},,,${limit},qfq`
    const resp = await fetch(url)
    if (!resp.ok) continue
    json = await resp.json()
    if (json.code === 0) { config = { ktype, limit }; break }
    json = null
  }

  if (!json) throw new Error('QQ Finance: request failed')

  let stockData = json.data?.[prefix]
  if (!stockData) throw new Error('QQ data key mismatch: ' + (json.data ? Object.keys(json.data).join(', ') : 'no data'))

  let lines = null
  const keysToTry = [`qfq${config.ktype}`, config.ktype]
  for (const k of keysToTry) {
    if (stockData[k]?.length) { lines = stockData[k]; break }
  }
  if (!lines?.length) {
    const avail = Object.keys(stockData).filter(k => Array.isArray(stockData[k])).join(', ')
    throw new Error(`QQ: no kline data — tried [${keysToTry.join(', ')}], available: [${avail}]`)
  }

  const data = []
  let prevClose = null, totalVolume = 0

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
  const q = query.toLowerCase().trim()
  if (!q) return []

  const results = []
  const seen = new Set()

  // 1. Local hot stocks (instant)
  for (const market of ['us', 'cn', 'hk']) {
    for (const stock of (hotStocks[market] || [])) {
      if (stock.sym.toLowerCase().includes(q) || stock.name.toLowerCase().includes(q)) {
        if (!seen.has(stock.sym)) {
          results.push({ symbol: stock.sym, shortname: stock.name, longname: '' })
          seen.add(stock.sym)
        }
      }
    }
  }

  // 2. Try QQ smartbox API for additional results
  try {
    const url = `https://smartbox.gtimg.cn/s3/?q=${encodeURIComponent(query)}&t=all&c=stock`
    const resp = await fetch(url)
    if (resp.ok) {
      const text = await resp.text()
      const json = JSON.parse(text.replace(/^var\s+\w+\s*=\s*/, '').replace(/;?\s*$/, ''))
      for (const s of (json?.data?.stock || [])) {
        const code = s.code || ''
        let symbol = code
        if (code.startsWith('sh')) symbol = code.replace('sh', '') + '.SS'
        else if (code.startsWith('sz')) symbol = code.replace('sz', '') + '.SZ'
        else if (code.startsWith('hk')) symbol = code.replace('hk', '').replace(/^0+/, '') + '.HK'
        else if (code.startsWith('us')) symbol = code.replace('us', '').replace('.OQ', '')
        symbol = symbol.toUpperCase()
        if (!seen.has(symbol)) {
          results.push({ symbol, shortname: s.name || '', longname: s.fullname || '' })
          seen.add(symbol)
        }
      }
    }
  } catch { /* external search failed — use local results only */ }

  return results.slice(0, 15)
}

export async function fetchPriceSnapshot(symbol) {
  try { const { meta } = await fetchStockData(symbol, '1d'); return meta }
  catch { return null }
}
