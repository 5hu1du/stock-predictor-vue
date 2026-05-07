import { defineStore } from 'pinia'
import { fetchPriceSnapshot } from '../composables/useStockApi'
import { hotStocks as hsData, marketIndices as miData } from '../data/hotStocks'

export const useMarketStore = defineStore('market', {
  state: () => ({
    hotMarket: 'us',
    hotPrices: {},
    indexPrices: {},
    loading: false,
  }),

  getters: {
    hotStocks: (state) => hsData[state.hotMarket] || hsData.us,
    marketIndices: () => miData,
    allIndices: (state) => [
      ...(miData.us || []).map(i => ({ ...i, market: 'us' })),
      ...(miData.cn || []).map(i => ({ ...i, market: 'cn' })),
      ...(miData.hk || []).map(i => ({ ...i, market: 'hk' })),
    ],
  },

  actions: {
    setHotMarket(mkt) { this.hotMarket = mkt },
    async refreshHotStocks() {
      this.loading = true
      const stocks = this.hotStocks
      for (const s of stocks) {
        const meta = await fetchPriceSnapshot(s.sym)
        if (meta) {
          this.hotPrices[s.sym] = {
            price: meta.regularMarketPrice,
            prevClose: meta.previousClose,
          }
        }
      }
      this.loading = false
    },
    async refreshIndices() {
      const allIdx = this.allIndices
      for (const idx of allIdx) {
        const meta = await fetchPriceSnapshot(idx.sym)
        if (meta) {
          this.indexPrices[idx.sym] = {
            price: meta.regularMarketPrice,
            prevClose: meta.previousClose,
          }
        }
      }
    },
  },
})
