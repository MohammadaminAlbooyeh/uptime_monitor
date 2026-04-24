import React from 'react'

export default function Sidebar({active='Dashboard'}){
  const items = [
    {label: 'Dashboard', icon: '🏠'},
    {label: 'Monitors', icon: '🎯'},
    {label: 'Status Pages', icon: '📄'},
    {label: 'Teams', icon: '👥'},
    {label: 'Settings', icon: '⚙️'},
    {label: 'Telegram Bot', icon: '🤖', link: 'https://t.me/MAmin_weatherbot'},
  ]

  return (
    <nav className="sidebar">
      <div className="sidebar-inner">
        <div className="logo">UM</div>
        <ul className="nav-list">
          {items.map(it => (
            <li key={it.label} className={`nav-item ${it.label===active? 'active':''}`}>
              {it.link ? (
                <a href={it.link} target="_blank" rel="noopener noreferrer" className="nav-btn" style={{textDecoration: 'none', color: 'inherit'}}>
                  <span className="nav-ico" aria-hidden>{it.icon}</span>
                  <span className="nav-label">{it.label}</span>
                </a>
              ) : (
                <button className="nav-btn">
                  <span className="nav-ico" aria-hidden>{it.icon}</span>
                  <span className="nav-label">{it.label}</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
