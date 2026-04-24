import React, { useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import './styles.css'

export default function App(){
  useEffect(() => {
    document.documentElement.classList.remove('theme-light')
    try { localStorage.removeItem('theme') } catch {}
  }, [])

  return (
    <div className="app-root">
      <header className="topbar">
        <div className="topbar-brand">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#tg)" />
            <path d="M7 13c1.333-2 3.333-3 5-3s3.667 1 5 3" stroke="#0d1117" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="tg" x1="0" x2="1">
                <stop offset="0" stopColor="#58a6ff" />
                <stop offset="1" stopColor="#bc8cff" />
              </linearGradient>
            </defs>
          </svg>
          <h1>Uptime Monitor</h1>
          <span>by Amin</span>
        </div>
      </header>
      <main className="app-body">
        <Dashboard />
      </main>
    </div>
  )
}
