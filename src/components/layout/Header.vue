<template>
  <header class="header">
    <div class="header__left">
      <img class="header__logo" src="@/assets/img/social-media.png" alt="社區小尖兵">
      <span class="header__title">社區小尖兵</span>
    </div>
    <CaseToolbar v-if="isLoggedIn && !isAdminPage" />
    <div class="header__right" v-if="isLoggedIn">
      <router-link v-if="isAdmin" class="header__admin-link" :to="adminLinkTo">{{ adminLinkText }}</router-link>
      <span class="header__badge" :class="'header__badge--' + role">{{ roleLabel }}</span>
      <span class="header__user">{{ userName }}</span>
      <button class="header__logout" @click="handleLogout">登出</button>
    </div>
  </header>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import CaseToolbar from '@/components/cases/toolbar/CaseToolbar.vue'

export default {
  name: 'AppHeader',
  components: { CaseToolbar },
  computed: {
    ...mapGetters('auth', ['isLoggedIn', 'roleLabel', 'userName', 'currentRole', 'isAdmin']),

    role() {
      return this.currentRole
    },
    isAdminPage() {
      return this.$route.path === '/admin'
    },
    adminLinkTo() {
      return this.isAdminPage ? '/home' : '/admin'
    },
    adminLinkText() {
      return this.isAdminPage ? '回首頁' : '後台管理'
    }
  },
  methods: {
    ...mapActions('auth', ['logout']),
    async handleLogout() {
      await this.logout()
      this.$router.push('/login')
    }
  }
}
</script>

<style>
.header__admin-link {
  color: color-mix(in srgb, var(--color-secondary) 30%, white);
  text-decoration: none;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  margin-right: var(--spacing-lg);
  padding: var(--spacing-xs) var(--spacing-md);
  border: 1px solid color-mix(in srgb, var(--color-secondary) 30%, white);
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.header__admin-link:hover {
  background: var(--color-secondary);
  border-color: var(--color-secondary);
  color: #fff;
}
</style>
