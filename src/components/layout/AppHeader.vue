<script setup>
import { ref } from 'vue'
import { useStockStore } from '../../stores/stock'

const stock = useStockStore()
const query = ref('')
const suggestions = ref([])
const showSuggestions = ref(false)
let searchTimer = null

const timeframes = [
  { key: '1d', label: '1天' },
  { key: '5d', label: '5天' },
  { key: '1mo', label: '1月' },
  { key: '3mo', label: '3月' },
  { key: '6mo', label: '6月' },
  { key: '1y', label: '1年' },
  { key: '5y', label: '5年' },
]

function onSearchInput() {
  clearTimeout(searchTimer)
  const q = query.value.trim()
  if (q.length < 1) { showSuggestions.value = false; return }
  searchTimer = setTimeout(async () => {
    suggestions.value = await stock.searchStocks(q)
    showSuggestions.value = true
  }, 300)
}

function selectSuggestion(sym) {
  showSuggestions.value = false
  query.value = sym
  stock.loadStock(sym)
}

function onSearchEnter() {
  const q = query.value.trim()
  if (q) {
    showSuggestions.value = false
    stock.loadStock(q)
  }
}

function changeTF(tf) {
  stock.changeTimeframe(tf)
}
</script>

<template>
  <header>
    <div class="brand">
      <div class="logo">📈</div>
      <div>
        <h1>StockScope</h1>
        <div class="tagline">智能股市分析预测平台</div>
      </div>
    </div>

    <div class="search-area">
      <input
        v-model="query"
        placeholder="搜索股票代码...（如 AAPL, 0700.HK, 600519.SS）"
        @input="onSearchInput"
        @keydown.enter="onSearchEnter"
        @focus="query.length >= 1 && suggestions.length > 0 && (showSuggestions = true)"
      />
      <div class="suggestions" :class="{ show: showSuggestions && suggestions.length > 0 }">
        <div v-if="suggestions.length === 0" class="suggestion-item">
          <span class="name">按 Enter 直接搜索</span>
        </div>
        <div
          v-for="s in suggestions" :key="s.symbol"
          class="suggestion-item"
          @click="selectSuggestion(s.symbol)"
        >
          <div><span class="sym">{{ s.symbol }}</span><span class="name">{{ s.shortname || s.longname }}</span></div>
          <span class="exchange">{{ s.exchange }}</span>
        </div>
      </div>
    </div>

    <div class="timeframe-bar">
      <button
        v-for="tf in timeframes" :key="tf.key"
        :class="{ active: stock.timeframe === tf.key }"
        @click="changeTF(tf.key)"
      >{{ tf.label }}</button>
    </div>
  </header>
</template>

<style scoped>
header {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 10px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  z-index: 100;
}
.brand { display: flex; align-items: center; gap: 12px; }
.logo {
  width: 36px; height: 36px;
  background: linear-gradient(135deg, #2962ff, #00c853);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 900; font-size: 18px; color: white;
}
.brand h1 { font-size: 16px; font-weight: 700; letter-spacing: 0.5px; color: var(--text); }
.tagline { font-size: 10px; color: var(--text-secondary); }

.search-area { display: flex; align-items: center; gap: 10px; position: relative; }
.search-area input {
  width: 320px; padding: 8px 14px;
  border: 1px solid var(--border); border-radius: 8px;
  background: var(--bg); color: var(--text);
  font-size: 13px; outline: none; font-family: inherit;
  transition: border-color 0.2s;
}
.search-area input:focus { border-color: var(--accent); }
.search-area input::placeholder { color: var(--text-secondary); }

.suggestions {
  position: absolute; top: 100%; left: 0; right: 0;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 0 0 8px 8px; max-height: 300px; overflow-y: auto;
  z-index: 1000; display: none; box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
.suggestions.show { display: block; }
.suggestion-item {
  padding: 10px 14px; cursor: pointer;
  display: flex; justify-content: space-between; align-items: center;
  transition: background 0.15s; border-bottom: 1px solid var(--border);
}
.suggestion-item:last-child { border-bottom: none; }
.suggestion-item:hover { background: rgba(41,98,255,0.15); }
.sym { font-weight: 600; color: var(--text); }
.name { font-size: 12px; color: var(--text-secondary); margin-left: 8px; }
.exchange { font-size: 10px; color: var(--text-secondary); background: var(--bg); padding: 2px 6px; border-radius: 4px; }

.timeframe-bar { display: flex; gap: 4px; }
.timeframe-bar button {
  padding: 5px 12px; border: 1px solid var(--border); border-radius: 6px;
  background: transparent; color: var(--text-secondary);
  font-size: 11px; cursor: pointer; font-family: inherit; font-weight: 500;
  transition: all 0.2s;
}
.timeframe-bar button:hover { border-color: var(--accent); color: var(--text); }
.timeframe-bar button.active { background: var(--accent); border-color: var(--accent); color: white; }
@media (max-width: 900px) { .search-area input { width: 180px; } }
</style>
