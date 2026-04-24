import React from 'react'

export default function ResponseChart({data = []}){
  if (!data.length) return <div className="chart-empty">No response-time data yet.</div>

  const W = 560, H = 120, P = 12
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const span = Math.max(max - min, 1)

  const pts = data.map((v, i) => [
    P + (i * (W - P*2)) / Math.max(data.length - 1, 1),
    H - P - ((v - min) / span) * (H - P*2)
  ])

  const line = pts.map(([x,y]) => `${x},${y}`).join(' ')
  const area = [`${pts[0][0]},${H-P}`, ...pts.map(([x,y]) => `${x},${y}`), `${pts.at(-1)[0]},${H-P}`].join(' ')

  return (
    <div className="chart-wrap">
      <div className="chart-head">
        <h3>Response Time</h3>
        <span>{data.at(-1)} ms</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" aria-label="Response time">
        <defs>
          <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#58a6ff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#58a6ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#cg)" />
        <polyline points={line} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={pts.at(-1)[0]} cy={pts.at(-1)[1]} r="3.5" fill="currentColor" />
      </svg>
    </div>
  )
}
