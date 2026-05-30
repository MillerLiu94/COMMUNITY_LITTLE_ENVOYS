<template>
  <div class="card-list">
    <div v-if="loading" class="card-list__loading">
      <LoadingSpinner />
    </div>
    <div v-else-if="filteredCases.length === 0" class="card-list__empty">
      <div class="card-list__empty-icon">
        <img v-if="searchKeyword" class="card-list__empty-search-img" src="@/assets/img/search.png" alt="查無此項目">
        <img v-else class="card-list__empty-search-img" src="@/assets/img/insurance.png" alt="目前社區很平安">
      </div>
      <p class="card-list__empty-text">{{ searchKeyword ? '查無此項目' : '目前社區很平安，沒有任何突發事件！' }}</p>
      <button
        v-if="canCreate && !searchKeyword"
        class="card-list__empty-btn"
        @click="SET_SHOW_CREATE(true)"
      >
        發起第一則申報
      </button>
    </div>
    <div v-else>
      <div class="card-list__grid">
      <ReportCard
        v-for="item in filteredCases"
        :key="item.id"
        :cardData="item"
        @click="$emit('select', item)"
        @delete="$emit('delete', $event)"
        @edit="$emit('edit', $event)"
      />
    </div>
      <div v-if="totalPages > 1" class="card-list__pagination">
        <button
          class="card-list__page-btn"
          :disabled="currentPage <= 1"
          @click="prevPage"
        >
          &lt; 上一頁
        </button>
        <span class="card-list__page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button
          class="card-list__page-btn"
          :disabled="currentPage >= totalPages"
          @click="nextPage"
        >
          下一頁 &gt;
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import ReportCard from './ReportCard.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

export default {
  name: 'ReportCardList',
  components: { ReportCard, LoadingSpinner },
  computed: {
    ...mapGetters('cases', { filteredCases: 'filteredCases', loading: 'isLoading', searchKeyword: 'searchKeyword', meta: 'meta' }),
    ...mapGetters('auth', ['canCreate']),
    totalPages() {
      return Math.ceil(this.meta.total / this.meta.perPage) || 1
    },
    currentPage() {
      return this.meta.page
    }
  },
  methods: {
    ...mapMutations('cases', ['SET_SHOW_CREATE']),
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.$emit('page-change', this.currentPage + 1)
      }
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.$emit('page-change', this.currentPage - 1)
      }
    }
  },
  watch: {
    filteredCases() {
      if (this.meta.page > this.totalPages) {
        this.$emit('page-change', 1)
      }
    }
  }
}
</script>

<style scoped>
.card-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-4xl) var(--spacing-2xl);
}

.card-list__loading {
  display: flex;
  justify-content: center;
  padding: var(--spacing-6xl) 0;
}

.card-list__empty {
  text-align: center;
  padding: var(--spacing-6xl) var(--spacing-2xl);
}

.card-list__empty-icon {
  font-size: 80px;
  margin-bottom: var(--spacing-xl);
}

.card-list__empty-search-img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  opacity: 0.6;
}

.card-list__empty-text {
  font-size: var(--font-size-xl);
  color: var(--color-text-muted);
  margin: 0 0 var(--spacing-4xl);
}

.card-list__empty-btn {
  padding: var(--spacing-lg) var(--spacing-5xl);
  background: var(--color-secondary);
  color: #fff;
  border: none;
  border-radius: var(--radius-pill);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: opacity 0.2s;
}

.card-list__empty-btn:hover {
  opacity: 0.9;
}

@media (max-width: 767px) {
  .card-list__empty-icon {
    font-size: 48px;
  }

  .card-list__empty-search-img {
    width: 48px;
    height: 48px;
  }

  .card-list__empty-text {
    font-size: var(--font-size-base);
  }

  .card-list__empty-btn {
    padding: var(--spacing-md) var(--spacing-4xl);
    font-size: var(--font-size-base);
  }
}

.card-list__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-4xl);
}

.card-list__pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-5xl);
  padding: var(--spacing-xl) 0;
}

.card-list__page-btn {
  padding: var(--spacing-sm) var(--spacing-2xl);
  border: 1px solid var(--color-secondary);
  border-radius: var(--radius-pill);
  background: #fff;
  color: var(--color-secondary);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all 0.2s;
}

.card-list__page-btn:hover:not(:disabled) {
  background: var(--color-secondary);
  color: #fff;
}

.card-list__page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.card-list__page-info {
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  min-width: 80px;
  text-align: center;
}

@media (max-width: 767px) {
  .card-list {
    padding: var(--spacing-3xl) var(--spacing-lg);
  }

  .card-list__grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-2xl);
  }
}
</style>
