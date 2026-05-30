import { post } from '@/api/http'

export function login(username, password) {
  return post('/login', { username, password })
}

export function register({ username, password, name, role }) {
  return post('/register', { username, password, name, role })
}

export function logout() {
  return post('/logout')
}
