<template>
  <div class="user-management">
    <div class="user-toolbar">
      <div class="user-toolbar__left">
        <div class="user-search">
          <svg class="user-search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            class="user-search__input"
            :value="search"
            placeholder="搜尋姓名或帳號…"
            @input="onSearchInput"
          />
        </div>
        <select class="user-select" :value="role" @change="$emit('update:role', $event.target.value)">
          <option value="">全部角色</option>
          <option value="resident">居民</option>
          <option value="chief">里長</option>
          <option value="admin">管理員</option>
        </select>
        <select class="user-select" :value="suspended" @change="$emit('update:suspended', $event.target.value)">
          <option value="">全部狀態</option>
          <option value="false">正常</option>
          <option value="true">已停權</option>
        </select>
      </div>
      <div class="user-toolbar__right">
        <span class="user-total">共 {{ meta.total }} 筆</span>
      </div>
    </div>

    <div v-if="loading" class="user-loading-overlay">
      <div class="user-spinner"/>
      <span>載入中…</span>
    </div>

    <div class="user-grid" v-else-if="users.length">
      <div v-for="u in users" :key="u.username" class="user-card" :class="{ 'user-card--suspended': u.isSuspended }">
        <div class="user-card__avatar" :class="'user-card__avatar--' + u.role">
          {{ u.name[0] }}
        </div>
        <div class="user-card__info">
          <div class="user-card__name-row">
            <span class="user-card__name">{{ u.name }}</span>
            <span class="user-card__username">@{{ u.username }}</span>
          </div>
          <div class="user-card__tags">
            <span class="user-card__tag" :class="'user-card__tag--' + u.role">{{ roleLabel(u.role) }}</span>
            <span v-if="u.isSuspended" class="user-card__tag user-card__tag--suspended">已停權</span>
          </div>
        </div>
        <div class="user-card__actions">
          <template v-if="u.role === 'resident' && !u.isSuspended">
            <button class="user-card__btn user-card__btn--upgrade" @click="$emit('upgrade', u.username)">升級里長</button>
          </template>
          <template v-if="u.role === 'chief' && !u.isSuspended">
            <button class="user-card__btn user-card__btn--downgrade" @click="$emit('downgrade', u.username)">降級居民</button>
          </template>
          <template v-if="!u.isSuspended && u.role !== 'admin'">
            <button class="user-card__btn user-card__btn--suspend" @click="$emit('suspend', u.username)">停權</button>
          </template>
          <template v-if="u.isSuspended">
            <button class="user-card__btn user-card__btn--restore" @click="$emit('unsuspend', u.username)">解除停權</button>
          </template>
        </div>
      </div>
    </div>
    <p v-else class="admin-page__empty">暫無使用者</p>

    <div class="user-pagination" v-if="totalPages > 1">
      <button class="page-btn" :disabled="meta.page <= 1" @click="$emit('update:page', meta.page - 1)">上一頁</button>
      <template v-for="p in visiblePages">
        <button v-if="p === '...'" :key="p" class="page-btn page-btn--ellipsis" disabled>…</button>
        <button v-else :key="p" class="page-btn" :class="{ 'page-btn--active': p === meta.page }" @click="$emit('update:page', p)">{{ p }}</button>
      </template>
      <button class="page-btn" :disabled="meta.page >= totalPages" @click="$emit('update:page', meta.page + 1)">下一頁</button>
    </div>
  </div>
</template>

<script>
const ROLE_LABELS = {
  resident: '居民',
  chief: '里長',
  admin: '管理員'
}

export default {
  name: 'UserManagement',
  props: {
    users: { type: Array, required: true },
    meta: { type: Object, required: true },
    loading: { type: Boolean, default: false },
    search: { type: String, default: '' },
    role: { type: String, default: '' },
    suspended: { type: String, default: '' }
  },
  emits: [
    'update:search', 'update:role', 'update:suspended',
    'update:page', 'update:perPage',
    'upgrade', 'downgrade', 'suspend', 'unsuspend'
  ],
  computed: {
    totalPages() {
      return Math.max(1, Math.ceil(this.meta.total / this.meta.perPage))
    },
    visiblePages() {
      const total = this.totalPages
      const current = this.meta.page
      const range = []
      if (total <= 7) {
        for (let i = 1; i <= total; i++) range.push(i)
        return range
      }
      range.push(1)
      if (current > 3) range.push('...')
      const start = Math.max(2, current - 1)
      const end = Math.min(total - 1, current + 1)
      for (let i = start; i <= end; i++) range.push(i)
      if (current < total - 2) range.push('...')
      range.push(total)
      return range
    }
  },
  methods: {
    roleLabel(role) { return ROLE_LABELS[role] || role },
    onSearchInput(e) {
      if (this._searchTimer) clearTimeout(this._searchTimer)
      this._searchTimer = setTimeout(() => {
        this.$emit('update:search', e.target.value)
      }, 300)
    }
  }
}
</script>

<style scoped>
.user-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
}

.user-toolbar__left {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.user-toolbar__right {
  flex-shrink: 0;
}

.user-total {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  white-space: nowrap;
}

.user-search {
  position: relative;
  display: flex;
  align-items: center;
}

.user-search__icon {
  position: absolute;
  left: 12px;
  width: 15px;
  height: 15px;
  color: var(--color-text-muted);
  pointer-events: none;
}

.user-search__input {
  padding: 8px 14px 8px 36px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-pill);
  font-size: var(--font-size-sm);
  background: var(--color-surface);
  color: var(--color-text-primary);
  width: 220px;
  outline: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.user-search__input:focus {
  border-color: var(--color-secondary);
  box-shadow: 0 0 0 3px rgba(98, 191, 173, 0.12);
}

.user-search__input::placeholder {
  color: var(--color-text-disabled);
}

.user-select {
  padding: 8px 14px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-pill);
  font-size: var(--font-size-sm);
  background: var(--color-surface);
  color: var(--color-text-primary);
  outline: none;
  cursor: pointer;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.user-select:focus {
  border-color: var(--color-secondary);
  box-shadow: 0 0 0 3px rgba(98, 191, 173, 0.12);
}

.user-loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-6xl) 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.user-spinner {
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

.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: var(--spacing-xl);
}

.user-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl) var(--spacing-2xl);
  border: 1px solid var(--color-border-light);
  transition: border-color var(--transition-base), box-shadow var(--transition-base);
}

.user-card:hover {
  border-color: transparent;
  box-shadow: var(--shadow-md);
}

.user-card--suspended {
  opacity: 0.5;
}

.user-card__avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: #fff;
  flex-shrink: 0;
}

.user-card__avatar--resident {
  background: linear-gradient(135deg, var(--color-accent-resident), #2a9d6a);
}

.user-card__avatar--chief {
  background: linear-gradient(135deg, var(--color-accent-chief), #e0b84c);
  color: var(--color-text-primary);
}

.user-card__avatar--admin {
  background: linear-gradient(135deg, var(--color-accent-admin), #d03535);
}

.user-card__info {
  flex: 1;
  min-width: 0;
}

.user-card__name-row {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-xs);
  margin-bottom: 6px;
}

.user-card__name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.user-card__username {
  font-size: var(--font-size-xs);
  color: var(--color-text-disabled);
}

.user-card__tags {
  display: flex;
  gap: var(--spacing-xs);
}

.user-card__tag {
  display: inline-block;
  padding: 2px var(--spacing-sm);
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  line-height: 1.5;
}

.user-card__tag--resident {
  background: var(--color-accent-resident-light);
  color: var(--color-accent-resident);
}

.user-card__tag--chief {
  background: var(--color-accent-chief-light);
  color: #b8951a;
}

.user-card__tag--admin {
  background: var(--color-accent-admin-light);
  color: var(--color-accent-admin);
}

.user-card__tag--suspended {
  background: var(--color-accent-admin-light);
  color: var(--color-accent-admin);
}

.user-card__actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
  flex-shrink: 0;
}

.user-card__btn {
  padding: 5px var(--spacing-lg);
  border: 1px solid;
  border-radius: var(--radius-pill);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
  background: transparent;
  white-space: nowrap;
  text-align: center;
}

.user-card__btn--upgrade {
  border-color: var(--color-secondary);
  color: var(--color-secondary);
}

.user-card__btn--upgrade:hover {
  background: var(--color-secondary);
  color: #fff;
}

.user-card__btn--downgrade {
  border-color: var(--color-accent-chief);
  color: #b8951a;
}

.user-card__btn--downgrade:hover {
  background: var(--color-accent-chief);
  color: var(--color-text-primary);
}

.user-card__btn--suspend {
  border-color: var(--color-accent-admin);
  color: var(--color-accent-admin);
}

.user-card__btn--suspend:hover {
  background: var(--color-accent-admin);
  color: #fff;
}

.user-card__btn--restore {
  border-color: var(--color-accent-resident);
  color: var(--color-accent-resident);
}

.user-card__btn--restore:hover {
  background: var(--color-accent-resident);
  color: #fff;
}

.admin-page__empty {
  text-align: center;
  color: var(--color-text-muted);
  padding: var(--spacing-6xl) 0;
  font-size: var(--font-size-base);
}

.user-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xxs);
  margin-top: var(--spacing-xl);
  flex-wrap: wrap;
}
</style>
