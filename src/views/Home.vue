<template>
  <div class="home-page">
    <div class="home-page__header">
      <h1 class="home-page__greeting">歡迎，{{ userName }}</h1>
      <p class="home-page__role-hint" :class="'home-page__role-hint--' + role">
        當前身份：{{ roleLabel }}
      </p>
    </div>
    <ReportCardList
      @select="handleSelect"
      @delete="handleDelete"
      @edit="handleSelect"
      @page-change="handlePageChange"
    />
    <DetailModal
      :visible="showDetail"
      :caseData="selectedCase"
      @close="handleCloseDetail"
      @delete="handleDelete"
    />
    <DeclareModal
      :visible="showCreate"
      @close="SET_SHOW_CREATE(false)"
    />
    <ConfirmModal
      :visible="showDeleteConfirm"
      title="刪除案件"
      :message="`確定刪除此案件？此操作無法復原。`"
      confirm-text="刪除"
      @confirm="handleDeleteConfirm"
      @close="showDeleteConfirm = false"
    />
  </div>
</template>

<script>
import { mapGetters, mapMutations, mapActions } from 'vuex'
import { ReportCardList, DetailModal, DeclareModal } from '@/components/cases'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

function debounce(fn, delay) {
  let timer
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

export default {
  name: 'HomePage',
  components: { ReportCardList, DetailModal, DeclareModal, ConfirmModal },
  data() {
    return {
      selectedCase: {},
      showDetail: false,
      showDeleteConfirm: false,
      deleteTargetId: null,
      syncing: false,
      skipRouteWatch: false
    }
  },
  computed: {
    ...mapGetters('auth', ['userName', 'roleLabel', 'currentRole']),
    ...mapGetters('cases', ['showCreate', 'searchKeyword', 'statusFilter', 'sortMode']),
    role() {
      return this.currentRole
    }
  },
  watch: {
    searchKeyword: debounce(function(val) {
      this._syncAndFetch({ search: val || undefined })
    }, 300),
    statusFilter(val) {
      this._syncAndFetch({ status: val || undefined })
    },
    sortMode(val) {
      this._syncAndFetch({ sort: val || undefined })
    },
    $route: {
      handler(to) {
        if (to.name !== 'Home' && to.name !== 'HomeFilter') return
        if (this.syncing) return
        if (this.skipRouteWatch) {
          this.skipRouteWatch = false
          return
        }
        this._loadFromRoute(to)
      },
      immediate: true
    }
  },
  methods: {
    ...mapMutations('cases', ['SET_SHOW_CREATE', 'SET_SEARCH_KEYWORD', 'SET_STATUS_FILTER', 'SET_SORT_MODE', 'SET_META']),
    ...mapActions('cases', ['loadCasesPaginated', 'deleteCase']),
    _syncAndFetch(params) {
      this.syncing = true
      this.SET_META({ page: 1 })
      const query = { ...this.$route.query }
      Object.keys(params).forEach(k => {
        if (params[k] === undefined || params[k] === '') {
          delete query[k]
        } else {
          query[k] = params[k]
        }
      })
      this.$router.replace({ query })
        .then(() => { this.syncing = false })
        .catch(() => { this.syncing = false })
      this.loadCasesPaginated()
    },
    async _loadFromRoute(route) {
      const q = route.query
      this.SET_SEARCH_KEYWORD(q.search || '')
      this.SET_STATUS_FILTER(q.status || '')
      this.SET_SORT_MODE(q.sort || 'latest')
      this.SET_META({ page: parseInt(q.page, 10) || 1, perPage: 9 })
      await this.loadCasesPaginated()
      if (q.caseId) {
        const caseData = this.$store.getters['cases/getCaseById'](Number(q.caseId))
        if (caseData) {
          this.selectedCase = caseData
          this.showDetail = true
        }
      }
    },
    handleSelect(caseData) {
      this.selectedCase = caseData
      this.showDetail = true
      this.skipRouteWatch = true
      this.$router.replace({ query: { ...this.$route.query, caseId: caseData.id } })
    },
    handleCloseDetail() {
      this.showDetail = false
      this.selectedCase = {}
      const query = { ...this.$route.query }
      delete query.caseId
      this.skipRouteWatch = true
      this.$router.replace({ query })
    },
    handleDelete(caseId) {
      this.deleteTargetId = caseId
      this.showDeleteConfirm = true
    },
    async handleDeleteConfirm() {
      await this.deleteCase({ caseId: this.deleteTargetId, deletedBy: this.userName })
      this.showDetail = false
      this.deleteTargetId = null
      const query = { ...this.$route.query }
      delete query.caseId
      this.skipRouteWatch = true
      this.$router.replace({ query })
    },
    handlePageChange(page) {
      this.syncing = true
      this.SET_META({ page })
      this.$router.replace({ query: { ...this.$route.query, page: String(page) } })
        .then(() => { this.syncing = false })
        .catch(() => { this.syncing = false })
      this.loadCasesPaginated()
    }
  }
}
</script>

<style scoped>
.home-page {
  min-height: calc(100vh - var(--header-height) - var(--footer-height));
  background-color: var(--color-primary);
}

.home-page__header {
  text-align: center;
  padding: var(--spacing-4xl) var(--spacing-2xl) var(--spacing-6xl);
}

.home-page__greeting {
  font-size: var(--font-size-3xl);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-sm);
}

.home-page__role-hint {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin: 0;
}

.home-page__role-hint--resident {
  color: var(--color-accent-resident);
}

.home-page__role-hint--chief {
  color: var(--color-accent-chief);
}

.home-page__role-hint--admin {
  color: var(--color-accent-admin);
}

@media (max-width: 767px) {
  .home-page__header {
    padding: var(--spacing-3xl) var(--spacing-lg) var(--spacing-4xl);
  }

  .home-page__greeting {
    font-size: var(--font-size-2xl);
  }

  .home-page__role-hint {
    font-size: var(--font-size-base);
  }
}
</style>
