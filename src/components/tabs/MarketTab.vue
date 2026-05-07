<script setup>
import { ref, onMounted } from 'vue'
import { useStockStore } from '../../stores/stock'
import { useMarketStore } from '../../stores/market'
import { fetchPriceSnapshot } from '../../composables/useStockApi'

const stock = useStockStore()
const market = useMarketStore()
const allIndices = ref([])
const indexPrices = ref({})
const loading = ref(true)

const markets = [
  { key: 'us', label: '🇺🇸 美股指数', indices: [{ sym: '^GSPC', name: 'S&P 500' }, { sym: '^IXIC', name: 'NASDAQ' }, { sym: '^DJI', name: '道琼斯工业' }] },
  { key: 'cn', label: '🇨🇳 A股指数', indices: [{ sym: '000001.SS', name: '上证指数' }, { sym: '399001.SZ', name: '深证成指' }, { sym: '399006.SZ', name: '创业板指' }] },
  { key: 'hk', label: '🇭🇰 港股指数', indices: [{ sym: '^HSI', name: '恒生指数' }, { sym: '^HSTECH', name: '恒生科技' }] },
]

onMounted(async () => {
  loading.value = true
  const all = markets.flatMap(m => m.indices)
  for (const idx of all) {
    const meta = await fetchPriceSnapshot(idx.sym)
    if (meta) indexPrices.value[idx.sym] = meta
  }
  loading.value = false
})
</script>

<template>
  <div class="market-tab">
    <div v-if="loading" style="padding:32px;text-align:center;color:var(--text-secondary);">
      <div class="spinner"></div> 加载指数数据...
    </div>
    <div v-else v-for="mkt in markets" :key="mkt.key" class="section">
      <h4>{{ mkt.label }}</h4>
      <div
        v-for="idx in mkt.indices" :key="idx.sym"
        class="card" @click="stock.loadStock(idx.sym)"
      >
        <div class="info">
          <div class="name">{{ idx.name }}</div>
          <div class="code">{{ idx.sym }}</div>
        </div>
        <div class="price-col" v-if="indexPrices[idx.sym]">
          <div class="price">{{ indexPrices[idx.sym].regularMarketPrice?.toFixed(2) || '--' }}</div>
          <div class="change" :style="{ color: (indexPrices[idx.sym].regularMarketPrice - indexPrices[idx.sym].previousClose) >= 0 ? 'var(--green)' : 'var(--red)' }">
            {{ ((indexPrices[idx.sym].regularMarketPrice - indexPrices[idx.sym].previousClose) >= 0 ? '+' : '') + (indexPrices[idx.sym].regularMarketPrice - indexPrices[idx.sym].previousClose).toFixed(2) }}
            ({{ indexPrices[idx.sym].previousClose ? ((indexPrices[idx.sym].regularMarketPrice / indexPrices[idx.sym].previousClose - 1) * 100).toFixed(2) : '--' }}%)
          </div>
        </div>
        <div v-else style="color:var(--text-secondary);">--</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.market-tab { flex: 1; overflow-y: auto; }
.section { padding: 14px 16px; border-bottom: 1px solid var(--border); }
.section h4 { font-size: 11px; color: var(--text-secondary); letter-spacing: 1px; margin-bottom: 10px; text-transform: uppercase; }
.card {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 12px; margin-bottom: 6px;
  background: var(--bg); border-radius: 8px; cursor: pointer;
  transition: all 0.2s; border: 1px solid transparent;
}
.card:hover { border-color: var(--border); background: rgba(41,98,255,0.05); }
.name { font-size: 13px; font-weight: 600; }
.code { font-size: 10px; color: var(--text-secondary); }
.price-col { text-align: right; }
.price { font-size: 15px; font-weight: 600; }
.change { font-size: 11px; margin-top: 2px; }
.spinner { width: 20px; height: 20px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; vertical-align: middle; margin-right: 8px; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
