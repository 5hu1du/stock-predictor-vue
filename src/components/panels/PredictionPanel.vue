<script setup>
import { computed } from 'vue'
import { useStockStore } from '../../stores/stock'

const stock = useStockStore()

const predInfo = computed(() => {
  if (!stock.prediction?.predictions?.length) return null
  const p = stock.prediction
  const first = p.predictions[0].value
  const last = p.predictions[p.predictions.length - 1].value
  const conf = p.confidence
  const lastConf = conf?.[conf.length - 1]
  return { first, last, trend: last >= first ? 'up' : 'down', lastConf, predictions: p.predictions }
})
</script>

<template>
  <div class="panel">
    <h4>🔮 趋势预测（线性回归）</h4>
    <div v-if="stock.loading" style="color:var(--text-secondary);font-size:12px;">加载中...</div>
    <div v-else-if="predInfo" class="prediction-stats">
      <div class="pred-stat">
        <div class="label">趋势方向</div>
        <div class="value" :style="{ color: predInfo.trend === 'up' ? 'var(--green)' : 'var(--red)' }">
          {{ predInfo.trend === 'up' ? '📈 看涨' : '📉 看跌' }}
        </div>
      </div>
      <div class="pred-stat">
        <div class="label">当前价</div>
        <div class="value">{{ predInfo.first.toFixed(2) }}</div>
      </div>
      <div class="pred-stat">
        <div class="label">20日预测目标</div>
        <div class="value">{{ predInfo.last.toFixed(2) }}</div>
      </div>
      <div class="pred-stat" v-if="predInfo.lastConf">
        <div class="label">置信上轨</div>
        <div class="value" style="color:var(--green)">{{ predInfo.lastConf.upper.toFixed(2) }}</div>
      </div>
      <div class="pred-stat" v-if="predInfo.lastConf">
        <div class="label">置信下轨</div>
        <div class="value" style="color:var(--red)">{{ predInfo.lastConf.lower.toFixed(2) }}</div>
      </div>
    </div>
    <div v-else style="color:var(--text-secondary);font-size:12px;">
      {{ stock.error ? '数据加载失败，无法预测' : '数据不足，需要更多历史数据' }}
    </div>
  </div>
</template>

<style scoped>
.panel { flex: 1; border-right: 1px solid var(--border); padding: 14px 20px; overflow-y: auto; }
.panel h4 { font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
.prediction-stats { display: flex; gap: 14px; flex-wrap: wrap; }
.pred-stat { flex: 1; min-width: 80px; }
.pred-stat .label { font-size: 10px; color: var(--text-secondary); }
.pred-stat .value { font-size: 15px; font-weight: 700; margin-top: 3px; }
@media (max-width: 900px) { .panel { border-right: none; border-bottom: 1px solid var(--border); } }
</style>
