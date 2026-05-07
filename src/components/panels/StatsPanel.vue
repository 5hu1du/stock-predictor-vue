<script setup>
import { useStockStore } from '../../stores/stock'
import { formatMarketCap } from '../../utils/format'

const stock = useStockStore()
</script>

<template>
  <div class="panel">
    <h4>📋 关键指标</h4>
    <div v-if="stock.meta" class="stat-grid">
      <div class="stat-item"><span class="key">52周最高</span><span class="val">{{ stock.meta.fiftyTwoWeekHigh?.toFixed(2) || '--' }}</span></div>
      <div class="stat-item"><span class="key">52周最低</span><span class="val">{{ stock.meta.fiftyTwoWeekLow?.toFixed(2) || '--' }}</span></div>
      <div class="stat-item"><span class="key">市值</span><span class="val">{{ formatMarketCap(stock.meta.marketCap) }}</span></div>
      <div class="stat-item"><span class="key">交易所</span><span class="val">{{ stock.exchange || '--' }}</span></div>
      <div class="stat-item"><span class="key">RSI(14)</span><span class="val">{{ stock.rsi.toFixed(1) }}</span></div>
      <div class="stat-item"><span class="key">波动率</span><span class="val">{{ stock.volatility.toFixed(2) }}%</span></div>
      <div class="stat-item"><span class="key">预测趋势</span><span class="val" :style="{color: stock.prediction ? (stock.prediction.predictions[0] < stock.prediction.predictions[stock.prediction.predictions.length-1] ? 'var(--green)' : 'var(--red)') : 'var(--text-secondary)'}">{{ stock.prediction ? (stock.prediction.predictions[0] < stock.prediction.predictions[stock.prediction.predictions.length-1] ? '看涨' : '看跌') : '--' }}</span></div>
      <div class="stat-item"><span class="key">数据点</span><span class="val">{{ stock.rawData.length }}</span></div>
    </div>
    <div v-else style="color:var(--text-secondary);font-size:12px;">搜索股票以查看指标</div>
  </div>
</template>

<style scoped>
.panel { flex: 1; border-right: 1px solid var(--border); padding: 14px 20px; overflow-y: auto; }
.panel:last-child { border-right: none; }
.panel h4 { font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
.stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; }
.stat-item { display: flex; justify-content: space-between; font-size: 12px; }
.key { color: var(--text-secondary); }
.val { font-weight: 500; }
@media (max-width: 900px) { .panel { border-right: none; border-bottom: 1px solid var(--border); } }
</style>
