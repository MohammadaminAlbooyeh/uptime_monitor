import axios from 'axios'

const defaultApiUrl = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`
const api = axios.create({ baseURL: defaultApiUrl })

export async function fetchSites() {
  const r = await api.get('/sites')
  return r.data
}

export async function fetchChecks(siteId, hours = null) {
  const params = hours ? { hours } : {}
  const r = await api.get(`/sites/${siteId}/checks`, { params })
  return r.data
}

export async function createSite(name, url) {
  const r = await api.post('/sites', { name, url })
  return r.data
}

export async function deleteSite(siteId) {
  const r = await api.delete(`/sites/${siteId}`)
  return r.data
}

export async function runChecksNow() {
  const r = await api.post('/check-now')
  return r.data
}

export function connectWebSocket(onCheck) {
  const wsUrl = defaultApiUrl.replace(/^http/, 'ws') + '/ws'
  let ws = new WebSocket(wsUrl)
  let reconnectTimer = null

  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data)
      if (msg.type === 'check' && onCheck) {
        onCheck(msg.site_id, msg.check)
      }
    } catch { /* ignore */ }
  }

  ws.onclose = () => {
    reconnectTimer = setTimeout(() => {
      ws = connectWebSocket(onCheck)
    }, 3000)
  }

  ws.onerror = () => ws.close()

  return {
    close: () => {
      clearTimeout(reconnectTimer)
      ws.close()
    }
  }
}

export default api
