import React from 'react'

export default function ResponseChart({data = []}){
  if (!data.length) {
    return <div className="chart-empty">No response-time samples yet.</div>
  }

  const width = 560
  const height = 180
  const pad = 20
  const maxVal = Math.max(...data, 1)
  const minVal = Math.min(...data, 0)
  const span = Math.max(maxVal - minVal, 1)

  const points = data.map((value, index) => {
    const x = pad + (index * (width - pad * 2)) / Math.max(data.length - 1, 1)
    const y = height - pad - ((value - minVal) / span) * (height - pad * 2)
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="chart-wrap">
      <div className="chart-head">
        <h3>Response Time</h3>
        <span>{data[data.length - 1]} ms latest</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" role="img" aria-label="Response time trend">
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
