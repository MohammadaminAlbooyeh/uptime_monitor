import React, { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard'
import './styles.css'

export default function App(){
  // default to light to match requested mockup
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') root.classList.add('theme-light')
    else root.classList.remove('theme-light')
    try { localStorage.setItem('theme', theme) } catch {}
  }, [theme])

  return (
    <div className="app-root">
      <div className="app-shell">
        <header className="topbar">
          <div className="topbar-layout">
            <div className="brand-row">
              <div className="brand">
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#g)" />
                <path d="M7 13c1.333-2 3.333-3 5-3s3.667 1 5 3" stroke="#021427" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="g" x1="0" x2="1">
                    <stop offset="0" stopColor="#7ecbff" />
                    <stop offset="1" stopColor="#b59cff" />
                  </linearGradient>
                </defs>
              </svg>
              </div>
            <div>
              <p className="eyebrow">Live Observability</p>
              <h1>Uptime Monitor</h1>
              <p className="subtitle">Monitor availability, response trends, and downtime incidents in one place.</p>
            </div>
            </div>
            <div className="header-actions">
            <button
              className="theme-toggle"
              aria-label="Toggle theme"
              onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
          </div>
        </header>
        <main>
          <Dashboard />
        </main>
      </div>
    </div>
  )
}
