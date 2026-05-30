import Vue from 'vue'
import Vuex from 'vuex'
import auth from './modules/auth'
import cases from './modules/cases'
import admin from './modules/admin'

Vue.use(Vuex)

// 建立 Vuex Store 實例，將 auth、cases、admin 三個模組註冊進去
export default new Vuex.Store({
  modules: {
    auth,   // 認證與權限管理
    cases,  // 案件管理
    admin   // 後台管理
  }
})
