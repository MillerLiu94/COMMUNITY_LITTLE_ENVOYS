<template>
  <div class="case-management">
    <div class="case-toolbar">
      <div class="case-toolbar__left">
        <div class="case-search">
          <svg class="case-search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            class="case-search__input"
            :value="search"
            placeholder="搜尋案件 ID、類別、回報者…"
            @input="onSearchInput"
          />
        </div>
        <select class="case-select" :value="status" @change="$emit('update:status', $event.target.value)">
          <option value="">全部狀態</option>
          <option value="pending">待處理</option>
          <option value="processing">處理中</option>
          <option value="resolved">已結案</option>
        </select>
        <select class="case-select" :value="category" @change="$emit('update:category', $event.target.value)">
          <option value="">全部類別</option>
          <option value="路燈故障">路燈故障</option>
          <option value="道路破損">道路破損</option>
          <option value="垃圾堆積">垃圾堆積</option>
          <option value="違規停車">違規停車</option>
          <option value="環境髒亂">環境髒亂</option>
        </select>
        <select class="case-select" :value="order" @change="onTimeSortChange($event.target.value)">
          <option value="desc">從最新到最久</option>
          <option value="asc">最久到最新</option>
        </select>
      </div>
      <div class="case-toolbar__right">
        <span class="case-total">共 {{ meta.total }} 筆</span>
      </div>
    </div>

    <div class="admin-page__card">
      <div class="admin-page__table-wrap" v-if="cases.length">
        <table class="admin-table">
          <thead>
            <tr>
              <th class="admin-table__th-sort" :class="sortClass('id')" @click="toggleSort('id')">
                ID <span class="sort-arrow"/>
              </th>
              <th class="admin-table__th-sort" :class="sortClass('category')" @click="toggleSort('category')">
                類別 <span class="sort-arrow"/>
              </th>
              <th>回報者</th>
              <th class="admin-table__th-sort" :class="sortClass('status')" @click="toggleSort('status')">
                狀態 <span class="sort-arrow"/>
              </th>
              <th>時間</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody v-if="!loading">
            <tr v-for="c in cases" :key="c.id">
              <td class="admin-table__id">#{{ c.id }}</td>
              <td>{{ categoryLabel(c.category) }}</td>
              <td>
                <div class="admin-table__reporter">
                  <span class="admin-table__avatar">{{ c.author?.name?.[0] }}</span>
                  {{ c.author?.name }}
                </div>
              </td>
              <td>
                <span class="status-badge" :class="'status-badge--' + c.status">{{ statusLabel(c.status) }}</span>
              </td>
              <td class="admin-table__time">{{ formatTime(c.createdAt) }}</td>
              <td>
                <button
                  class="table-btn table-btn--danger"
                  @click="$emit('delete', c)"
                >
                  永久刪除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="loading" class="case-loading-overlay">
          <div class="case-spinner"/>
          <span>載入中…</span>
        </div>
      </div>
      <p v-else-if="!loading" class="admin-page__empty">暫無案件</p>

      <div class="case-pagination" v-if="totalPages > 1">
        <button class="page-btn" :disabled="meta.page <= 1" @click="$emit('update:page', meta.page - 1)">上一頁</button>
        <template v-for="p in visiblePages">
          <button v-if="p === '...'" :key="p" class="page-btn page-btn--ellipsis" disabled>…</button>
          <button v-else :key="p" class="page-btn" :class="{ 'page-btn--active': p === meta.page }" @click="$emit('update:page', p)">{{ p }}</button>
        </template>
        <button class="page-btn" :disabled="meta.page >= totalPages" @click="$emit('update:page', meta.page + 1)">下一頁</button>
      </div>
    </div>
  </div>
</template>

<script>
const CATEGORY_LABELS = {
  '路燈故障': '路燈故障',
  '道路破損': '道路破損',
  '垃圾堆積': '垃圾堆積',
  '違規停車': '違規停車',
  '環境髒亂': '環境髒亂'
}

const STATUS_MAP = {
  pending: '待處理',
  processing: '處理中',
  resolved: '已結案'
}

export default {
  name: 'CaseManagement',
  props: {
    cases: { type: Array, required: true },
    meta: { type: Object, required: true },
    loading: { type: Boolean, default: false },
    search: { type: String, default: '' },
    status: { type: String, default: '' },
    category: { type: String, default: '' },
    sort: { type: String, default: 'createdAt' },
    order: { type: String, default: 'desc' }
  },
  emits: [
    'update:search', 'update:status', 'update:category',
    'update:sort', 'update:order', 'update:page', 'update:perPage',
    'delete'
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
    categoryLabel(cat) { return CATEGORY_LABELS[cat] || cat },
    statusLabel(status) { return STATUS_MAP[status] || status },
    sortClass(field) {
      if (this.sort !== field) return ''
      return this.order === 'asc' ? 'sorted-asc' : 'sorted-desc'
    },
    toggleSort(field) {
      if (this.sort === field) {
        this.$emit('update:order', this.order === 'asc' ? 'desc' : 'asc')
      } else {
        this.$emit('update:sort', field)
        this.$emit('update:order', 'desc')
      }
    },
    formatTime(ts) {
      if (!ts) return ''
      const d = new Date(ts)
      const pad = n => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    },
    onSearchInput(e) {
      if (this._searchTimer) clearTimeout(this._searchTimer)
      this._searchTimer = setTimeout(() => {
        this.$emit('update:search', e.target.value)
      }, 300)
    },
    onTimeSortChange(order) {
      this.$emit('update:sort', 'createdAt')
      this.$emit('update:order', order)
    }
  }
}
</script>

<style scoped>
.case-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
}

.case-toolbar__left {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.case-toolbar__right {
  flex-shrink: 0;
}

.case-total {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  white-space: nowrap;
}

.case-search {
  position: relative;
  display: flex;
  align-items: center;
}

.case-search__icon {
  position: absolute;
  left: 12px;
  width: 15px;
  height: 15px;
  color: var(--color-text-muted);
  pointer-events: none;
}

.case-search__input {
  padding: 8px 14px 8px 36px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-pill);
  font-size: var(--font-size-sm);
  background: var(--color-surface);
  color: var(--color-text-primary);
  width: 240px;
  outline: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.case-search__input:focus {
  border-color: var(--color-secondary);
  box-shadow: 0 0 0 3px rgba(98, 191, 173, 0.12);
}

.case-search__input::placeholder {
  color: var(--color-text-disabled);
}

.case-select {
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

.case-select:focus {
  border-color: var(--color-secondary);
  box-shadow: 0 0 0 3px rgba(98, 191, 173, 0.12);
}

.admin-page__card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);
  overflow: hidden;
}

.admin-page__table-wrap {
  overflow-x: auto;
  position: relative;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.admin-table th,
.admin-table td {
  padding: var(--spacing-md) var(--spacing-xl);
  text-align: left;
}

.admin-table th {
  background: var(--color-primary);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  white-space: nowrap;
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-top: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
}

.admin-table__th-sort {
  cursor: pointer;
  user-select: none;
}

.admin-table__th-sort:hover {
  color: var(--color-text-primary);
}

.sort-arrow {
  display: inline-block;
  width: 0;
  height: 0;
  margin-left: 4px;
  vertical-align: middle;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
}

.sorted-asc .sort-arrow {
  border-bottom: 5px solid var(--color-secondary);
  border-top: none;
}

.sorted-desc .sort-arrow {
  border-top: 5px solid var(--color-secondary);
  border-bottom: none;
}

.admin-table td {
  border-bottom: 1px solid var(--color-border-light);
  padding-top: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
}

.admin-table tbody tr:last-child td {
  border-bottom: none;
}

.admin-table tbody tr {
  transition: background var(--transition-fast);
}

.admin-table tbody tr:hover {
  background: var(--color-primary);
}

.admin-table tbody tr:nth-child(even) {
  background: rgba(249, 247, 232, 0.4);
}

.admin-table tbody tr:nth-child(even):hover {
  background: var(--color-primary);
}

.admin-table__id {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.admin-table__time {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
}

.admin-table__reporter {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.admin-table__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--color-secondary-light);
  color: var(--color-secondary);
  font-size: 11px;
  font-weight: var(--font-weight-bold);
  flex-shrink: 0;
}

.table-btn {
  padding: 5px var(--spacing-lg);
  border: 1px solid;
  border-radius: var(--radius-pill);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  background: transparent;
}

.table-btn--danger {
  border-color: var(--color-accent-admin);
  color: var(--color-accent-admin);
}

.table-btn--danger:hover {
  background: var(--color-accent-admin);
  color: #fff;
}

.admin-tag {
  display: inline-block;
  padding: 2px var(--spacing-sm);
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  line-height: 1.5;
}

.admin-tag--danger {
  background: var(--color-accent-admin-light);
  color: var(--color-accent-admin);
}

.admin-tag--safe {
  background: var(--color-accent-resident-light);
  color: var(--color-accent-resident);
}

.status-badge {
  display: inline-block;
  padding: 2px var(--spacing-md);
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  line-height: 1.5;
}

.status-badge--pending {
  background: var(--color-accent-admin-light);
  color: var(--color-accent-admin);
}

.status-badge--processing {
  background: var(--color-accent-chief-light);
  color: #b8951a;
}

.status-badge--resolved {
  background: var(--color-accent-resident-light);
  color: var(--color-accent-resident);
}

.admin-page__empty {
  text-align: center;
  color: var(--color-text-muted);
  padding: var(--spacing-6xl) 0;
  font-size: var(--font-size-base);
}

.case-loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-5xl) 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.case-spinner {
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

.case-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xxs);
  padding: var(--spacing-lg) var(--spacing-xl);
  border-top: 1px solid var(--color-border-light);
  flex-wrap: wrap;
}

.page-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 var(--spacing-xs);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
}

.page-btn:hover:not(:disabled):not(.page-btn--active) {
  border-color: var(--color-secondary);
  color: var(--color-secondary);
}

.page-btn--active {
  background: var(--color-secondary);
  color: #fff;
  border-color: var(--color-secondary);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-btn--ellipsis {
  border: none;
  cursor: default;
}
</style>
