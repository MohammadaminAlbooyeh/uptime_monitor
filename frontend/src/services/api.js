import axios from 'axios'

const defaultApiUrl = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`
const api = axios.create({ baseURL: defaultApiUrl })

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
