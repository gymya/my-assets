<script setup lang="ts">
  import { backupSchema } from '../../shared/schemas';
  import type { Backup } from '../../shared/schemas';
  import { formatDate } from '../../shared/finance';
  const store = usePortfolioStore();
  const fileInput = ref<HTMLInputElement>();
  const candidate = ref<Backup | null>(null);
  const message = ref('');
  const error = ref('');
  const busy = ref(false);
  async function chooseFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    error.value = '';
    message.value = '';
    if (!file) return;
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error('File too large');
      candidate.value = backupSchema.parse(JSON.parse(await file.text()));
    } catch {
      error.value = '無法匯入：檔案格式、版本或資料內容不正確，或檔案超過 20 MB。現有資料未變更。';
    }
    input.value = '';
  }
  async function restore() {
    if (!candidate.value) return;
    busy.value = true;
    try {
      await store.importBackup(candidate.value);
      candidate.value = null;
      message.value = '資料已成功還原。';
    } catch {
      candidate.value = null;
      error.value = '還原失敗，現有資料未變更。請稍後再試。';
    } finally {
      busy.value = false;
    }
  }
  async function exportData() {
    busy.value = true;
    error.value = '';
    message.value = '';
    try {
      await store.exportBackup();
      message.value = '已建立備份下載，請妥善保存 JSON 檔案。';
    } catch {
      error.value = '無法匯出資料，請稍後再試。';
    } finally {
      busy.value = false;
    }
  }
</script>
<template>
  <div class="page-content">
    <div class="page-heading">
      <div>
        <h1>設定與備份</h1>
        
      </div>
    </div>
    <div v-if="message" class="notice success" role="status"><AppIcon name="check" />{{ message }}</div>
    <div v-if="error" class="notice error" role="alert">{{ error }}</div>
    <div class="settings-grid">
      <section class="panel settings-panel">
        <span class="settings-icon"><AppIcon name="storage" :size="26" /></span>
        <h2>資料備份</h2>
        <p>所有帳戶、持股、負債與歷史紀錄，<br />一次備份到你的裝置。</p>
        <div class="backup-meta">
          <span>上次匯出</span
          ><strong>{{
            store.data.settings.lastExportAt ? formatDate(store.data.settings.lastExportAt) : '尚未匯出'
          }}</strong>
        </div>
        <button class="button primary full-width" :disabled="busy" @click="exportData">
          <AppIcon name="download" :size="18" />匯出資料</button
        ><button class="button secondary full-width" :disabled="busy || store.refreshing" @click="fileInput?.click()">
          <AppIcon name="upload" :size="18" />匯入資料</button
        ><input
          ref="fileInput"
          type="file"
          accept=".json,application/json"
          class="sr-only"
          aria-label="選擇備份檔案"
          @change="chooseFile"
        />
        <p class="field-note">備份包含完整財務資料，請保存於安全的位置。清除瀏覽器資料會移除本機紀錄。</p>
      </section>
      <div class="settings-right">
        <section class="panel">
          <div class="section-heading"><h2>顯示設定</h2></div>
          <div class="setting-row">
            <div>
              <strong>隱藏金額</strong>
              <p>在畫面上遮蔽資產金額</p>
            </div>
            <USwitch
              :model-value="store.data.settings.hideBalances"
              aria-label="隱藏金額"
              @update:model-value="store.togglePrivacy().catch(() => undefined)"
            />
          </div>
          <div class="setting-row">
            <div>
              <strong>基準幣別</strong>
              <p>所有資產統一換算為新臺幣</p>
            </div>
            <span class="outline-badge">TWD</span>
          </div>
          <div class="setting-row">
            <div>
              <strong>深色模式</strong>
              <p>{{ store.data.settings.theme === 'dark' ? '使用深色外觀' : '使用淺色外觀' }}</p>
            </div>
            <USwitch
              :model-value="store.data.settings.theme === 'dark'"
              :disabled="store.saving"
              aria-label="深色模式"
              @update:model-value="(value) => store.setTheme(value ? 'dark' : 'light').catch(() => undefined)"
            />
          </div>
        </section>
        <section class="panel market-settings">
          <div class="section-heading">
            <h2>行情與匯率</h2>
            <button class="icon-button" aria-label="更新行情" :disabled="store.refreshing" @click="store.refreshMarket">
              <AppIcon name="refresh" :class="{ spinning: store.refreshing }" />
            </button>
          </div>
          <div class="setting-row">
            <div>
              <strong>每日參考匯率</strong>
              <p>
                {{ store.data.exchangeRates ? `資料日期 ${formatDate(store.data.exchangeRates.date)}` : '尚無資料' }}
              </p>
            </div>
            <span class="small-label">期交所</span>
          </div>
          <div v-if="store.data.exchangeRates" class="rate-grid">
            <div>
              <span>1 美元</span><strong>NT${{ store.data.exchangeRates.rates.USD.toFixed(4) }}</strong>
            </div>
            <div>
              <span>1 日圓</span><strong>NT${{ store.data.exchangeRates.rates.JPY.toFixed(4) }}</strong>
            </div>
          </div>
          <p class="panel-footnote">
            依每日參考匯率估算，非銀行實際換匯匯率。台股使用證交所每日收盤行情，更新日期顯示於各筆持股。
          </p>
        </section>
      </div>
    </div>
    <div class="explanation-card">
      <AppIcon name="shield" />
      <div>
        <strong>資料儲存方式</strong>
        <p>
          財務資料只儲存在這個瀏覽器，不會上傳或跨裝置同步。首次連線載入後，可將應用程式加入主畫面；離線時使用上次取得的行情。
        </p>
      </div>
    </div>
    <UModal
      :open="!!candidate"
      title="還原備份資料"
      description="匯入會取代這台裝置目前的所有資料，建議先匯出現有資料。"
      :close="false"
      @update:open="
        (value) => {
          if (!value && !busy) candidate = null;
        }
      "
      ><template #body
        ><div v-if="candidate" class="import-summary">
          <p>備份日期：{{ formatDate(candidate.exportedAt) }}</p>
          <p>
            {{ candidate.data.accounts.length }} 個帳戶 · {{ candidate.data.stocks.length }} 筆持股 ·
            {{ candidate.data.liabilities.length }} 筆負債
          </p>
          <p>{{ candidate.data.snapshots.length }} 筆歷史紀錄</p>
        </div></template
      ><template #footer
        ><div class="modal-footer">
          <div class="button-row">
            <button class="button secondary" :disabled="busy" @click="candidate = null">取消</button
            ><button class="button primary" :disabled="busy" @click="restore">
              {{ busy ? '還原中…' : '確認取代並還原' }}
            </button>
          </div>
        </div></template
      ></UModal
    >
  </div>
</template>
