import React from 'react'

export default function SiteCard({site, checks = [], isActive = false, onSelect}){
  const latest = checks[0]
  const status = latest?.status || 'UNKNOWN'
  const statusClass = status === 'OK' ? 'ok' : status === 'FAIL' ? 'fail' : 'unknown'
  const responseMs = typeof latest?.response_time_ms === 'number' ? Math.round(latest.response_time_ms) : null
  const uptime = checks.length
    ? Math.round((checks.filter((item) => item.status === 'OK').length / checks.length) * 100)
    : 100

  return (
    <button
      type="button"
      className={`site-card ${isActive ? 'active' : ''}`}
      onClick={onSelect}
    >
      <div className="site-card-glow" />
      <div className="site-card-head">
        <strong>{site.name}</strong>
        <span className={`status-pill ${statusClass}`}>{status}</span>
      </div>
      <div className="site-url">{site.url}</div>
      <div className="site-meta">
        <span>Uptime {uptime}%</span>
        <span>{responseMs ? `${responseMs} ms` : 'No latency data'}</span>
      </div>
    </button>
  )
}
