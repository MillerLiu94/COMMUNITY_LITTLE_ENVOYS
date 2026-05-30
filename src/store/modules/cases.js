import { fetchCasesPaginated, createCase, updateCase } from '@/api/modules/cases'

export default {
  namespaced: true,
  state: {
    items: [],
    meta: { total: 0, page: 1, perPage: 9 },
    loading: false,
    searchKeyword: '',
    statusFilter: '',
    sortMode: 'latest',
    showCreate: false
  },
  getters: {
    allCases(state) { return state.items },
    cases(state) { return state.items },
    filteredCases(state) { return state.items },
    meta(state) { return state.meta },
    searchKeyword(state) { return state.searchKeyword },
    statusFilter(state) { return state.statusFilter },
    sortMode(state) { return state.sortMode },
    isLoading(state) { return state.loading },
    showCreate(state) { return state.showCreate },
    getCaseById(state) {
      return (id) => state.items.find(c => c.id === id)
    }
  },
  mutations: {
    SET_CASES(state, cases) { state.items = cases },
    SET_META(state, meta) { Object.assign(state.meta, meta) },
    SET_LOADING(state, val) { state.loading = val },
    ADD_COMMENT(state, { caseId, comment }) {
      const c = state.items.find(item => item.id === caseId)
      if (c) {
        if (!c.comments) c.comments = []
        c.comments.push(comment)
      }
    },
    UPDATE_STATUS(state, { caseId, status }) {
      const c = state.items.find(item => item.id === caseId)
      if (c) c.status = status
    },
    DELETE_CASE(state, { caseId }) {
      state.items = state.items.filter(item => item.id !== caseId)
      state.meta.total = Math.max(0, state.meta.total - 1)
    },
    REJECT_CASE(state, { caseId, rejectReason, rejectedBy }) {
      const c = state.items.find(item => item.id === caseId)
      if (c) {
        c.status = 'pending'
        c.rejectReason = rejectReason
        c.rejectedBy = rejectedBy
      }
    },
    EDIT_CASE(state, { caseId, updates }) {
      const c = state.items.find(item => item.id === caseId)
      if (c && c.status === 'pending') Object.assign(c, updates)
    },
    ADD_CASE(state, caseData) { state.items.unshift(caseData) },
    SET_SEARCH_KEYWORD(state, keyword) { state.searchKeyword = keyword },
    SET_STATUS_FILTER(state, filter) { state.statusFilter = filter },
    SET_SORT_MODE(state, mode) { state.sortMode = mode },
    SET_SHOW_CREATE(state, val) { state.showCreate = val }
  },
  actions: {
    async loadCasesPaginated({ commit, state, rootGetters }) {
      commit('SET_LOADING', true)
      try {
        const currentRole = rootGetters['auth/currentRole']
        const isDeleted = currentRole !== 'admin' ? false : undefined
        const res = await fetchCasesPaginated({
          page: state.meta.page,
          perPage: state.meta.perPage,
          search: state.searchKeyword,
          status: state.statusFilter,
          sortBy: state.sortMode,
          isDeleted
        })
        commit('SET_CASES', res.data.cases)
        commit('SET_META', {
          total: res.data.total,
          page: res.data.page,
          perPage: res.data.perPage
        })
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async addCase({ commit }, caseData) {
      const res = await createCase(caseData)
      commit('ADD_CASE', res.data)
    },
    async addComment({ commit, state }, { caseId, comment }) {
      const c = state.items.find(item => item.id === caseId)
      if (!c) return
      const updatedComments = [...(c.comments || []), comment]
      await updateCase(caseId, { comments: updatedComments })
      commit('ADD_COMMENT', { caseId, comment })
    },
    async updateCaseStatus({ commit }, { caseId, status }) {
      await updateCase(caseId, { status })
      commit('UPDATE_STATUS', { caseId, status })
    },
    async editCase({ commit }, { caseId, updates }) {
      await updateCase(caseId, updates)
      commit('EDIT_CASE', { caseId, updates })
    },
    async rejectCase({ commit }, { caseId, rejectReason, rejectedBy }) {
      const updates = {
        status: 'pending',
        rejectReason,
        rejectedBy
      }
      await updateCase(caseId, updates)
      commit('REJECT_CASE', { caseId, ...updates })
    },
    async deleteCase({ commit }, { caseId, deletedBy }) {
      const updates = {
        is_deleted: true,
        deletedAt: Date.now(),
        deletedBy
      }
      await updateCase(caseId, updates)
      commit('DELETE_CASE', { caseId, deletedBy })
    }
  }
}
