export function calcSMA(closes, period) {
  const result = []
  for (let i = period - 1; i < closes.length; i++) {
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += closes[j]
    result.push(sum / period)
  }
  return result
}

export function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return 50
  let gains = 0, losses = 0
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff >= 0) gains += diff; else losses -= diff
  }
  const avgG = gains / period, avgL = losses / period
  if (avgL === 0) return 100
  return 100 - (100 / (1 + avgG / avgL))
}

function calcEMA(data, period) {
  const result = [], k = 2 / (period + 1)
  let ema = data[0]; result.push(ema)
  for (let i = 1; i < data.length; i++) { ema = data[i] * k + ema * (1 - k); result.push(ema) }
  return result
}

export function calcMACD(closes) {
  const ema12 = calcEMA(closes, 12), ema26 = calcEMA(closes, 26)
  const macdLine = ema12.map((v, i) => v - ema26[i])
  const signal = calcEMA(macdLine, 9)
  const hist = macdLine.map((v, i) => v - signal[i])
  const last = macdLine.length - 1
  return {
    macdLine, signal, hist,
    latest: { macd: macdLine[last], signal: signal[last], hist: hist[last] },
  }
}

export function calcBollingerBands(closes, period = 20, stdDev = 2) {
  const sma = calcSMA(closes, period)
  const bands = []
  for (let i = 0; i < sma.length; i++) {
    let variance = 0
    const idx = i + period - 1
    for (let j = idx - period + 1; j <= idx; j++) variance += Math.pow(closes[j] - sma[i], 2)
    const std = Math.sqrt(variance / period)
    bands.push({ upper: sma[i] + stdDev * std, middle: sma[i], lower: sma[i] - stdDev * std })
  }
  return bands
}

export function calcVolatility(closes) {
  if (closes.length < 2) return 0
  let sum = 0
  for (let i = 1; i < closes.length; i++) {
    const ret = (closes[i] - closes[i - 1]) / closes[i - 1]
    sum += ret * ret
  }
  return Math.sqrt(sum / (closes.length - 1)) * 100 * Math.sqrt(252)
}

export function generateSignals(closes, rawData) {
  const signals = []
  const rsi = calcRSI(closes)
  const macd = calcMACD(closes)
  const bb = calcBollingerBands(closes)
  const ma5 = calcSMA(closes, 5)
  const ma20 = calcSMA(closes, 20)

  if (rsi > 70) signals.push({ type: 'sell', text: `RSI 超买 (${rsi.toFixed(1)}) — 可能回调` })
  else if (rsi < 30) signals.push({ type: 'buy', text: `RSI 超卖 (${rsi.toFixed(1)}) — 可能反弹` })
  else signals.push({ type: 'neutral', text: `RSI 中性 (${rsi.toFixed(1)})` })

  if (macd.latest) {
    const { macd: ml, signal: ms, hist } = macd.latest
    if (hist > 0 && ml > ms) signals.push({ type: 'buy', text: 'MACD 金叉看涨' })
    else if (hist < 0 && ml < ms) signals.push({ type: 'sell', text: 'MACD 死叉看跌' })
    else signals.push({ type: 'neutral', text: 'MACD 震荡整理' })
  }

  const lastClose = closes[closes.length - 1]
  const lastBB = bb[bb.length - 1]
  if (lastBB) {
    if (lastClose > lastBB.upper) signals.push({ type: 'sell', text: '突破布林上轨 — 超买' })
    else if (lastClose < lastBB.lower) signals.push({ type: 'buy', text: '跌破布林下轨 — 超卖' })
    else signals.push({ type: 'neutral', text: '价格在布林带内运行' })
  }

  if (ma5.length >= 2 && ma20.length >= 2) {
    const l5 = ma5[ma5.length - 1], l20 = ma20[ma20.length - 1]
    const p5 = ma5[ma5.length - 2], p20 = ma20[ma20.length - 2]
    if (p5 < p20 && l5 > l20) signals.push({ type: 'buy', text: 'MA5 上穿 MA20 — 金叉买入' })
    else if (p5 > p20 && l5 < l20) signals.push({ type: 'sell', text: 'MA5 下穿 MA20 — 死叉卖出' })
  }

  return signals
}
