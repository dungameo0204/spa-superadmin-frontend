const base = import.meta.env.VITE_API_BASE_URL || ''

export async function request(path, { method = 'GET', token, body, query, signal } = {}) {
  const url = new URL(`${base}${path}`, window.location.origin)
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  })
  const response = await fetch(url, {
    method, signal,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const json = await response.json().catch(() => ({}))
  if (!response.ok) throw Object.assign(new Error(json.message || 'Yêu cầu không thành công.'), { status: response.status })
  return json
}

const idPath = id => `/api/tenants/${encodeURIComponent(id)}`
export const api = {
  login: body => request('/api/auth/login', { method: 'POST', body }),
  list: (token, query, signal) => request('/api/tenants', { token, query, signal }),
  detail: (token, id) => request(idPath(id), { token }),
  managers: (token, id) => request(`${idPath(id)}/managers`, { token }),
  create: (token, body) => request('/api/tenants/create', { method: 'POST', token, body }),
  update: (token, id, body) => request(idPath(id), { method: 'PUT', token, body }),
  renew: (token, id, years) => request(`${idPath(id)}/renew`, { method: 'POST', token, body: { years } }),
  disable: (token, id) => request(idPath(id), { method: 'DELETE', token }),
  restore: (token, id) => request(`${idPath(id)}/restore`, { method: 'PATCH', token }),
  resetPassword: (token, id, userId, newPassword) => request(`${idPath(id)}/managers/${encodeURIComponent(userId)}/password`, { method: 'PATCH', token, body: { newPassword } }),
}