<script setup lang="ts">
import { accountInputSchema, stockInputSchema, liabilityInputSchema } from '../../shared/schemas'
import type { Currency } from '../../shared/schemas'
const store = usePortfolioStore()
const editor = store.editor!
const existing = editor.kind === 'account' ? store.data.accounts.find(item => item.id === editor.id) : editor.kind === 'stock' ? store.data.stocks.find(item => item.id === editor.id) : store.data.liabilities.find(item => item.id === editor.id)
const form = reactive({ name: existing && 'name' in existing ? existing.name : '', currency: existing && 'currency' in existing ? existing.currency : 'TWD' as Currency, amount: existing && 'balance' in existing ? String(existing.balance) : existing && 'amount' in existing ? String(existing.amount) : '', symbol: existing && 'symbol' in existing ? existing.symbol : '', shares: existing && 'shares' in existing ? String(existing.shares) : '' })
const error = ref('')
const deleting = ref(false)
const label = editor.kind === 'account' ? '帳戶' : editor.kind === 'stock' ? '台股持股' : '負債'
const close = () => { if (!store.saving) store.editor = null }
async function submit() {
  error.value = ''
  try {
    if (editor.kind === 'account') {
      const result = accountInputSchema.safeParse({ name: form.name, type: 'bank', currency: form.currency, balance: String(form.amount).trim() === '' ? NaN : Number(form.amount) })
      if (!result.success) { error.value = '請確認名稱與餘額，餘額須為 0 以上的有效數字。'; return }
      await store.saveAccount(result.data, editor.id)
    } else if (editor.kind === 'stock') {
      const result = stockInputSchema.safeParse({ symbol: form.symbol.trim().toUpperCase(), shares: String(form.shares).trim() === '' ? NaN : Number(form.shares) })
      if (!result.success) { error.value = '請輸入有效台股代號與 0 以上的整數股數。'; return }
      await store.saveStock(result.data, editor.id)
    } else {
      const result = liabilityInputSchema.safeParse({ name: form.name, currency: form.currency, amount: String(form.amount).trim() === '' ? NaN : Number(form.amount) })
      if (!result.success) { error.value = '請確認名稱與金額，金額須為 0 以上的有效數字。'; return }
      await store.saveLiability(result.data, editor.id)
    }
    close()
  } catch (cause) { if (import.meta.dev) console.error('Editor save failed', cause); error.value = '儲存失敗，請稍後再試。原有資料仍保留。' }
}
async function remove() {
  try { await store.remove(editor.kind, editor.id!); close() }
  catch { error.value = '刪除失敗，請稍後再試。' }
}
</script>
<template>
  <UModal :open="true" :title="`${editor.id ? '編輯' : '新增'}${label}`" :description="editor.kind === 'stock' ? '輸入實際持有股數，1 張等於 1,000 股。' : '輸入目前金額。'" :close="false" @update:open="value => { if (!value) close() }">
    <template #body>
      <form id="asset-form" class="editor-form" @submit.prevent="submit">
        <template v-if="editor.kind === 'stock'">
          <StockSearch v-model="form.symbol" />
          <label>持有股數<div class="input-unit"><input v-model="form.shares" name="shares" type="number" min="0" max="1000000000" step="1" inputmode="numeric" placeholder="0" required/><span>股</span></div></label>
          <p class="field-note">使用證交所上市股票與 ETF 每日收盤價估值，不含上櫃股票。行情非即時，無可用股價時會標示待估值。</p>
        </template>
        <template v-else>
          <label>{{ editor.kind === 'account' ? '帳戶名稱' : '負債名稱' }}<input v-model="form.name" name="name" :placeholder="editor.kind === 'account' ? '例如 國泰銀行' : '例如 信用卡、車貸'" maxlength="60" required autofocus/></label>
          
          <div class="form-columns"><label>幣別<select v-model="form.currency" name="currency"><option value="TWD">TWD 新臺幣</option><option value="USD">USD 美元</option><option value="JPY">JPY 日圓</option></select></label><label>{{ editor.kind === 'account' ? '目前餘額' : '未償還金額' }}<input v-model="form.amount" name="amount" type="number" min="0" max="1000000000000" step="any" inputmode="decimal" placeholder="0" required/></label></div>
          <p v-if="form.currency !== 'TWD'" class="field-note">外幣金額依每日參考匯率估算，與銀行實際換匯金額可能不同。</p>
        </template>
        <p v-if="error" role="alert" class="form-error">{{ error }}</p>
        <div v-if="deleting" class="delete-confirm"><p>確定刪除此{{ label }}？過去月份的紀錄會保留。</p><div class="button-row"><button type="button" class="button danger" :disabled="store.saving" @click="remove">確認刪除</button><button type="button" class="button secondary" @click="deleting = false">保留</button></div></div>
      </form>
    </template>
    <template #footer><div class="modal-footer"><button v-if="editor.id && !deleting" class="icon-button delete-button" aria-label="刪除此項目" :disabled="store.saving" @click="deleting = true"><AppIcon name="trash"/></button><div class="button-row"><button class="button secondary" :disabled="store.saving" @click="close">取消</button><button class="button primary" form="asset-form" type="submit" :disabled="store.saving">{{ store.saving ? '儲存中…' : '儲存' }}</button></div></div></template>
  </UModal>
</template>
