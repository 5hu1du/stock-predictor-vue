<script setup>
import { ref } from 'vue'
import { usePortfolioStore } from '../../stores/portfolio'
import { useStockStore } from '../../stores/stock'
import { fetchPriceSnapshot } from '../../composables/useStockApi'

const emit = defineEmits(['close', 'added'])
const portfolio = usePortfolioStore()
const stock = useStockStore()

const symbol = ref(stock.symbol || '')
const price = ref('')
const qty = ref('')
const date = ref(new Date().toISOString().slice(0, 10))
const error = ref('')

async function submit() {
  error.value = ''
  const sym = symbol.value.trim().toUpperCase()
  const buyPrice = parseFloat(price.value)
  const quantity = parseInt(qty.value)
  const buyDate = date.value

  if (!sym) { error.value = '请输入股票代码'; return }
  if (!buyPrice || buyPrice <= 0) { error.value = '请输入有效的买入价格'; return }
  if (!quantity || quantity <= 0) { error.value = '请输入有效的数量'; return }
  if (!buyDate) { error.value = '请选择买入日期'; return }

  const meta = await fetchPriceSnapshot(sym)
  const name = meta?.name || sym

  portfolio.addHolding({ symbol: sym, name, buyPrice, quantity, buyDate })
  emit('added')
  emit('close')
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal">
      <h3>➕ 添加持仓</h3>
      <div v-if="error" style="color:var(--red);font-size:12px;margin-bottom:12px;">{{ error }}</div>
      <div class="form-group">
        <label>股票代码</label>
        <input v-model="symbol" placeholder="如 AAPL, 600519.SS, 0700.HK" @keydown.enter="submit">
      </div>
      <div class="row">
        <div class="form-group">
          <label>买入价格</label>
          <input v-model="price" type="number" step="0.01" placeholder="0.00">
        </div>
        <div class="form-group">
          <label>数量(股)</label>
          <input v-model="qty" type="number" step="1" placeholder="0">
        </div>
      </div>
      <div class="form-group">
        <label>买入日期</label>
        <input v-model="date" type="date">
      </div>
      <div class="actions">
        <button class="btn-cancel" @click="emit('close')">取消</button>
        <button class="btn-primary" @click="submit">确认添加</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  z-index: 2000; display: flex; align-items: center; justify-content: center;
}
.modal {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 12px; padding: 24px; width: 380px; max-width: 90vw;
  box-shadow: 0 16px 48px rgba(0,0,0,0.5);
}
.modal h3 { font-size: 16px; margin-bottom: 18px; color: var(--text); }
.form-group { margin-bottom: 14px; }
.form-group label { display: block; font-size: 11px; color: var(--text-secondary); margin-bottom: 6px; letter-spacing: 0.5px; text-transform: uppercase; }
.form-group input {
  width: 100%; padding: 9px 12px; border: 1px solid var(--border); border-radius: 8px;
  background: var(--bg); color: var(--text); font-size: 13px; outline: none; font-family: inherit;
  transition: border-color 0.2s;
}
.form-group input:focus { border-color: var(--accent); }
.row { display: flex; gap: 10px; }
.row .form-group { flex: 1; }
.actions { display: flex; gap: 10px; margin-top: 20px; }
.actions button { flex: 1; padding: 10px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; }
.btn-cancel { background: transparent; border: 1px solid var(--border); color: var(--text-secondary); }
.btn-cancel:hover { border-color: var(--text); color: var(--text); }
.btn-primary { background: var(--accent); border: none; color: white; }
.btn-primary:hover { opacity: 0.9; }
</style>
