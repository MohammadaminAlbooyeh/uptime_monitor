import React, {useEffect, useState} from 'react'
import SiteCard from '../components/SiteCard'
import ResponseChart from '../components/ResponseChart'
import UptimeBar from '../components/UptimeBar'
import IncidentTable from '../components/IncidentTable'
import {fetchChecks, fetchSites, runChecksNow} from '../services/api'

function computeUptimePercent(checks){
  if (!checks || checks.length === 0) return 100
  const okCount = checks.filter((item) => item.status === 'OK').length
  return Math.round((okCount / checks.length) * 100)
}

function computeIncidents(checks, siteName){
  if (!checks || checks.length === 0) return []
  return checks
    .filter((item) => item.status === 'FAIL')
    .slice(0, 8)
    .map((item) => ({
      when: new Date(item.timestamp).toLocaleString(),
      site: siteName,
      duration: 'n/a',
      statusCode: item.status_code ?? 'timeout',
    }))
}

export default function Dashboard(){
  const [sites, setSites] = useState([])
  const [checksBySite, setChecksBySite] = useState({})
  const [selectedSiteId, setSelectedSiteId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(()=>{
    async function load(){
      setLoading(true)
      setError('')
      try {
        const siteList = await fetchSites()
        // ensure Amin's personal site appears first when present
        const preferredUrl = 'http://showcase-website-amin.s3-website.eu-north-1.amazonaws.com/'
        const ordered = (() => {
          const copy = Array.isArray(siteList) ? [...siteList] : []
          const idx = copy.findIndex(s => s.url === preferredUrl)
          if (idx > 0) {
            const [item] = copy.splice(idx, 1)
            copy.unshift(item)
          }
          return copy
        })()
        setSites(ordered)
        if (ordered.length > 0) {
          setSelectedSiteId(ordered[0].id)
        }

        const entries = await Promise.all(
          siteList.map(async (site) => {
            try {
              const checks = await fetchChecks(site.id)
              return [site.id, checks]
            } catch {
              return [site.id, []]
            }
          })
        )
        setChecksBySite(Object.fromEntries(entries))
      } catch {
        setError('Could not reach backend. Showing empty state.')
        setSites([])
      } finally {
        setLoading(false)
      }
    }

    load()
  },[])

  async function handleRefresh(){
    setRefreshing(true)
    try {
      await runChecksNow()
      const siteList = await fetchSites()
      const preferredUrl = 'http://showcase-website-amin.s3-website.eu-north-1.amazonaws.com/'
      const ordered = (() => {
        const copy = Array.isArray(siteList) ? [...siteList] : []
        const idx = copy.findIndex(s => s.url === preferredUrl)
        if (idx > 0) {
          const [item] = copy.splice(idx, 1)
          copy.unshift(item)
        }
        return copy
      })()
      const entries = await Promise.all(
        siteList.map(async (site) => {
          try {
            const checks = await fetchChecks(site.id)
            return [site.id, checks]
          } catch {
            return [site.id, []]
          }
        })
      )
      setSites(ordered)
      setChecksBySite(Object.fromEntries(entries))
      if (!selectedSiteId && ordered.length > 0) {
        setSelectedSiteId(ordered[0].id)
      }
    } finally {
      setRefreshing(false)
    }
  }

  const selectedSite = sites.find((item) => item.id === selectedSiteId) || null
  const selectedChecks = selectedSite ? checksBySite[selectedSite.id] || [] : []
  const selectedUptime = computeUptimePercent(selectedChecks)
  const selectedIncidents = selectedSite ? computeIncidents(selectedChecks, selectedSite.name) : []
  const selectedResponseSeries = selectedChecks
    .filter((item) => typeof item.response_time_ms === 'number')
    .slice(0, 20)
    .reverse()
    .map((item) => Math.round(item.response_time_ms))
  const latestCheckTime = selectedChecks[0]?.timestamp
    ? new Date(selectedChecks[0].timestamp).toLocaleString()
    : 'No checks yet'

  const totalSites = sites.length
  const healthySites = sites.filter((site) => {
    const checks = checksBySite[site.id] || []
    return checks[0]?.status === 'OK'
  }).length
  const failingSites = sites.filter((site) => {
    const checks = checksBySite[site.id] || []
    return checks[0] && checks[0].status !== 'OK'
  }).length
  const avgUptime = sites.length === 0
    ? 100
    : Math.round(
        sites.reduce((sum, site) => sum + computeUptimePercent(checksBySite[site.id] || []), 0) / sites.length
      )

  const uptimeColor = avgUptime === 100 ? 'var(--ok)'
    : avgUptime >= 90 ? 'var(--warn)'
    : 'var(--fail)'

  return (
    <section className="dashboard-wrap">
      <div className="top-metrics">
        <div className="metric-card">
          <div className="metric-item">
            <small>Activity Monitoring</small>
            <strong>42</strong>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-item">
            <small>Status Pages</small>
            <strong>4</strong>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-item">
            <small>Number of Incidents</small>
            <strong>12</strong>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-item">
            <small>Global Uptime</small>
            <strong>99.28%</strong>
          </div>
        </div>
      </div>

      <section className="dashboard-grid">
      <div className="hero-panel card">
        <div className="hero-copy">
          <div className="hero-badge-row">
            <span className="live-pill">
              <span className="pulse-dot" />
              Real-time monitoring
            </span>
            <span className="hero-meta">Auto refresh every 60s</span>
          </div>
          <p>
            Watch response times, downtime incidents, and uptime health in a single screen designed to feel alive.
          </p>
          <div className="hero-actions">
            <button type="button" className="primary-action" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? 'Refreshing...' : 'Run live check'}
            </button>
            <div className="hero-note">
              <span className="hero-note-label">Selected site</span>
              <strong>{selectedSite ? selectedSite.name : 'None yet'}</strong>
            </div>
          </div>
        </div>

        <div className="hero-stats">
          <div className="stat-card stat-accent">
            <span>Tracked</span>
            <strong>{totalSites}</strong>
            <small>services online in the watchlist</small>
          </div>
          <div className="stat-card stat-healthy">
            <span>Healthy</span>
            <strong>{healthySites}</strong>
            <small>{failingSites} currently need attention</small>
          </div>
          <div className="stat-card">
            <span>Uptime</span>
            <strong style={{ color: uptimeColor }}>{avgUptime}%</strong>
            <small>average across all sites</small>
          </div>
        </div>
      </div>

      <div className="summary-row card metric-row">
        <div>
          <p className="metric-label">Tracked Sites</p>
          <p className="metric-value">{totalSites}</p>
        </div>
        <div>
          <p className="metric-label">Healthy Now</p>
          <p className="metric-value success">{healthySites}</p>
        </div>
        <div>
          <p className="metric-label">Average Uptime</p>
          <p className="metric-value">{avgUptime}%</p>
        </div>
        <div>
          <p className="metric-label">Selected Latency</p>
          <p className="metric-value metric-compact">{selectedResponseSeries[0] ? `${selectedResponseSeries[0]} ms` : '—'}</p>
        </div>
      </div>

      <div className="workspace-grid">
        <div className="card site-stack-panel">
          <div className="section-head">
            <div>
              <p className="section-kicker">Watchlist</p>
              <h2>Sites</h2>
            </div>
            <div className="section-head-actions">
              {loading && <span className="badge">Syncing...</span>}
              <span className="badge">{sites.length} live targets</span>
            </div>
          </div>
          {error && <p className="error-text">{error}</p>}
          {sites.length === 0 && !loading && <p className="muted">No sites configured yet.</p>}
          <div className="site-grid">
            {sites.map((site) => (
              <SiteCard
                key={site.id}
                site={site}
                checks={checksBySite[site.id] || []}
                isActive={site.id === selectedSiteId}
                onSelect={() => setSelectedSiteId(site.id)}
              />
            ))}
          </div>
        </div>

        <aside className="card detail-panel">
          <div className="section-head">
            <div>
              <p className="section-kicker">Focus mode</p>
              <h2>{selectedSite ? selectedSite.name : 'Site Detail'}</h2>
            </div>
            <span className="badge">Last 20 checks</span>
          </div>

          {selectedSite ? (
            <>
              <div className="detail-hero">
                <div>
                  <span className="detail-label">Endpoint</span>
                  <strong>
                    <a
                      href={selectedSite.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="endpoint-link"
                    >
                      {selectedSite.url}
                    </a>
                  </strong>
                </div>
                <div>
                  <span className="detail-label">Latest check</span>
                  <strong>{latestCheckTime}</strong>
                </div>
              </div>
              <UptimeBar percent={selectedUptime} />
              <ResponseChart data={selectedResponseSeries} />
              <IncidentTable incidents={selectedIncidents} />
            </>
          ) : (
            <p className="muted">Select a site to view details.</p>
          )}
        </aside>
      </div>
    </section>
  </section>
  )
}
