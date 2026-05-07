<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { usePortfolioStore } from '../../stores/portfolio'
import { useStockStore } from '../../stores/stock'
import AddHoldingModal from '../modal/AddHoldingModal.vue'

const portfolio = usePortfolioStore()
const stock = useStockStore()
const showModal = ref(false)
const donutCanvas = ref(null)

const donutColors = ['#2962ff','#00c853','#ffc107','#ef5350','#e040fb','#42a5f5','#26a69a','#ff7043','#ab47bc','#5c6bc0']

function drawDonut() {
  const canvas = donutCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const cx = 45, cy = 45, r = 35, ir = 18
  ctx.clearRect(0, 0, 90, 90)

  const total = portfolio.holdingsWithPL.reduce((s, h) => s + h.curValue, 0)
  if (total <= 0) return

  let angle = -Math.PI / 2
  portfolio.holdingsWithPL.forEach((h, i) => {
    const slice = (h.curValue / total) * Math.PI * 2
    ctx.beginPath()
    ctx.arc(cx, cy, r, angle, angle + slice)
    ctx.arc(cx, cy, ir, angle + slice, angle, true)
    ctx.closePath()
    ctx.fillStyle = donutColors[i % donutColors.length]
    ctx.fill()
    angle += slice
  })
}

watch(() => portfolio.holdingsWithPL, () => nextTick(drawDonut), { deep: true })

onMounted(async () => {
  await portfolio.refreshPrices()
  nextTick(drawDonut)
})
</script>

<template>
  <div class="portfolio-tab">
    <!-- Summary -->
    <div class="summary">
      <h4>📊 持仓总览</h4>
      <div class="cards">
        <div class="card"><div class="label">总投入</div><div class="val">${{ portfolio.totalInvest.toFixed(2) }}</div></div>
        <div class="card"><div class="label">当前市值</div><div class="val">${{ portfolio.totalValue.toFixed(2) }}</div></div>
        <div class="card full">
          <div class="label">总盈亏</div>
          <div class="val big" :style="{ color: portfolio.totalPL >= 0 ? 'var(--green)' : 'var(--red)' }">
            {{ portfolio.totalPL >= 0 ? '+' : '' }}${{ portfolio.totalPL.toFixed(2) }}
          </div>
          <div class="sub" :style="{ color: portfolio.totalPL >= 0 ? 'var(--green)' : 'var(--red)' }">
            {{ portfolio.totalPLPct >= 0 ? '+' : '' }}{{ portfolio.totalPLPct.toFixed(2) }}%
          </div>
        </div>
      </div>
    </div>

    <!-- Donut -->
    <div class="donut-row" v-if="portfolio.holdings.length > 0">
      <canvas ref="donutCanvas" width="90" height="90"></canvas>
      <div class="donut-legend">
        <div v-for="(h, i) in portfolio.holdingsWithPL" :key="h.id" class="legend-item">
          <span class="dot" :style="{ background: donutColors[i % donutColors.length] }"></span>
          <span class="sym">{{ h.symbol }}</span>
          <span class="pct">{{ (h.curValue / Math.max(1, portfolio.totalValue) * 100).toFixed(1) }}%</span>
        </div>
      </div>
    </div>

    <!-- Holdings list -->
    <div class="header">
      <h4>持仓明细</h4>
      <button @click="showModal = true">+ 添加持仓</button>
    </div>
    <div class="list" v-if="portfolio.holdings.length">
      <div v-for="h in portfolio.holdingsWithPL" :key="h.id" class="item">
        <div class="info" @click="stock.loadStock(h.symbol)" style="cursor:pointer;">
          <div class="sym">{{ h.symbol }}</div>
          <div class="detail">{{ h.quantity }}股 @ ${{ h.buyPrice.toFixed(2) }} | {{ h.buyDate }}</div>
        </div>
        <div class="pl">
          <div class="price">{{ h.curPrice ? '$'+h.curPrice.toFixed(2) : '--' }}</div>
          <div class="change" :style="{ color: h.pl >= 0 ? 'var(--green)' : 'var(--red)' }">
            {{ h.pl >= 0 ? '+' : '' }}${{ h.pl.toFixed(2) }} ({{ h.plPct >= 0 ? '+' : '' }}{{ h.plPct.toFixed(2) }}%)
          </div>
        </div>
        <span class="remove" @click="portfolio.removeHolding(h.id)">✕</span>
      </div>
    </div>
    <div v-else class="empty">暂无持仓记录<br>点击"+ 添加持仓"开始记录你的投资</div>

    <AddHoldingModal v-if="showModal" @close="showModal = false" @added="showModal = false; portfolio.refreshPrices()" />
  </div>
</template>

<style scoped>
.portfolio-tab { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
.summary { padding: 14px 16px; border-bottom: 1px solid var(--border); flex-shrink: 0; background: rgba(41,98,255,0.04); }
.summary h4 { font-size: 12px; color: var(--text-secondary); margin-bottom: 10px; letter-spacing: 1px; }
.cards { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.card { background: var(--bg); border-radius: 6px; padding: 10px; text-align: center; }
.card.full { grid-column: span 2; }
.label { font-size: 10px; color: var(--text-secondary); }
.val { font-size: 15px; font-weight: 700; margin-top: 3px; }
.val.big { font-size: 18px; }
.sub { font-size: 10px; margin-top: 2px; }

.donut-row { display: flex; align-items: center; gap: 16px; padding: 14px 16px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
.donut-row canvas { flex-shrink: 0; }
.donut-legend { font-size: 11px; flex: 1; }
.legend-item { display: flex; align-items: center; gap: 6px; margin-bottom: 5px; }
.dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
.sym { font-weight: 500; }
.pct { color: var(--text-secondary); margin-left: auto; }

.header { padding: 12px 16px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
.header h4 { font-size: 12px; font-weight: 600; color: var(--text); }
.header button { background: var(--accent); color: white; border: none; padding: 5px 12px; border-radius: 6px; font-size: 11px; cursor: pointer; font-family: inherit; }
.list { flex: 1; overflow-y: auto; }
.item {
  padding: 12px 16px; border-bottom: 1px solid var(--border);
  display: flex; justify-content: space-between; align-items: center;
  transition: background 0.15s;
}
.item:hover { background: rgba(255,255,255,0.02); }
.info { flex: 1; }
.info .sym { font-weight: 600; font-size: 13px; }
.detail { font-size: 10px; color: var(--text-secondary); }
.pl { text-align: right; }
.price { font-size: 13px; font-weight: 600; }
.change { font-size: 11px; }
.remove { opacity: 0; color: var(--red); cursor: pointer; font-size: 14px; padding: 0 4px; transition: opacity 0.2s; margin-left: 8px; }
.item:hover .remove { opacity: 0.6; }
.remove:hover { opacity: 1; }
.empty { padding: 32px; text-align: center; color: var(--text-secondary); font-size: 12px; }
</style>
