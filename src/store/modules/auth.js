import { login, logout, register } from '@/api/modules/auth'

// 角色權限對照表
// - resident（居民）：可新增、可刪除自己的案件、不可更改狀態
// - chief（里長）：可新增、可刪除自己的案件、可更改狀態、可駁回
// - admin（管理員）：不可新增、可刪除所有案件、可更改狀態
const permissionsMap = {
  resident: {
    canCreate: true,
    canDelete: 'own',
    canChangeStatus: false
  },
  chief: {
    canCreate: true,
    canDelete: 'own',
    canChangeStatus: true,
    canReject: true
  },
  admin: {
    canCreate: false,
    canDelete: 'all',
    canChangeStatus: true
  }
}

// 角色中文名稱對照表
const roleLabelMap = {
  resident: '居民',
  chief: '里長',
  admin: '管理員'
}

export default {
  namespaced: true,
  // ── 狀態 ──────────────────────────────────────────────
  state: {
    role: JSON.parse(localStorage.getItem('auth_role') || 'null'),
    userName: localStorage.getItem('auth_userName') || '',
    users: [                 // 內建使用者清單
      { username: 'resident', password: '123', name: '王小明', role: 'resident', isSuspended: false, suspendedAt: null },
      { username: 'chief', password: '123', name: '陳里長', role: 'chief', isSuspended: false, suspendedAt: null },
      { username: 'admin', password: '123', name: '系統管理員', role: 'admin', isSuspended: false, suspendedAt: null }
    ]
  },
  // ── 取值器 ────────────────────────────────────────────
  getters: {
    currentRole(state) {
      return state.role
    },
    isLoggedIn(state) {
      // 是否已登入
      return state.role !== null
    },
    permissions(state) {
      // 根據當前角色回傳對應權限
      return permissionsMap[state.role] || {}
    },
    canCreate(state, getters) {
      // 是否有新增權限
      return getters.permissions.canCreate
    },
    canDelete(state, getters) {
      // 刪除權限（'own' | 'all' | false）
      return getters.permissions.canDelete
    },
    canChangeStatus(state, getters) {
      // 是否有更改狀態權限
      return getters.permissions.canChangeStatus
    },
    canReject(state, getters) {
      // 是否有駁回權限
      return getters.permissions.canReject
    },
    roleLabel(state) {
      // 角色中文名稱
      return roleLabelMap[state.role] || ''
    },
    userName(state) {
      return state.userName
    },
    isAdmin(state) {
      // 是否為管理員
      return state.role === 'admin'
    },
    currentUser(state) {
      // 根據 userName 回傳完整使用者資料
      return state.users.find(u => u.name === state.userName) || null
    }
  },
  // ── 突變（同步修改 state）─────────────────────────────
  mutations: {
    SET_ROLE(state, { role, userName }) {
      // 設定角色與使用者名稱
      state.role = role
      state.userName = userName
    },
    CLEAR_ROLE(state) {
      // 清除登入狀態（登出）
      state.role = null
      state.userName = ''
    },
    REGISTER_USER(state, user) {
      // 註冊新使用者
      state.users.push(user)
    }
  },
  // ── 動作（非同步或含副作用邏輯）─────────────────────────
  actions: {
    async setRole({ commit }, { selectedRole, userName, password }) {
      let res
      try {
        res = await login(userName, password)
      } catch (err) {
        const msg = err?.response?.data?.error || '登入失敗'
        throw new Error(msg)
      }
      if (selectedRole && res.data.role !== selectedRole) {
        throw new Error('角色身分選擇錯誤')
      }
      commit('SET_ROLE', { role: res.data.role, userName: res.data.name })
      localStorage.setItem('auth_role', JSON.stringify(res.data.role))
      localStorage.setItem('auth_userName', res.data.name)
    },
    async registerUser({ commit }, user) {
      if (!user.username.trim() || !user.password) return
      try {
        await register({
          username: user.username.trim(),
          password: user.password,
          name: user.name.trim(),
          role: 'resident'
        })
        commit('REGISTER_USER', {
          username: user.username.trim(),
          password: user.password,
          name: user.name.trim(),
          role: 'resident',
          isSuspended: false,
          suspendedAt: null
        })
      } catch (err) {
        const msg = err?.response?.data?.error || '註冊失敗'
        throw new Error(msg)
      }
    },
    async logout({ commit }) {
      // 登出：呼叫 API 後清除角色
      try {
        await logout()
      } catch {
        // 即使 API 失敗仍清除本地狀態
      }
      commit('CLEAR_ROLE')
      localStorage.removeItem('auth_role')
      localStorage.removeItem('auth_userName')
    }
  }
}
