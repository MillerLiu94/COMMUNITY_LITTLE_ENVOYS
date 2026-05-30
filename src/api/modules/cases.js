import { get, post, patch } from '@/api/http'

export function fetchCases() {
  return get('/cases')
}

export function fetchCasesPaginated({ page = 1, perPage = 9, search = '', status = '', sortBy = 'latest', isDeleted } = {}) {
  const params = { _page: page, _per_page: perPage }
  if (search) params._search = search
  if (status) params._status = status
  if (isDeleted !== undefined) params._is_deleted = isDeleted
  if (sortBy === 'hot') {
    params._sortBy = 'hot'
  } else {
    params._sort = 'createdAt'
    params._order = 'desc'
  }
  return get('/cases', params)
}

export function fetchCase(id) {
  return get(`/cases/${id}`)
}

export function createCase(data) {
  return post('/cases', data)
}

export function updateCase(id, data) {
  return patch(`/cases/${id}`, data)
}
