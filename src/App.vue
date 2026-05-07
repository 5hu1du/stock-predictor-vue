<script setup>
import { onMounted } from 'vue'
import { useStockStore } from './stores/stock'
import AppHeader from './components/layout/AppHeader.vue'
import AppSidebar from './components/layout/AppSidebar.vue'
import ChartHeader from './components/chart/ChartHeader.vue'
import StockChart from './components/chart/StockChart.vue'
import SignalsPanel from './components/panels/SignalsPanel.vue'
import PredictionPanel from './components/panels/PredictionPanel.vue'
import StatsPanel from './components/panels/StatsPanel.vue'

const stock = useStockStore()

onMounted(() => {
  stock.loadStock('AAPL')
})
</script>

<template>
  <AppHeader />
  <div class="main-container">
    <AppSidebar />
    <div class="chart-area">
      <ChartHeader />
      <StockChart />
      <div class="bottom-panels">
        <SignalsPanel />
        <PredictionPanel />
        <StatsPanel />
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-container { display: flex; flex: 1; overflow: hidden; }
.chart-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.bottom-panels {
  display: flex; border-top: 1px solid var(--border);
  flex-shrink: 0; height: 180px;
}
@media (max-width: 900px) {
  .bottom-panels { flex-direction: column; height: auto; }
}
</style>
