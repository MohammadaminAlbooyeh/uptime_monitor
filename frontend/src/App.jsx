import React from 'react'
import Dashboard from './pages/Dashboard'
import './styles.css'

export default function App(){
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-layout">
          <div>
            <p className="eyebrow">Live Observability</p>
            <h1>Uptime Monitor</h1>
            <p className="subtitle">Monitor availability, response trends, and downtime incidents in one place.</p>
          </div>
          {/* header chip removed per request */}
        </div>
      </header>
      <main>
        <Dashboard />
      </main>
    </div>
  )
}
