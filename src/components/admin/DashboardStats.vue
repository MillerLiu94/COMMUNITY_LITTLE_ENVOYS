<template>
  <div class="stats-dashboard">
    <div v-if="loading" class="stats-loading">
      <div class="stats-spinner"/>
      <span>載入中…</span>
    </div>
    <div v-else class="admin-page__stats">
      <StatCard :value="stats.total" label="總案件" />
      <StatCard :value="stats.pending" label="待處理" type="pending" />
      <StatCard :value="stats.processing" label="處理中" type="processing" />
      <StatCard :value="stats.resolved" label="已結案" type="resolved" />
    </div>
  </div>
</template>

<script>
import StatCard from './StatCard.vue'

export default {
  name: 'DashboardStats',
  components: { StatCard },
  props: {
    stats: {
      type: Object,
      required: true,
      validator(v) {
        return 'total' in v && 'pending' in v && 'processing' in v && 'resolved' in v
      }
    },
    loading: { type: Boolean, default: false }
  }
}
</script>

<style scoped>
.admin-page__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-2xl);
}

@media (max-width: 1024px) {
  .admin-page__stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stats-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-6xl) 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.stats-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border-light);
  border-top-color: var(--color-secondary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
