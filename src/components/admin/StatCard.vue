<template>
  <div class="stat-card" :class="'stat-card--' + type">
    <div class="stat-card__icon-wrap">
      <svg class="stat-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <template v-if="type === 'pending'">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </template>
        <template v-else-if="type === 'processing'">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </template>
        <template v-else-if="type === 'resolved'">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </template>
        <template v-else>
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
        </template>
      </svg>
    </div>
    <span class="stat-card__value">{{ value }}</span>
    <span class="stat-card__label">{{ label }}</span>
  </div>
</template>

<script>
export default {
  name: 'StatCard',
  props: {
    value: { type: Number, required: true },
    label: { type: String, required: true },
    type: { type: String, default: '' }
  }
}
</script>

<style scoped>
.stat-card {
  position: relative;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: var(--spacing-3xl);
  text-align: center;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: transform var(--transition-base), box-shadow var(--transition-base);
  border: 1px solid var(--color-border-light);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--color-secondary);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: transparent;
}

.stat-card--pending::before {
  background: var(--color-accent-admin);
}

.stat-card--processing::before {
  background: var(--color-accent-chief);
}

.stat-card--resolved::before {
  background: var(--color-accent-resident);
}

.stat-card__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin: 0 auto var(--spacing-lg);
  border-radius: var(--radius-lg);
  background: var(--color-secondary-light);
}

.stat-card--pending .stat-card__icon-wrap {
  background: var(--color-accent-admin-light);
  color: var(--color-accent-admin);
}

.stat-card--processing .stat-card__icon-wrap {
  background: var(--color-accent-chief-light);
  color: #b8951a;
}

.stat-card--resolved .stat-card__icon-wrap {
  background: var(--color-accent-resident-light);
  color: var(--color-accent-resident);
}

.stat-card:not([class*='stat-card--']) .stat-card__icon-wrap {
  background: var(--color-secondary-light);
  color: var(--color-secondary);
}

.stat-card__icon {
  width: 22px;
  height: 22px;
}

.stat-card__value {
  display: block;
  font-size: var(--font-size-5xl);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-primary);
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.stat-card__label {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-top: var(--spacing-xs);
  font-weight: var(--font-weight-medium);
}
</style>
