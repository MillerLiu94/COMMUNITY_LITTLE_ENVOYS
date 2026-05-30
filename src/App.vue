<template>
  <div id="app-root">
    <AppHeader v-if="showHeader" />
    <main class="main">
      <router-view />
    </main>
    <AppFooter v-if="showFooter" />
  </div>
</template>

<script>
import AppHeader from '@/components/layout/Header.vue'
import AppFooter from '@/components/layout/Footer.vue'
import { mapGetters } from 'vuex'

export default {
  name: 'App',
  components: { AppHeader, AppFooter },
  computed: {
    ...mapGetters('auth', ['isLoggedIn']),
    showHeader() {
      return this.isLoggedIn && this.$route.path !== '/login'
    },
    showFooter() {
      return this.isLoggedIn && this.$route.path !== '/login'
    }
  }
}
</script>

<style>
</style>
