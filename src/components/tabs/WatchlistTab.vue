<script setup>
import { ref, onMounted } from 'vue'
import { useStockStore } from '../../stores/stock'
import { fetchPriceSnapshot } from '../../composables/useStockApi'

const stock = useStockStore()

const watchlist = ref(JSON.parse(localStorage.getItem('stock_watchlist') || '[]'))
const prices = ref({})

function save() { localStorage.setItem('stock_watchlist', JSON.stringify(watchlist.value)) }

function addCurrent() {
  if (!watchlist.value.find(w => w.symbol === stock.symbol)) {
    watchlist.value.push({ symbol: stock.symbol, added: Date.now() })
    save()
    refresh()
  }
}

function remove(symbol) {
  watchlist.value = watchlist.value.filter(w => w.symbol !== symbol)
  save()
}

async function refresh() {
  for (const w of watchlist.value) {
    const meta = await fetchPriceSnapshot(w.symbol)
    if (meta) prices.value[w.symbol] = meta
  }
}

onMounted(refresh)
</script>

<template>
  <div class="watchlist-tab">
    <div class="header">
      <h3>自选股</h3>
      <button @click="addCurrent">+ 添加</button>
    </div>
    <div class="list" v-if="watchlist.length">
      <div
        v-for="w in watchlist" :key="w.symbol"
        class="item" :class="{ active: w.symbol === stock.symbol }"
        @click="stock.loadStock(w.symbol)"
      >
        <div class="info">
          <div class="sym">{{ w.symbol }}</div>
          <div class="name">{{ prices[w.symbol]?.name || '' }}</div>
        </div>
        <div class="price-info" v-if="prices[w.symbol]">
          <div class="price">{{ prices[w.symbol].regularMarketPrice?.toFixed(2) || '--' }}</div>
          <div class="change" :style="{ color: (prices[w.symbol].regularMarketPrice - prices[w.symbol].previousClose) >= 0 ? 'var(--green)' : 'var(--red)' }">
            {{ prices[w.symbol].regularMarketPrice && prices[w.symbol].previousClose ? ((prices[w.symbol].regularMarketPrice - prices[w.symbol].previousClose) >= 0 ? '+' : '') + (prices[w.symbol].regularMarketPrice - prices[w.symbol].previousClose).toFixed(2) : '--' }}
          </div>
        </div>
        <span class="remove" @click.stop="remove(w.symbol)">✕</span>
      </div>
    </div>
    <div v-else class="empty">暂无自选股<br>搜索股票后点击"+ 添加"</div>
  </div>
</template>

<style scoped>
.watchlist-tab { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
.header { padding: 14px 16px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
.header h3 { font-size: 13px; font-weight: 600; color: var(--text); }
.header button { background: var(--accent); color: white; border: none; padding: 4px 10px; border-radius: 6px; font-size: 11px; cursor: pointer; font-family: inherit; }
.list { flex: 1; overflow-y: auto; }
.item {
  padding: 12px 16px; border-bottom: 1px solid var(--border);
  cursor: pointer; display: flex; justify-content: space-between; align-items: center;
  transition: background 0.15s;
}
.item:hover { background: rgba(255,255,255,0.03); }
.item.active { background: rgba(41,98,255,0.12); border-left: 3px solid var(--accent); }
.info { flex: 1; }
.sym { font-weight: 700; font-size: 13px; }
.name { font-size: 11px; color: var(--text-secondary); margin-top: 1px; }
.price-info { text-align: right; }
.price { font-size: 14px; font-weight: 600; }
.change { font-size: 11px; margin-top: 2px; }
.remove { opacity: 0; color: var(--red); cursor: pointer; font-size: 14px; padding: 0 4px; transition: opacity 0.2s; }
.item:hover .remove { opacity: 0.6; }
.remove:hover { opacity: 1; }
.empty { padding: 32px; text-align: center; color: var(--text-secondary); font-size: 12px; }
</style>
