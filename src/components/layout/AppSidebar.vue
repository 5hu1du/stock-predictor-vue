<script setup>
import { ref } from 'vue'
import WatchlistTab from '../tabs/WatchlistTab.vue'
import HotStocksTab from '../tabs/HotStocksTab.vue'
import PortfolioTab from '../tabs/PortfolioTab.vue'
import MarketTab from '../tabs/MarketTab.vue'

const activeTab = ref('watchlist')
const tabs = [
  { key: 'watchlist', label: '⭐ 自选' },
  { key: 'hot', label: '🔥 热门' },
  { key: 'portfolio', label: '💰 持仓' },
  { key: 'market', label: '📊 市场' },
]
</script>

<template>
  <aside class="sidebar">
    <nav class="tab-nav">
      <button
        v-for="tab in tabs" :key="tab.key"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >{{ tab.label }}</button>
    </nav>
    <WatchlistTab v-if="activeTab === 'watchlist'" />
    <HotStocksTab v-if="activeTab === 'hot'" />
    <PortfolioTab v-if="activeTab === 'portfolio'" />
    <MarketTab v-if="activeTab === 'market'" />
  </aside>
</template>

<style scoped>
.sidebar {
  width: 320px; background: var(--surface); border-right: 1px solid var(--border);
  display: flex; flex-direction: column; flex-shrink: 0; overflow: hidden;
}
.tab-nav {
  display: flex; border-bottom: 1px solid var(--border); flex-shrink: 0;
}
.tab-nav button {
  flex: 1; padding: 10px 0; border: none; background: transparent;
  color: var(--text-secondary); font-size: 11px; cursor: pointer;
  font-family: inherit; font-weight: 500; transition: all 0.2s;
  border-bottom: 2px solid transparent;
}
.tab-nav button:hover { color: var(--text); background: rgba(255,255,255,0.02); }
.tab-nav button.active { color: var(--accent); border-bottom-color: var(--accent); background: rgba(41,98,255,0.06); }
@media (max-width: 900px) { .sidebar { display: none; } }
</style>
