<template>
  <div class="admin-page">
    <div class="admin-page__heading">
      <h1 class="admin-page__title">後台管理</h1>
      <p class="admin-page__subtitle">管理員 {{ userName }}，歡迎回來</p>
    </div>

    <div class="admin-tabs">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="admin-tabs__item"
        :class="{ 'admin-tabs__item--active': activeTab === t.key }"
        @click="switchTab(t.key)"
      >
        <span class="admin-tabs__item-label">{{ t.label }}</span>
      </button>
    </div>

    <DashboardStats v-if="activeTab === 'dashboard'" :stats="stats" :loading="statsLoading" />

    <CaseManagement
      v-if="activeTab === 'cases'"
      :cases="allCases"
      :meta="casesMeta"
      :loading="casesLoading"
      :search="casesSearch"
      :status="casesStatus"
      :category="casesCategory"
      :sort="casesSort"
      :order="casesOrder"
      @update:search="setCasesSearch"
      @update:status="setCasesStatus"
      @update:category="setCasesCategory"
      @update:sort="setCasesSort"
      @update:order="setCasesOrder"
      @update:page="setCasesPage"
      @update:perPage="setCasesPerPage"
      @delete="onDeleteCase"
    />

    <UserManagement
      v-if="activeTab === 'users'"
      :users="users"
      :meta="usersMeta"
      :loading="usersLoading"
      :search="usersSearch"
      :role="usersRole"
      :suspended="usersSuspended"
      @update:search="setUsersSearch"
      @update:role="setUsersRole"
      @update:suspended="setUsersSuspended"
      @update:page="setUsersPage"
      @update:perPage="setUsersPerPage"
      @upgrade="handleUpgrade"
      @downgrade="handleDowngrade"
      @suspend="handleSuspend"
      @unsuspend="handleUnsuspend"
    />

    <ConfirmModal
      :visible="showDeleteConfirm"
      title="永久刪除案件"
      :message="`確定永久刪除「${deleteTarget?.category}」？此操作無法復原。`"
      confirm-text="刪除"
      @confirm="onDeleteCaseConfirm"
      @close="showDeleteConfirm = false"
    />
  </div>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'
import { DashboardStats, CaseManagement, UserManagement } from '@/components/admin'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

export default {
  name: 'AdminPage',
  components: { DashboardStats, CaseManagement, UserManagement, ConfirmModal },
  data() {
    return {
      tabs: [
        { key: 'dashboard', label: '數據總覽' },
        { key: 'cases', label: '案件管理' },
        { key: 'users', label: '帳號管理' }
      ],
      activeTab: 'dashboard',
      showDeleteConfirm: false,
      deleteTarget: null
    }
  },
  computed: {
    ...mapGetters('auth', ['userName']),
    ...mapGetters('admin', [
      'stats', 'statsLoading',
      'allCases', 'casesMeta', 'casesLoading', 'casesSearch', 'casesStatus', 'casesCategory', 'casesSort', 'casesOrder',
      'users', 'usersMeta', 'usersLoading', 'usersSearch', 'usersRole', 'usersSuspended'
    ])
  },
  methods: {
    ...mapActions('admin', [
      'loadDashboardStats', 'loadCases', 'loadUsers',
      'handleDeleteCase',
      'handleUpgradeToChief', 'handleDowngradeToResident',
      'handleSuspendUser', 'handleUnsuspendUser'
    ]),
    ...mapMutations('admin', [
      'SET_CASES_SEARCH', 'SET_CASES_STATUS', 'SET_CASES_CATEGORY',
      'SET_CASES_SORT', 'SET_CASES_ORDER',
      'SET_USERS_SEARCH', 'SET_USERS_ROLE', 'SET_USERS_SUSPENDED'
    ]),
    switchTab(key) {
      this.activeTab = key
      this.loadActiveTabData()
    },
    async setCasesSearch(val) {
      this.SET_CASES_SEARCH(val)
      this.SET_CASES_META_PAGE(1)
      await this.loadCases()
    },
    async setCasesStatus(val) {
      this.SET_CASES_STATUS(val)
      this.SET_CASES_META_PAGE(1)
      await this.loadCases()
    },
    async setCasesCategory(val) {
      this.SET_CASES_CATEGORY(val)
      this.SET_CASES_META_PAGE(1)
      await this.loadCases()
    },
    async setCasesSort(val) {
      this.SET_CASES_SORT(val)
      await this.loadCases()
    },
    async setCasesOrder(val) {
      this.SET_CASES_ORDER(val)
      await this.loadCases()
    },
    async setCasesPage(page) {
      this.SET_CASES_META_PAGE(page)
      await this.loadCases()
    },
    async setCasesPerPage(perPage) {
      this.SET_CASES_META_PER_PAGE(perPage)
      this.SET_CASES_META_PAGE(1)
      await this.loadCases()
    },
    async setUsersSearch(val) {
      this.SET_USERS_SEARCH(val)
      this.SET_USERS_META_PAGE(1)
      await this.loadUsers()
    },
    async setUsersRole(val) {
      this.SET_USERS_ROLE(val)
      this.SET_USERS_META_PAGE(1)
      await this.loadUsers()
    },
    async setUsersSuspended(val) {
      this.SET_USERS_SUSPENDED(val)
      this.SET_USERS_META_PAGE(1)
      await this.loadUsers()
    },
    async setUsersPage(page) {
      this.SET_USERS_META_PAGE(page)
      await this.loadUsers()
    },
    async setUsersPerPage(perPage) {
      this.SET_USERS_META_PER_PAGE(perPage)
      this.SET_USERS_META_PAGE(1)
      await this.loadUsers()
    },
    SET_CASES_META_PAGE(page) {
      this.$store.commit('admin/SET_CASES_META', { ...this.casesMeta, page })
    },
    SET_CASES_META_PER_PAGE(perPage) {
      this.$store.commit('admin/SET_CASES_META', { ...this.casesMeta, perPage })
    },
    SET_USERS_META_PAGE(page) {
      this.$store.commit('admin/SET_USERS_META', { ...this.usersMeta, page })
    },
    SET_USERS_META_PER_PAGE(perPage) {
      this.$store.commit('admin/SET_USERS_META', { ...this.usersMeta, perPage })
    },
    async handleUpgrade(username) {
      if (!confirm(`確定將 ${username} 升級為里長？`)) return
      await this.handleUpgradeToChief(username)
      await this.loadUsers()
    },
    async handleDowngrade(username) {
      if (!confirm(`確定將 ${username} 降級為居民？`)) return
      await this.handleDowngradeToResident(username)
      await this.loadUsers()
    },
    async handleSuspend(username) {
      if (!confirm(`確定將 ${username} 停權？`)) return
      await this.handleSuspendUser(username)
      await this.loadUsers()
    },
    async handleUnsuspend(username) {
      if (!confirm(`確定解除 ${username} 的停權？`)) return
      await this.handleUnsuspendUser(username)
      await this.loadUsers()
    },
    onDeleteCase(c) {
      this.deleteTarget = c
      this.showDeleteConfirm = true
    },
    async onDeleteCaseConfirm() {
      await this.handleDeleteCase(this.deleteTarget.id)
      this.deleteTarget = null
      await this.loadCases()
    },
    loadActiveTabData() {
      this.loadDashboardStats()
      if (this.activeTab === 'cases') {
        this.loadCases()
      } else if (this.activeTab === 'users') {
        this.loadUsers()
      }
    }
  },
  mounted() {
    this.loadActiveTabData()
  }
}
</script>

<style scoped>
.admin-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-4xl) var(--spacing-2xl);
  min-height: calc(100vh - var(--header-height) - var(--footer-height));
}

.admin-page__heading {
  margin-bottom: var(--spacing-5xl);
  padding-bottom: var(--spacing-2xl);
  border-bottom: 1px solid var(--color-border-light);
}

.admin-page__title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xs);
}

.admin-page__subtitle {
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  margin: 0;
}

.admin-tabs {
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-5xl);
  padding: 0;
}

.admin-tabs__item {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-2xl);
  border: none;
  color: var(--color-text-muted);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-pill);
  transition: all var(--transition-fast);
  cursor: pointer;
  background: none;
  font-family: var(--font-family-base);
}

.admin-tabs__item:hover {
  color: var(--color-secondary);
  background: var(--color-secondary-light);
}

.admin-tabs__item--active {
  color: #fff;
  background: var(--color-secondary);
}

@media (max-width: 768px) {
  .admin-page {
    padding: var(--spacing-2xl) var(--spacing-lg);
  }
}
</style>
