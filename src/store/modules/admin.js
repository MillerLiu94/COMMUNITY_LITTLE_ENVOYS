import {
  fetchDashboardStats,
  fetchCasesPaginated,
  fetchUsersPaginated,
  deleteCase,
  upgradeToChief,
  downgradeToResident,
  suspendUser,
  unsuspendUser
} from '@/api/modules/admin'

export default {
  namespaced: true,
  state: {
    stats: { total: 0, pending: 0, processing: 0, resolved: 0 },
    allCases: [],
    casesMeta: { total: 0, page: 1, perPage: 10 },
    casesSearch: '',
    casesStatus: '',
    casesCategory: '',
    casesSort: 'createdAt',
    casesOrder: 'desc',
    casesLoading: false,
    users: [],
    usersMeta: { total: 0, page: 1, perPage: 10 },
    usersSearch: '',
    usersRole: '',
    usersSuspended: undefined,
    usersLoading: false,
    statsLoading: false
  },
  getters: {
    stats(s) { return s.stats },
    allCases(s) { return s.allCases },
    casesMeta(s) { return s.casesMeta },
    casesSearch(s) { return s.casesSearch },
    casesStatus(s) { return s.casesStatus },
    casesCategory(s) { return s.casesCategory },
    casesSort(s) { return s.casesSort },
    casesOrder(s) { return s.casesOrder },
    casesLoading(s) { return s.casesLoading },
    users(s) { return s.users },
    usersMeta(s) { return s.usersMeta },
    usersSearch(s) { return s.usersSearch },
    usersRole(s) { return s.usersRole },
    usersSuspended(s) { return s.usersSuspended },
    usersLoading(s) { return s.usersLoading },
    statsLoading(s) { return s.statsLoading }
  },
  mutations: {
    SET_STATS(s, v) { s.stats = v },
    SET_STATS_LOADING(s, v) { s.statsLoading = v },
    SET_CASES(s, v) { s.allCases = v },
    SET_CASES_META(s, v) { s.casesMeta = v },
    SET_CASES_SEARCH(s, v) { s.casesSearch = v },
    SET_CASES_STATUS(s, v) { s.casesStatus = v },
    SET_CASES_CATEGORY(s, v) { s.casesCategory = v },
    SET_CASES_SORT(s, v) { s.casesSort = v },
    SET_CASES_ORDER(s, v) { s.casesOrder = v },
    SET_CASES_LOADING(s, v) { s.casesLoading = v },
    SET_USERS(s, v) { s.users = v },
    SET_USERS_META(s, v) { s.usersMeta = v },
    SET_USERS_SEARCH(s, v) { s.usersSearch = v },
    SET_USERS_ROLE(s, v) { s.usersRole = v },
    SET_USERS_SUSPENDED(s, v) { s.usersSuspended = v },
    SET_USERS_LOADING(s, v) { s.usersLoading = v },
    UPDATE_USER(s, { username, updates }) {
      const idx = s.users.findIndex(u => u.username === username)
      if (idx !== -1) Object.assign(s.users[idx], updates)
    },
    REMOVE_CASE(s, caseId) {
      s.allCases = s.allCases.filter(c => c.id !== caseId)
    }
  },
  actions: {
    async loadDashboardStats({ commit }) {
      commit('SET_STATS_LOADING', true)
      try {
        const res = await fetchDashboardStats()
        commit('SET_STATS', res.data)
      } catch {
        commit('SET_STATS', { total: 0, pending: 0, processing: 0, resolved: 0 })
      } finally {
        commit('SET_STATS_LOADING', false)
      }
    },
    async loadCases({ commit, state }) {
      commit('SET_CASES_LOADING', true)
      try {
        const res = await fetchCasesPaginated({
          page: state.casesMeta.page,
          perPage: state.casesMeta.perPage,
          search: state.casesSearch,
          status: state.casesStatus,
          category: state.casesCategory,
          sort: state.casesSort,
          order: state.casesOrder
        })
        const raw = res.data
        const list = Array.isArray(raw.cases) ? raw.cases : []
        commit('SET_CASES', list)
        commit('SET_CASES_META', {
          total: raw.total ?? list.length,
          page: raw.page ?? state.casesMeta.page,
          perPage: raw.perPage ?? state.casesMeta.perPage
        })
      } finally {
        commit('SET_CASES_LOADING', false)
      }
    },
    async loadUsers({ commit, state }) {
      commit('SET_USERS_LOADING', true)
      try {
        const res = await fetchUsersPaginated({
          page: state.usersMeta.page,
          perPage: state.usersMeta.perPage,
          search: state.usersSearch,
          role: state.usersRole,
          suspended: state.usersSuspended
        })
        const raw = res.data
        const list = Array.isArray(raw.users) ? raw.users : []
        commit('SET_USERS', list)
        commit('SET_USERS_META', {
          total: raw.total ?? list.length,
          page: raw.page ?? state.usersMeta.page,
          perPage: raw.perPage ?? state.usersMeta.perPage
        })
      } finally {
        commit('SET_USERS_LOADING', false)
      }
    },
    async handleDeleteCase({ commit, dispatch }, caseId) {
      await deleteCase(caseId)
      commit('REMOVE_CASE', caseId)
      await dispatch('loadDashboardStats')
    },
    async handleUpgradeToChief({ commit }, username) {
      const res = await upgradeToChief(username)
      commit('UPDATE_USER', { username, updates: { role: res.data.role } })
    },
    async handleDowngradeToResident({ commit }, username) {
      const res = await downgradeToResident(username)
      commit('UPDATE_USER', { username, updates: { role: res.data.role } })
    },
    async handleSuspendUser({ commit }, username) {
      const res = await suspendUser(username)
      commit('UPDATE_USER', { username, updates: { isSuspended: res.data.isSuspended, suspendedAt: res.data.suspendedAt } })
    },
    async handleUnsuspendUser({ commit }, username) {
      const res = await unsuspendUser(username)
      commit('UPDATE_USER', { username, updates: { isSuspended: res.data.isSuspended, suspendedAt: res.data.suspendedAt } })
    }
  }
}
