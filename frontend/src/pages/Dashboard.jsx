import React, { useEffect, useState, useCallback } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { fetchChecks, fetchSites, runChecksNow, createSite, deleteSite, connectWebSocket } from '../services/api'

function uptimePercent(checks) {
  if (!checks?.length) return 100
  return Math.round(checks.filter(c => c.status === 'OK').length / checks.length * 100)
}

function statusOf(checks) {
  const s = checks?.[0]?.status
  if (!s) return 'unknown'
  return s === 'OK' ? 'ok' : 'fail'
}

const RANGES = [
  { label: '24h', hours: 24 },
  { label: '7d', hours: 168 },
  { label: '30d', hours: 720 },
]

function SkeletonRow() {
  return (
    <div className="monitor-row skeleton-row">
      <span className="skeleton skeleton-circle" />
      <div className="skeleton-text-group">
        <div className="skeleton skeleton-text skeleton-text-name" />
        <div className="skeleton skeleton-text skeleton-text-url" />
      </div>
      <div className="skeleton skeleton-bar" />
      <div className="skeleton skeleton-text skeleton-text-ms" />
      <div className="skeleton skeleton-badge" />
    </div>
  )
}

export default function Dashboard() {
  const [sites, setSites] = useState([])
  const [checksBySite, setChecksBySite] = useState({})
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [range, setRange] = useState(RANGES[0])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [deleting, setDeleting] = useState(null)

  const hours = range.hours

  const loadData = useCallback(async (h) => {
    try {
      const siteList = await fetchSites()
      const ordered = (() => {
        const copy = Array.isArray(siteList) ? [...siteList] : []
        const idx = copy.findIndex(s => s.url === 'http://showcase-website-amin.s3-website.eu-north-1.amazonaws.com/')
        if (idx > 0) { const [item] = copy.splice(idx, 1); copy.unshift(item) }
        return copy
      })()
      setSites(ordered)
      if (ordered.length > 0 && !selectedId) setSelectedId(ordered[0].id)
      const entries = await Promise.all(
        siteList.map(async site => {
          try { return [site.id, await fetchChecks(site.id, h)] } catch { return [site.id, []] }
        })
      )
      setChecksBySite(Object.fromEntries(entries))
    } catch {
      setError('Could not reach backend.')
      setSites([])
    }
  }, [selectedId])

  useEffect(() => {
    setLoading(true)
    loadData(hours).finally(() => setLoading(false))
  }, [hours, loadData])

  useEffect(() => {
    const ws = connectWebSocket((siteId, check) => {
      setChecksBySite(prev => {
        const existing = prev[siteId] || []
        return { ...prev, [siteId]: [check, ...existing].slice(0, 50) }
      })
    })
    return () => ws.close()
  }, [])

  async function handleRefresh() {
    setRefreshing(true)
    try { await runChecksNow(); await loadData(hours) } finally { setRefreshing(false) }
  }

  async function handleAddSite(e) {
    e.preventDefault()
    if (!newName.trim() || !newUrl.trim()) return
    setAdding(true)
    setAddError('')
    try {
      await createSite(newName.trim(), newUrl.trim())
      setNewName('')
      setNewUrl('')
      setShowAddForm(false)
      await loadData(hours)
    } catch {
      setAddError('Failed to add site. Is the URL valid?')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(siteId) {
    if (deleting) return
    setDeleting(siteId)
    try {
      await deleteSite(siteId)
      const next = sites.filter(s => s.id !== siteId)
      setSites(next)
      setChecksBySite(prev => { const n = { ...prev }; delete n[siteId]; return n })
      if (selectedId === siteId) setSelectedId(next[0]?.id || null)
    } catch {
      setError('Failed to delete site.')
    } finally {
      setDeleting(null)
    }
  }

  const allOk = sites.every(s => statusOf(checksBySite[s.id] || []) !== 'fail')
  const healthyCount = sites.filter(s => statusOf(checksBySite[s.id] || []) === 'ok').length
  const failCount = sites.filter(s => statusOf(checksBySite[s.id] || []) === 'fail').length
  const avgUptime = sites.length === 0 ? 100
    : Math.round(sites.reduce((sum, s) => sum + uptimePercent(checksBySite[s.id] || []), 0) / sites.length)

  const selected = sites.find(s => s.id === selectedId) || null
  const selChecks = selected ? checksBySite[selected.id] || [] : []
  const selUptime = uptimePercent(selChecks)
  const selStatus = statusOf(selChecks)
  const selLatest = selChecks[0]
  const selLatency = selLatest?.response_time_ms ? Math.round(selLatest.response_time_ms) : null
  const selUp = selChecks.filter(c => c.status === 'OK').length
  const selDown = selChecks.filter(c => c.status !== 'OK').length
  const selLastCheck = selLatest?.timestamp ? new Date(selLatest.timestamp).toLocaleString() : '—'
  const selSeries = [...selChecks].reverse().map(c => ({
    t: new Date(c.timestamp).toLocaleTimeString(),
    ms: c.response_time_ms ? Math.round(c.response_time_ms) : null,
  }))
  const selIncidents = selChecks.filter(c => c.status === 'FAIL').slice(0, 8).map(c => ({
    when: new Date(c.timestamp).toLocaleString(),
    site: selected?.name,
    duration: 'n/a',
    statusCode: c.status_code ?? 'timeout',
  }))

  return (
    <>
      <div className={`status-banner ${allOk ? 'all-ok' : 'has-issues'}`}>
        <span className="status-banner-dot" />
        {loading ? 'Loading…' : allOk ? 'All systems operational' : `${failCount} monitor${failCount > 1 ? 's' : ''} down`}
        <span className="status-banner-meta">
          {loading ? '…' : `${sites.length} monitors · avg ${avgUptime}% uptime`}
        </span>
      </div>

      <div className="summary-stats">
        <div className="stat-box">
          <div className="stat-box-label">Total Monitors</div>
          <div className="stat-box-value">{loading ? '…' : sites.length}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">Up</div>
          <div className="stat-box-value ok">{loading ? '…' : healthyCount}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">Down</div>
          <div className="stat-box-value fail">{loading ? '…' : (failCount || '0')}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">Avg Uptime</div>
          <div className="stat-box-value">{loading ? '…' : `${avgUptime}%`}</div>
        </div>
      </div>

      <div className="monitor-list-header">
        <h2>Monitors</h2>
        <div className="monitor-list-actions">
          {error && <span className="error-text">{error}</span>}
          <button className="btn btn-primary" onClick={() => setShowAddForm(o => !o)}>
            {showAddForm ? 'Cancel' : '+ Add'}
          </button>
          <button className="btn" onClick={handleRefresh} disabled={refreshing || loading}>
            {refreshing ? '…' : 'Refresh'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <form className="add-site-form" onSubmit={handleAddSite}>
          <input
            className="add-site-input"
            placeholder="Site name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            required
          />
          <input
            className="add-site-input"
            placeholder="https://example.com"
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            required
            type="url"
          />
          <button className="btn btn-primary" type="submit" disabled={adding}>
            {adding ? 'Adding…' : 'Add'}
          </button>
          {addError && <span className="error-text">{addError}</span>}
        </form>
      )}

      <div className="monitor-list">
        {loading && (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        )}
        {!loading && sites.length === 0 && (
          <div className="empty-state">
            <p className="muted">No monitors configured yet.</p>
            <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>Add your first monitor</button>
          </div>
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
              <div className="monitor-name-col">
                <div className="monitor-name">{site.name}</div>
                <div className="monitor-url">{site.url}</div>
              </div>
              <div className="monitor-uptime-col">
                <div className="monitor-uptime-label">{up}% uptime</div>
                <div className="mini-bar-track">
                  <div className={`mini-bar-fill ${barClass}`} style={{ width: `${up}%` }} />
                </div>
              </div>
              <div className="monitor-response">
                {ms ? `${ms} ms` : '—'}
                <small>response</small>
              </div>
              <span className={`monitor-badge ${st}`}>{st.toUpperCase()}</span>
              <button
                className="monitor-delete-btn"
                title="Delete monitor"
                disabled={deleting === site.id}
                onClick={e => { e.stopPropagation(); if (window.confirm(`Delete "${site.name}"?`)) handleDelete(site.id) }}
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>

      {selected && (
        <div className="detail-panel">
          <div className="detail-panel-header">
            <div>
              <div className="detail-panel-title">{selected.name}</div>
              <div className="detail-panel-url">
                <a href={selected.url} target="_blank" rel="noopener noreferrer">{selected.url}</a>
              </div>
            </div>
            <div className="detail-panel-actions">
              <button
                className="btn btn-danger"
                disabled={deleting === selected.id}
                onClick={() => { if (window.confirm(`Delete "${selected.name}"?`)) handleDelete(selected.id) }}
              >
                {deleting === selected.id ? '…' : 'Delete'}
              </button>
              <button className="btn btn-primary" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? 'Checking…' : 'Check now'}
              </button>
            </div>
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
                <div className="detail-stat-value" style={{ fontSize: '0.82rem' }}>{selLastCheck}</div>
              </div>
            </div>

            <div className="uptime-bar-wrap">
              <div className="uptime-bar-head">
                <span>Uptime ({selChecks.length} checks)</span>
                <span>{selUp} up · {selDown} down</span>
              </div>
              <div className="uptime-bar-track">
                <div className="uptime-bar-fill" style={{ width: `${selUptime}%` }} />
              </div>
            </div>

            <div className="chart-wrap">
              <div className="chart-head">
                <h3>Response Time</h3>
                <div className="range-toggle">
                  {RANGES.map(r => (
                    <button
                      key={r.label}
                      className={`range-btn ${r.label === range.label ? 'active' : ''}`}
                      onClick={() => setRange(r)}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              {selSeries.length > 0 && selSeries.some(d => d.ms != null) ? (
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={selSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#58a6ff" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#58a6ff" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#7d8590' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: '#7d8590' }} unit=" ms" />
                    <Tooltip
                      contentStyle={{ background: '#1c2330', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, fontSize: 12 }}
                      labelStyle={{ color: '#e6edf3' }}
                    />
                    <Area type="monotone" dataKey="ms" stroke="#58a6ff" strokeWidth={2} fill="url(#chartFill)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty">No response-time data yet.</div>
              )}
            </div>

            <div className="incidents-section">
              <h3 className="incidents-title">Recent Incidents</h3>
              {selIncidents.length === 0 ? (
                <p className="muted">No downtime incidents detected in recent checks.</p>
              ) : (
                <table className="incidents-table">
                  <thead>
                    <tr><th>When</th><th>Site</th><th>Duration</th><th>Code</th></tr>
                  </thead>
                  <tbody>
                    {selIncidents.map((it, i) => (
                      <tr key={i}>
                        <td>{it.when}</td>
                        <td>{it.site}</td>
                        <td>{it.duration}</td>
                        <td>{it.statusCode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
