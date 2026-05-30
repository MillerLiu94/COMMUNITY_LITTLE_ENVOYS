<template>
  <div class="navbar">
    <div class="navbar__filter-group">
      <button class="navbar__filter-btn" @click="toggleFilterOpen">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 4h12M5 8h6M7 12h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span class="navbar__filter-text">篩選</span>
        <span v-if="statusFilter" class="navbar__filter-badge"></span>
      </button>
      <div class="navbar__filter-dropdown" :class="{ 'navbar__filter-dropdown--open': filterOpen }">
        <div class="navbar__filter-group-label">處理狀態</div>
        <button
          v-for="opt in statusFilterOptions"
          :key="opt.value"
          class="navbar__filter-option"
          :class="{ 'navbar__filter-option--active': statusFilter === opt.value }"
          @click="selectFilter(opt.value)"
        >
          {{ opt.label }}
        </button>
        <div class="navbar__filter-divider"></div>
        <button
          v-for="opt in sortModeOptions"
          :key="'sort-' + opt.value"
          class="navbar__filter-option"
          :class="{ 'navbar__filter-option--active': sortMode === opt.value }"
          @click="selectSortMode(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>
    <div class="navbar__search">
      <img class="navbar__search-icon" src="@/assets/img/search.png" alt="搜尋">
      <input
        class="navbar__search-input"
        type="text"
        placeholder="搜尋事件類型或描述…"
        :value="searchKeyword"
        @input="SET_SEARCH_KEYWORD($event.target.value)"
      />
      <button
        v-if="searchKeyword"
        class="navbar__clear"
        @click="SET_SEARCH_KEYWORD('')"
        aria-label="清除搜尋"
      >&times;</button>
    </div>
    <button v-if="canCreate && allCases.length > 0" class="navbar__create-btn" @click="handleCreate">
      + 新增申報
    </button>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'

export default {
  name: 'CaseToolbar',
  data() {
    return {
      filterOpen: false,
      statusFilterOptions: [
        { value: '', label: '所有狀態' },
        { value: 'pending', label: '待處理' },
        { value: 'processing', label: '處理中' },
        { value: 'resolved', label: '已結案' }
      ],
      sortModeOptions: [
        { value: 'latest', label: '最新' },
        { value: 'hot', label: '最熱門' }
      ]
    }
  },
  computed: {
    ...mapGetters('cases', ['searchKeyword', 'statusFilter', 'allCases', 'sortMode']),
    ...mapGetters('auth', ['canCreate'])
  },
  methods: {
    ...mapMutations('cases', ['SET_SEARCH_KEYWORD', 'SET_STATUS_FILTER', 'SET_SHOW_CREATE', 'SET_SORT_MODE']),
    toggleFilterOpen() {
      this.filterOpen = !this.filterOpen
    },
    selectFilter(value) {
      this.SET_STATUS_FILTER(value)
      this.filterOpen = false
    },
    selectSortMode(value) {
      this.SET_SORT_MODE(value)
      this.filterOpen = false
    },
    handleCreate() {
      this.SET_SHOW_CREATE(true)
    },
    onClickOutside(e) {
      if (!this.$el.contains(e.target)) {
        this.filterOpen = false
      }
    }
  },
  mounted() {
    document.addEventListener('click', this.onClickOutside)
  },
  beforeDestroy() {
    document.removeEventListener('click', this.onClickOutside)
  }
}
</script>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.navbar__search {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.navbar__search-icon {
  position: absolute;
  left: var(--spacing-md);
  width: 18px;
  height: 18px;
  pointer-events: none;
}

.navbar__search-input {
  width: 100%;
  max-width: 360px;
  padding: var(--spacing-sm) var(--spacing-4xl) var(--spacing-sm) var(--spacing-5xl);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-pill);
  font-size: var(--font-size-base);
  font-family: var(--font-family-base);
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
  background: var(--color-surface);
}

.navbar__search-input:focus {
  border-color: var(--color-secondary);
}

.navbar__clear {
  position: absolute;
  right: var(--spacing-sm);
  width: 24px;
  height: 24px;
  border: none;
  background: var(--color-text-disabled);
  color: #fff;
  border-radius: 50%;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.navbar__clear:hover {
  background: var(--color-text-muted);
}

.navbar__filter-group {
  position: relative;
}

.navbar__filter-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-lg);
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-family: var(--font-family-base);
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.navbar__filter-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.navbar__filter-badge {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-accent-resident);
}

.navbar__filter-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 140px;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-8px);
  transition: all 0.3s ease;
  z-index: 20;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.navbar__filter-dropdown--open {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.navbar__filter-option {
  padding: var(--spacing-md) var(--spacing-lg);
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-family: var(--font-family-base);
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;
}

.navbar__filter-option:hover {
  background: var(--color-secondary-light);
}

.navbar__filter-option--active {
  color: var(--color-secondary);
  font-weight: var(--font-weight-semibold);
}

.navbar__filter-group-label {
  padding: var(--spacing-sm) var(--spacing-lg) 0;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  pointer-events: none;
  padding-top: var(--spacing-md);
}

.navbar__filter-group-label:first-child {
  padding-top: var(--spacing-md);
}

.navbar__filter-divider {
  height: 1px;
  background: var(--color-border);
  margin: var(--spacing-xs) 0;
}

.navbar__create-btn {
  flex-shrink: 0;
  padding: var(--spacing-sm) var(--spacing-4xl);
  background: var(--color-secondary);
  color: #fff;
  border: none;
  border-radius: var(--radius-pill);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: opacity 0.2s;
  white-space: nowrap;
}

.navbar__create-btn:hover {
  opacity: 0.9;
}

@media (max-width: 767px) {
  .navbar {
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }

  .navbar__search {
    order: 1;
    width: 100%;
  }

  .navbar__create-btn {
    white-space: nowrap;
    padding: var(--spacing-sm) var(--spacing-2xl);
  }

  .navbar__filter-text {
    display: none;
  }

  .navbar__filter-dropdown {
    right: 0;
    left: auto;
    min-width: 120px;
  }
}
</style>
