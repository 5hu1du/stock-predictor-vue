<script setup>
import { ref, onMounted } from 'vue'
import { useStockStore } from '../../stores/stock'
import { useMarketStore } from '../../stores/market'

const stock = useStockStore()
const market = useMarketStore()
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  await market.refreshHotStocks()
  loading.value = false
})

async function switchMarket(mkt) {
  market.setHotMarket(mkt)
  loading.value = true
  await market.refreshHotStocks()
  loading.value = false
}
</script>

<template>
  <div class="hot-tab">
    <div class="market-toggle">
      <button :class="{ active: market.hotMarket === 'us' }" @click="switchMarket('us')">🇺🇸 美股</button>
      <button :class="{ active: market.hotMarket === 'cn' }" @click="switchMarket('cn')">🇨🇳 A股</button>
      <button :class="{ active: market.hotMarket === 'hk' }" @click="switchMarket('hk')">🇭🇰 港股</button>
    </div>
    <div class="list" v-if="!loading && market.hotStocks.length">
      <div
        v-for="s in market.hotStocks" :key="s.sym"
        class="item" @click="stock.loadStock(s.sym)"
      >
        <div class="info">
          <div class="sym">{{ s.sym.replace(/\.(SS|SZ|HK)$/, '') }}</div>
          <div class="ename">{{ s.name }}</div>
        </div>
        <div class="price-info" v-if="market.hotPrices[s.sym]">
          <div class="price">{{ market.hotPrices[s.sym].price?.toFixed(2) || '--' }}</div>
          <div class="change" :style="{ color: market.hotPrices[s.sym].price >= market.hotPrices[s.sym].prevClose ? 'var(--green)' : 'var(--red)' }">
            {{ market.hotPrices[s.sym].price ? ((market.hotPrices[s.sym].price - market.hotPrices[s.sym].prevClose) >= 0 ? '+' : '') + (market.hotPrices[s.sym].price - market.hotPrices[s.sym].prevClose).toFixed(2) : '--' }}
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="loading" class="empty"><div class="spinner"></div>加载中...</div>
    <div v-else class="empty">暂无数据</div>
  </div>
</template>

<style scoped>
.hot-tab { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
.market-toggle { display: flex; gap: 4px; padding: 12px 16px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
.market-toggle button {
  flex: 1; padding: 6px 0; border: 1px solid var(--border); border-radius: 6px;
  background: transparent; color: var(--text-secondary); font-size: 11px;
  cursor: pointer; font-family: inherit; font-weight: 500; transition: all 0.2s;
}
.market-toggle button:hover { border-color: var(--accent); color: var(--text); }
.market-toggle button.active { background: var(--accent); border-color: var(--accent); color: white; }
.list { flex: 1; overflow-y: auto; }
.item {
  padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.03);
  cursor: pointer; display: flex; justify-content: space-between; align-items: center;
  transition: background 0.15s;
}
.item:hover { background: rgba(41,98,255,0.08); }
.info { flex: 1; }
.sym { font-weight: 600; font-size: 13px; }
.ename { font-size: 11px; color: var(--text-secondary); }
.price-info { text-align: right; }
.price { font-size: 13px; font-weight: 600; }
.change { font-size: 11px; }
.empty { padding: 32px; text-align: center; color: var(--text-secondary); font-size: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; }
.spinner { width: 20px; height: 20px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
