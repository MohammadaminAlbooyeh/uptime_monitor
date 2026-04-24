import React from 'react'

export default function SiteCard({site, checks = [], isActive = false, onSelect}){
  const latest = checks[0]
  const status = latest?.status || 'UNKNOWN'
  const statusClass = status === 'OK' ? 'ok' : status === 'FAIL' ? 'fail' : 'unknown'
  const responseMs = typeof latest?.response_time_ms === 'number' ? Math.round(latest.response_time_ms) : null
  const uptime = checks.length
    ? Math.round((checks.filter((item) => item.status === 'OK').length / checks.length) * 100)
    : 100

  const avatarGradients = [
    'linear-gradient(135deg,#ff7043,#ff9a3c)',
    'linear-gradient(135deg,#29b6f6,#0ea5e9)',
    'linear-gradient(135deg,#ab47bc,#7c3aed)',
    'linear-gradient(135deg,#66bb6a,#22c55e)',
    'linear-gradient(135deg,#ff6b9d,#f43f5e)',
    'linear-gradient(135deg,#fbbf24,#f59e0b)',
  ]
  const avatarBg = avatarGradients[((site.id||0)-1) % avatarGradients.length]

  return (
    <button
      type="button"
      className={`site-card ${isActive ? 'active' : ''}`}
      onClick={onSelect}
    >
      <div className="site-card-row">
        <div className="site-avatar" style={{background: avatarBg}} aria-hidden>
          {site.name?.slice(0,1)}
        </div>
        <div className="site-card-body">
          <div className="site-card-head">
            <strong>{site.name}</strong>
            <span className={`status-pill ${statusClass}`}>{status}</span>
          </div>
          <div className="site-url">{site.url}</div>
          <div className="site-meta">
            <span>Uptime {uptime}%</span>
            <span>{responseMs ? `${responseMs} ms` : 'No latency data'}</span>
          </div>
        </div>
      </div>
    </button>
  )
}
