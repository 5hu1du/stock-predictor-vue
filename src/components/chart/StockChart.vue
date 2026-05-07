<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useStockStore } from '../../stores/stock'

const stock = useStockStore()
const chartRef = ref(null)
let chart = null

function buildOption() {
  if (!stock.rawData.length) return null

  // Use real trading dates from the data (index 5)
  const dates = stock.rawData.map((d, i) => {
    const ds = d[5]
    if (ds) {
      const parts = ds.split('-')
      if (parts.length === 3) return parts[1].replace(/^0/, '') + '/' + parts[2].replace(/^0/, '')
      return ds
    }
    const fallback = new Date()
    fallback.setDate(fallback.getDate() - (stock.rawData.length - i))
    return fallback.getMonth() + 1 + '/' + fallback.getDate()
  })

  const ohlc = stock.rawData.map(d => [d[0], d[3], d[2], d[1]])
  const volumes = stock.rawData.map(d => d[4])
  const closes = stock.closes
  const len = closes.length

  // MA lines
  const pad5 = len - stock.ma5.length
  const pad20 = len - stock.ma20.length

  // BB
  const padBB = len - stock.bb.length

  // Prediction overlay
  const predSeries = []
  if (stock.prediction?.predictions?.length) {
    const preds = stock.prediction.predictions
    const conf = stock.prediction.confidence
    const lastClose = closes[len - 1]

    // Main prediction line
    predSeries.push({
      name: '预测线',
      type: 'line',
      data: [...Array(len - 1).fill(null), lastClose, ...preds.map(p => p.value)],
      lineStyle: { color: '#00e5ff', type: 'dashed', width: 2.5 },
      symbol: 'none',
      z: 10,
      markPoint: {
        data: [{ name: '目标', coord: [len + preds.length - 1, preds[preds.length - 1].value], value: preds[preds.length - 1].value.toFixed(2), symbol: 'pin', symbolSize: 30, itemStyle: { color: '#00e5ff' }, label: { formatter: '{c}' } }],
      },
    })

    // Confidence bands
    if (conf?.length) {
      predSeries.push({
        name: '上轨',
        type: 'line',
        data: [...Array(len - 1).fill(null), lastClose, ...conf.map(c => c.upper)],
        lineStyle: { color: 'rgba(0,229,255,0.25)', type: 'dotted', width: 1 },
        symbol: 'none', z: 5,
      })
      predSeries.push({
        name: '下轨',
        type: 'line',
        data: [...Array(len - 1).fill(null), lastClose, ...conf.map(c => c.lower)],
        lineStyle: { color: 'rgba(0,229,255,0.25)', type: 'dotted', width: 1 },
        symbol: 'none', z: 5,
        areaStyle: { color: 'rgba(0,229,255,0.04)' },
      })
    }
  }

  return {
    backgroundColor: '#131722',
    grid: [
      { left: '10%', right: '6%', top: '8%', height: '50%' },
      { left: '10%', right: '6%', top: '66%', height: '22%' },
    ],
    xAxis: [
      { type: 'category', data: dates, gridIndex: 0, axisLine: { lineStyle: { color: '#2a2e39' } }, axisLabel: { color: '#787b86', fontSize: 10 }, splitLine: { show: false } },
      { type: 'category', data: dates, gridIndex: 1, axisLine: { lineStyle: { color: '#2a2e39' } }, axisLabel: { show: false }, splitLine: { show: false } },
    ],
    yAxis: [
      { type: 'value', gridIndex: 0, scale: true, splitLine: { lineStyle: { color: 'rgba(42,46,57,0.4)' } }, axisLabel: { color: '#787b86', fontSize: 10 } },
      { type: 'value', gridIndex: 1, axisLabel: { color: '#787b86', fontSize: 10, formatter: v => v > 1e6 ? (v/1e6).toFixed(0)+'M' : v > 1e3 ? (v/1e3).toFixed(0)+'K' : v.toString() }, splitLine: { show: false } },
    ],
    series: [
      {
        name: 'K线', type: 'candlestick', data: ohlc, xAxisIndex: 0, yAxisIndex: 0,
        itemStyle: { color: '#26a69a', color0: '#ef5350', borderColor: '#26a69a', borderColor0: '#ef5350' },
        markLine: { silent: true, symbol: 'none', lineStyle: { color: '#ffc107', type: 'dashed', width: 1 }, data: [], label: { show: false } },
      },
      { name: 'MA5', type: 'line', data: [...Array(pad5).fill(null), ...stock.ma5], xAxisIndex: 0, yAxisIndex: 0, symbol: 'none', lineStyle: { color: '#ffc107', width: 1.5 } },
      { name: 'MA20', type: 'line', data: [...Array(pad20).fill(null), ...stock.ma20], xAxisIndex: 0, yAxisIndex: 0, symbol: 'none', lineStyle: { color: '#e040fb', width: 1.5 } },
      { name: 'BB中', type: 'line', data: [...Array(padBB).fill(null), ...stock.bb.map(b => b.middle)], xAxisIndex: 0, yAxisIndex: 0, symbol: 'none', lineStyle: { color: 'rgba(255,255,255,0.2)', width: 1 } },
      { name: 'BB上', type: 'line', data: [...Array(padBB).fill(null), ...stock.bb.map(b => b.upper)], xAxisIndex: 0, yAxisIndex: 0, symbol: 'none', lineStyle: { color: 'rgba(255,255,255,0.1)', width: 1 } },
      { name: 'BB下', type: 'line', data: [...Array(padBB).fill(null), ...stock.bb.map(b => b.lower)], xAxisIndex: 0, yAxisIndex: 0, symbol: 'none', lineStyle: { color: 'rgba(255,255,255,0.1)', width: 1 } },
      {
        name: 'VOL', type: 'bar', xAxisIndex: 1, yAxisIndex: 1,
        data: volumes.map((v, i) => ({ value: v, itemStyle: { color: ohlc[i][3] >= ohlc[i][0] ? 'rgba(38,166,154,0.35)' : 'rgba(239,83,80,0.35)' } })),
      },
      ...predSeries,
    ],
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' }, backgroundColor: '#1e222d', borderColor: '#2a2e39', textStyle: { color: '#d1d4dc', fontSize: 12 } },
    dataZoom: [
      { type: 'inside', xAxisIndex: [0, 1], start: 50, end: 100 },
      { type: 'slider', xAxisIndex: [0, 1], start: 50, end: 100, height: 22, bottom: 4, borderColor: '#2a2e39', backgroundColor: '#1e222d', dataBackground: { lineStyle: { color: '#787b86' }, areaStyle: { color: 'rgba(120,123,134,0.15)' } }, handleStyle: { color: '#787b86' }, textStyle: { color: '#787b86', fontSize: 10 } },
    ],
    animation: true,
    animationDuration: 300,
  }
}

function initChart() {
  if (!chartRef.value) return
  if (chart) chart.dispose()
  chart = echarts.init(chartRef.value, null, { renderer: 'canvas' })
  updateChart()
}

function updateChart() {
  if (!chart) return
  const opt = buildOption()
  if (opt) chart.setOption(opt, true)
}

let resizeHandler = null

onMounted(() => {
  nextTick(initChart)
  resizeHandler = () => chart?.resize()
  window.addEventListener('resize', resizeHandler)
})

onUnmounted(() => {
  chart?.dispose()
  window.removeEventListener('resize', resizeHandler)
})

watch(() => [stock.rawData, stock.prediction, stock.loading], () => {
  if (!stock.loading) nextTick(updateChart)
}, { deep: true })
</script>

<template>
  <div class="chart-container">
    <div ref="chartRef" class="chart-el"></div>
    <div v-if="stock.loading" class="overlay">
      <div class="spinner"></div>
      <div>
        <div>正在加载 {{ stock.symbol }}</div>
        <div class="sub">数据源: 腾讯财经</div>
      </div>
    </div>
    <div v-else-if="stock.error && !stock.rawData.length" class="overlay error">
      <div>❌ {{ stock.error }}</div>
      <div class="sub">请尝试其他股票代码 (如 AAPL, 600519.SS, 0700.HK)</div>
    </div>
  </div>
</template>

<style scoped>
.chart-container { flex: 1; position: relative; min-height: 0; }
.chart-el { width: 100%; height: 100%; }
.overlay {
  position: absolute; inset: 0;
  background: rgba(19,23,34,0.88); display: flex;
  flex-direction: column; gap: 10px;
  align-items: center; justify-content: center;
  z-index: 50; font-size: 15px; color: var(--text);
}
.overlay.error { color: var(--red); }
.sub { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
.spinner {
  width: 32px; height: 32px;
  border: 3px solid var(--border); border-top-color: var(--accent);
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
