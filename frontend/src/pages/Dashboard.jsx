import React, {useEffect, useState} from 'react'
import ResponseChart from '../components/ResponseChart'
import IncidentTable from '../components/IncidentTable'
import {fetchChecks, fetchSites, runChecksNow} from '../services/api'

function uptimePercent(checks){
  if (!checks?.length) return 100
  return Math.round(checks.filter(c => c.status === 'OK').length / checks.length * 100)
}

function statusOf(checks){
  const s = checks?.[0]?.status
  if (!s) return 'unknown'
  return s === 'OK' ? 'ok' : 'fail'
}

export default function Dashboard(){
  const [sites, setSites] = useState([])
  const [checksBySite, setChecksBySite] = useState({})
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  async function loadData(){
    try {
      const siteList = await fetchSites()
      const ordered = (() => {
        const copy = Array.isArray(siteList) ? [...siteList] : []
        const idx = copy.findIndex(s => s.url === 'http://showcase-website-amin.s3-website.eu-north-1.amazonaws.com/')
        if (idx > 0) { const [item] = copy.splice(idx,1); copy.unshift(item) }
        return copy
      })()
      setSites(ordered)
      if (ordered.length > 0 && !selectedId) setSelectedId(ordered[0].id)
      const entries = await Promise.all(
        siteList.map(async site => {
          try { return [site.id, await fetchChecks(site.id)] } catch { return [site.id, []] }
        })
      )
      setChecksBySite(Object.fromEntries(entries))
    } catch {
      setError('Could not reach backend.')
      setSites([])
    }
  }

  useEffect(() => {
    setLoading(true)
    loadData().finally(() => setLoading(false))
  }, [])

  async function handleRefresh(){
    setRefreshing(true)
    try { await runChecksNow(); await loadData() } finally { setRefreshing(false) }
  }

  const allOk = sites.every(s => statusOf(checksBySite[s.id] || []) !== 'fail')
  const healthyCount = sites.filter(s => statusOf(checksBySite[s.id] || []) === 'ok').length
  const failCount = sites.filter(s => statusOf(checksBySite[s.id] || []) === 'fail').length
  const avgUptime = sites.length === 0 ? 100
    : Math.round(sites.reduce((sum,s) => sum + uptimePercent(checksBySite[s.id] || []), 0) / sites.length)

  const selected = sites.find(s => s.id === selectedId) || null
  const selChecks = selected ? checksBySite[selected.id] || [] : []
  const selUptime = uptimePercent(selChecks)
  const selStatus = statusOf(selChecks)
  const selLatency = selChecks[0]?.response_time_ms ? Math.round(selChecks[0].response_time_ms) : null
  const selUp = selChecks.filter(c => c.status === 'OK').length
  const selDown = selChecks.filter(c => c.status !== 'OK').length
  const selLastCheck = selChecks[0]?.timestamp ? new Date(selChecks[0].timestamp).toLocaleString() : '—'
  const selSeries = selChecks.filter(c => typeof c.response_time_ms === 'number').slice(0,20).reverse().map(c => Math.round(c.response_time_ms))
  const selIncidents = selChecks.filter(c => c.status === 'FAIL').slice(0,8).map(c => ({
    when: new Date(c.timestamp).toLocaleString(),
    site: selected?.name,
    duration: 'n/a',
    statusCode: c.status_code ?? 'timeout',
  }))

  return (
    <>
      {/* Status Banner */}
      <div className={`status-banner ${allOk ? 'all-ok' : 'has-issues'}`}>
        <span className="status-banner-dot" />
        {allOk ? 'All systems operational' : `${failCount} monitor${failCount > 1 ? 's' : ''} down`}
        <span className="status-banner-meta">
          {loading ? 'Syncing...' : `${sites.length} monitors · avg ${avgUptime}% uptime`}
        </span>
      </div>

      {/* Summary Stats */}
      <div className="summary-stats">
        <div className="stat-box">
          <div className="stat-box-label">Total Monitors</div>
          <div className="stat-box-value">{sites.length}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">Up</div>
          <div className="stat-box-value ok">{healthyCount}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">Down</div>
          <div className="stat-box-value fail">{failCount || '0'}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">Avg Uptime</div>
          <div className="stat-box-value">{avgUptime}%</div>
        </div>
      </div>

      {/* Monitor List */}
      <div className="monitor-list-header">
        <h2>Monitors</h2>
        {error && <span className="error-text">{error}</span>}
      </div>

      <div className="monitor-list">
        {sites.length === 0 && !loading && (
          <div style={{padding:'20px 16px'}} className="muted">No monitors configured yet.</div>
        )}
        {sites.map(site => {
          const checks = checksBySite[site.id] || []
          const st = statusOf(checks)
          const up = uptimePercent(checks)
          const ms = checks[0]?.response_time_ms ? Math.round(checks[0].response_time_ms) : null
          const barClass = up >= 90 ? '' : up >= 70 ? 'warn' : 'fail'
          return (
            <div
              key={site.id}
              className={`monitor-row ${site.id === selectedId ? 'active' : ''}`}
              onClick={() => setSelectedId(site.id)}
            >
              <span className={`monitor-status-dot ${st}`} />
              <div>
                <div className="monitor-name">{site.name}</div>
                <div className="monitor-url">{site.url}</div>
              </div>
              <div className="monitor-uptime-col">
                <div className="monitor-uptime-label">{up}% uptime</div>
                <div className="mini-bar-track">
                  <div className={`mini-bar-fill ${barClass}`} style={{width:`${up}%`}} />
                </div>
              </div>
              <div className="monitor-response">
                {ms ? `${ms} ms` : '—'}
                <small>response</small>
              </div>
              <span className={`monitor-badge ${st}`}>{st.toUpperCase()}</span>
            </div>
          )
        })}
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="detail-panel">
          <div className="detail-panel-header">
            <div>
              <div className="detail-panel-title">{selected.name}</div>
              <div className="detail-panel-url">
                <a href={selected.url} target="_blank" rel="noopener noreferrer">{selected.url}</a>
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? 'Checking...' : 'Check now'}
            </button>
          </div>
          <div className="detail-panel-body">
            <div className="detail-stats">
              <div className="detail-stat">
                <div className="detail-stat-label">Status</div>
                <div className={`detail-stat-value ${selStatus}`}>{selStatus.toUpperCase()}</div>
              </div>
              <div className="detail-stat">
                <div className="detail-stat-label">Uptime</div>
                <div className="detail-stat-value">{selUptime}%</div>
              </div>
              <div className="detail-stat">
                <div className="detail-stat-label">Response</div>
                <div className="detail-stat-value">{selLatency ? `${selLatency} ms` : '—'}</div>
              </div>
              <div className="detail-stat">
                <div className="detail-stat-label">Last Check</div>
                <div className="detail-stat-value" style={{fontSize:'0.82rem'}}>{selLastCheck}</div>
              </div>
            </div>

            <div className="uptime-bar-wrap">
              <div className="uptime-bar-head">
                <span>Uptime ({selChecks.length} checks)</span>
                <span>{selUp} up · {selDown} down</span>
              </div>
              <div className="uptime-bar-track">
                <div className="uptime-bar-fill" style={{width:`${selUptime}%`}} />
              </div>
            </div>

            <ResponseChart data={selSeries} />
            <IncidentTable incidents={selIncidents} />
          </div>
        </div>
      )}
    </>
  )
}
