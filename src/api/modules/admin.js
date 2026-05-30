import { get, patch, del } from '@/api/http'

export function fetchDashboardStats() {
  return get('/admin/stats')
}

export function fetchCasesPaginated({ page = 1, perPage = 20, search = '', status = '', category = '', sort = 'createdAt', order = 'desc' } = {}) {
  const params = { _page: page, _per_page: perPage, _sort: sort, _order: order }
  if (search) params._search = search
  if (status) params._status = status
  if (category) params._category = category
  return get('/cases', params)
}

export function deleteCase(caseId) {
  return del(`/cases/${caseId}`)
}

export function fetchUsersPaginated({ page = 1, perPage = 20, search = '', role = '', suspended } = {}) {
  const params = { _page: page, _per_page: perPage }
  if (search) params._search = search
  if (role) params._role = role
  if (suspended !== undefined) params._suspended = suspended
  return get('/users', params)
}

export function upgradeToChief(username) {
  return patch(`/users/${username}`, { role: 'chief' })
}

export function downgradeToResident(username) {
  return patch(`/users/${username}`, { role: 'resident' })
}

export function suspendUser(username) {
  return patch(`/users/${username}`, {
    isSuspended: true,
    suspendedAt: Date.now()
  })
}

export function unsuspendUser(username) {
  return patch(`/users/${username}`, {
    isSuspended: false,
    suspendedAt: null
  })
}
