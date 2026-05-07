import { defineStore } from 'pinia'
import { fetchPriceSnapshot } from '../composables/useStockApi'

export const usePortfolioStore = defineStore('portfolio', {
  state: () => ({
    holdings: JSON.parse(localStorage.getItem('stock_portfolio') || '[]'),
    prices: {},
    loading: false,
  }),

  getters: {
    totalInvest: (state) => state.holdings.reduce((sum, h) => sum + h.buyPrice * h.quantity, 0),
    totalValue: (state) => {
      return state.holdings.reduce((sum, h) => {
        const cur = state.prices[h.symbol]
        return sum + (cur ? cur * h.quantity : h.buyPrice * h.quantity)
      }, 0)
    },
    totalPL: (state) => {
      const val = state.holdings.reduce((sum, h) => {
        const cur = state.prices[h.symbol]
        return sum + (cur ? (cur - h.buyPrice) * h.quantity : 0)
      }, 0)
      return val
    },
    totalPLPct() {
      const inv = this.totalInvest
      return inv > 0 ? (this.totalPL / inv) * 100 : 0
    },
    holdingsWithPL: (state) => state.holdings.map(h => {
      const cur = state.prices[h.symbol]
      const invested = h.buyPrice * h.quantity
      const curVal = cur ? cur * h.quantity : invested
      const pl = curVal - invested
      const plPct = invested > 0 ? (pl / invested) * 100 : 0
      return { ...h, curPrice: cur, curValue: curVal, pl, plPct }
    }),
  },

  actions: {
    addHolding(h) {
      this.holdings.push({ ...h, id: Date.now() })
      this.save()
    },
    removeHolding(id) {
      this.holdings = this.holdings.filter(h => h.id !== id)
      this.save()
    },
    save() {
      localStorage.setItem('stock_portfolio', JSON.stringify(this.holdings))
    },
    async refreshPrices() {
      this.loading = true
      for (const h of this.holdings) {
        const meta = await fetchPriceSnapshot(h.symbol)
        if (meta?.regularMarketPrice) {
          this.prices[h.symbol] = meta.regularMarketPrice
        }
      }
      this.loading = false
    },
  },
})
