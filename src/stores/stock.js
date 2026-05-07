import { defineStore } from 'pinia'
import { fetchStockData, searchStocks as searchApi } from '../composables/useStockApi'
import { calcSMA, calcRSI, calcMACD, calcBollingerBands, calcVolatility, generateSignals } from '../composables/useTA'
import { predict } from '../composables/usePrediction'

export const useStockStore = defineStore('stock', {
  state: () => ({
    symbol: 'AAPL',
    name: '',
    exchange: '',
    currency: 'USD',
    timeframe: '1mo',
    rawData: [],
    meta: null,
    loading: false,
    error: null,
    dataSource: '',
    // Derived data
    closes: [],
    volumes: [],
    ma5: [],
    ma20: [],
    bb: [],
    signals: [],
    prediction: null,
    rsi: 50,
    volatility: 0,
    macdLatest: null,
  }),

  getters: {
    currentPrice: (state) => state.meta?.regularMarketPrice || (state.closes.length ? state.closes[state.closes.length - 1] : null),
    previousClose: (state) => state.meta?.previousClose,
    change() {
      const p = this.currentPrice
      const prev = this.previousClose
      if (p != null && prev != null && prev > 0) return { val: p - prev, pct: ((p - prev) / prev) * 100 }
      return null
    },
    trend() {
      if (!this.prediction) return null
      const p = this.prediction.predictions
      return p[p.length - 1].value > p[0].value ? 'up' : 'down'
    },
  },

  actions: {
    async loadStock(symbol) {
      this.symbol = symbol.toUpperCase()
      this.loading = true
      this.error = null
      this.prediction = null
      this.rawData = []

      try {
        const { data, meta, source } = await fetchStockData(this.symbol, this.timeframe)
        this.meta = meta
        this.name = meta.name
        this.exchange = meta.exchange
        this.currency = meta.currency
        this.dataSource = source || 'unknown'
        this.rawData = data
        this.closes = data.map(d => d[1])
        this.volumes = data.map(d => d[4])

        // Technical analysis (synchronous, instant)
        this.ma5 = calcSMA(this.closes, 5)
        this.ma20 = calcSMA(this.closes, 20)
        this.bb = calcBollingerBands(this.closes)
        this.rsi = calcRSI(this.closes)
        this.volatility = calcVolatility(this.closes)
        this.signals = generateSignals(this.closes, data)
        const macd = calcMACD(this.closes)
        this.macdLatest = macd.latest

        // Prediction (synchronous, instant linear regression — no TF.js)
        this.prediction = predict(data, 20)
      } catch (e) {
        this.error = e.message || '加载失败'
        console.error('Load stock error:', e)
      } finally {
        this.loading = false
      }
    },

    async changeTimeframe(tf) {
      this.timeframe = tf
      await this.loadStock(this.symbol)
    },

    async searchStocks(query) {
      return await searchApi(query)
    },
  },
})
