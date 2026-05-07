<script setup>
import { useStockStore } from '../../stores/stock'

const stock = useStockStore()
</script>

<template>
  <div class="panel">
    <h4>📊 技术信号</h4>
    <div v-if="stock.signals.length">
      <div v-for="(s, i) in stock.signals" :key="i" class="signal-row">
        <span class="signal-dot" :class="'signal-' + s.type"></span>
        {{ s.text }}
      </div>
    </div>
    <div v-else style="color:var(--text-secondary);font-size:12px;">搜索股票以查看信号</div>
  </div>
</template>

<style scoped>
.panel { flex: 1; border-right: 1px solid var(--border); padding: 14px 20px; overflow-y: auto; }
.panel h4 { font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
.signal-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.04); }
.signal-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.signal-buy { background: var(--green); }
.signal-sell { background: var(--red); }
.signal-neutral { background: var(--gold); }
@media (max-width: 900px) { .panel { border-right: none; border-bottom: 1px solid var(--border); } }
</style>
