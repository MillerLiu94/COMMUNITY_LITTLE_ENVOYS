import store from '@/store'
import Login from '@/views/Login.vue'
import Home from '@/views/Home.vue'
import Admin from '@/views/Admin.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/home/filter',
    name: 'HomeFilter',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: Admin,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/',
    redirect: () => {
      return store.getters['auth/isLoggedIn'] ? '/home' : '/login'
    }
  }
]

export default routes
