import React from 'react'

export default function Sidebar({active='Dashboard'}){
  const items = [
    {label: 'Dashboard', icon: '🏠'},
    {label: 'Monitors', icon: '🎯'},
    {label: 'Status Pages', icon: '📄'},
    {label: 'Teams', icon: '👥'},
    {label: 'Settings', icon: '⚙️'},
  ]

  return (
    <nav className="sidebar">
      <div className="sidebar-inner">
        <div className="logo">UM</div>
        <ul className="nav-list">
          {items.map(it => (
            <li key={it.label} className={`nav-item ${it.label===active? 'active':''}`}>
              <button className="nav-btn">
                <span className="nav-ico" aria-hidden>{it.icon}</span>
                <span className="nav-label">{it.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
