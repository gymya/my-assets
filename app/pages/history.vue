<script setup lang="ts">
  import { monthlyChange, previousMonth } from '../../shared/finance';
  const store = usePortfolioStore();
  const rows = computed(() =>
    [...store.history]
      .reverse()
      .map((snapshot) => ({
        ...snapshot,
        change: monthlyChange(
          snapshot.netWorthTwd,
          store.history.find((item) => item.yearMonth === previousMonth(snapshot.yearMonth))?.netWorthTwd,
        ),
      })),
  );
</script>
<template>
  <div class="page-content">
    <div class="page-heading">
      <div>
        <h1>資產趨勢</h1>
        
      </div>
      <span class="outline-badge"><AppIcon name="calendar" :size="16" />每月紀錄</span>
    </div>
    <TrendChart :snapshots="store.history" tall />
    <section class="panel history-panel">
      <div class="section-heading">
        <h2>每月紀錄</h2>
        <span class="small-label">{{ rows.length }} 個月份</span>
      </div>
      <div v-if="rows.length" class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>月份</th>
              <th>總資產</th>
              <th>總負債</th>
              <th>淨資產</th>
              <th>淨資產變化</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td>{{ row.yearMonth.replace('-', ' / ') }}</td>
              <td>{{ store.money(row.totalAssetsTwd) }}</td>
              <td>{{ store.money(row.totalLiabilitiesTwd) }}</td>
              <td class="strong">{{ store.money(row.netWorthTwd) }}</td>
              <td :class="row.change && row.change.amount < 0 ? 'negative-text' : 'positive-text'">
                {{ row.change ? store.money(row.change.amount, true) : '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="list-empty"><p>新增資產後，系統會自動留下當月紀錄。</p></div>
    </section>
    <div class="explanation-card">
      <AppIcon name="info" />
      <div>
        <strong>淨資產變化，不等於投資報酬</strong>
        <p>
          存提款、手動調整餘額、行情與負債變動，都會影響淨資產。每月保留最後一筆完整估值；未使用的月份不補算，歷史金額也不會隨今日行情改變。
        </p>
      </div>
    </div>
  </div>
</template>
