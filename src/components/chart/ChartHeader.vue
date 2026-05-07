<script setup>
import { computed } from 'vue'
import { useStockStore } from '../../stores/stock'
import { formatVolume } from '../../utils/format'

const stock = useStockStore()

const priceDisplay = computed(() => {
  const p = stock.currentPrice
  if (p == null) return '---'
  const sym = stock.currency === 'CNY' ? '¥' : stock.currency === 'HKD' ? 'HK$' : '$'
  return sym + p.toFixed(2)
})

const changeDisplay = computed(() => {
  const c = stock.change
  if (!c) return { text: '---', cls: '' }
  const sign = c.val >= 0 ? '+' : ''
  return {
    text: `${sign}${c.val.toFixed(2)} (${sign}${c.pct.toFixed(2)}%)`,
    cls: c.val >= 0 ? 'change-up' : 'change-down',
  }
})
</script>

<template>
  <div class="price-header" v-if="stock.meta && !stock.loading">
    <div>
      <div style="display:flex;align-items:baseline;gap:12px;">
        <span class="current-price">{{ priceDisplay }}</span>
        <span :class="changeDisplay.cls" style="font-size:14px;font-weight:600;padding:4px 10px;border-radius:6px;">{{ changeDisplay.text }}</span>
      </div>
      <div class="meta-line">
        <span>昨收: {{ stock.meta.previousClose?.toFixed(2) || '--' }}</span>
        <span>最高: {{ stock.meta.regularMarketDayHigh?.toFixed(2) || '--' }}</span>
        <span>最低: {{ stock.meta.regularMarketDayLow?.toFixed(2) || '--' }}</span>
        <span>量: {{ formatVolume(stock.meta.regularMarketVolume) }}</span>
        <span class="source-tag">{{ stock.dataSource === 'yahoo' ? 'Yahoo' : '腾讯' }}</span>
      </div>
    </div>
  </div>
  <div v-else-if="stock.loading" class="price-header">
    <div class="loading-text">
      <div class="spinner"></div> 正在加载 {{ stock.symbol }} ...
    </div>
  </div>
  <div v-else class="price-header">
    <div class="error-text">{{ stock.error || '加载失败，请尝试其他股票代码' }}</div>
  </div>
</template>

<style scoped>
.price-header { padding: 16px 24px; flex-shrink: 0; min-height: 60px; }
.current-price { font-size: 36px; font-weight: 700; letter-spacing: -1px; }
.change-up { color: var(--green); background: rgba(38,166,154,0.1); }
.change-down { color: var(--red); background: rgba(239,83,80,0.1); }
.meta-line { font-size: 12px; color: var(--text-secondary); margin-top: 6px; display: flex; gap: 16px; align-items: center; }
.source-tag { background: var(--bg); padding: 2px 8px; border-radius: 4px; font-size: 10px; color: var(--accent); border: 1px solid var(--border); }
.loading-text { color: var(--text-secondary); display: flex; align-items: center; gap: 10px; font-size: 14px; }
.error-text { color: var(--red); font-size: 14px; }
.spinner { width: 20px; height: 20px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
