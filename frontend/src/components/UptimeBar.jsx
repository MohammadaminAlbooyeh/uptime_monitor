import React from 'react'

export default function UptimeBar({percent=100}){
  const clamped = Math.max(0, Math.min(100, percent))

  return (
    <div className="uptime-wrap">
      <div className="uptime-labels">
        <h3>Uptime</h3>
        <span>{clamped}%</span>
      </div>
      <div className="uptime-track">
        <div className="uptime-fill" style={{width: `${clamped}%`}} />
      </div>
    </div>
  )
}
