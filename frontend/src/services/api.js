import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000' })

export async function fetchSites(){
  const r = await api.get('/sites')
  return r.data
}

export async function fetchChecks(siteId){
  const r = await api.get(`/sites/${siteId}/checks`)
  return r.data
}

export async function runChecksNow(){
  const r = await api.post('/check-now')
  return r.data
}

export default api
