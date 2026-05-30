<template>
  <div class="role-tabs">
    <div class="role-tabs__label">選擇身份</div>
    <div class="role-tabs__list">
      <button
        v-for="opt in options"
        :key="opt.value"
        class="role-tabs__item"
        :class="{ 'role-tabs__item--active': opt.value === value }"
        @click="$emit('input', opt.value)"
      >
        <img class="role-tabs__icon" :src="opt.icon" :alt="opt.label">
        <span class="role-tabs__text">{{ opt.label }}</span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RoleTabs',
  props: {
    value: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      options: [
        { value: 'resident', label: '居民', icon: require('@/assets/img/human.png') },
        { value: 'chief', label: '里長', icon: require('@/assets/img/politician.png') },
        { value: 'admin', label: '管理員', icon: require('@/assets/img/admin.png') }
      ]
    }
  }
}
</script>

<style scoped>
/* =========================================================================
   Role Selection Tabs
   ========================================================================= */
.role-tabs {
  width: 100%;
}

.role-tabs__label {
  text-align: center;
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-md);
}

.role-tabs__list {
  display: flex;
  gap: var(--spacing-sm);
}

.role-tabs__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xxs);
  padding: var(--spacing-xl) var(--spacing-xs);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  cursor: pointer;
  transition: all 0.25s;
}

.role-tabs__item:hover {
  border-color: var(--color-secondary);
  background: var(--color-secondary-light);
}

.role-tabs__item--active {
  border-color: var(--color-secondary);
  background: var(--color-secondary);
  color: var(--color-surface);
}

.role-tabs__icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.role-tabs__text {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
}

/* =========================================================================
   MOBILE  (≤ 480px)  — compact role tabs
   ========================================================================= */
@media (max-width: 480px) {
  .role-tabs__label {
    margin-bottom: var(--spacing-xxs);
  }

  .role-tabs__list {
    gap: var(--spacing-xxs);
  }

  .role-tabs__item {
    padding: var(--spacing-sm) var(--spacing-xxs);
    gap: 2px;
  }

  .role-tabs__icon {
    width: 28px;
    height: 28px;
  }

  .role-tabs__text {
    font-size: var(--font-size-xs);
  }
}
</style>
