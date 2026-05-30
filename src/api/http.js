import api from './index'

export function get(url, params) {
  return api.get(url, { params })
}

export function post(url, data) {
  return api.post(url, data)
}

export function patch(url, data) {
  return api.patch(url, data)
}

export function del(url) {
  return api.delete(url)
}
