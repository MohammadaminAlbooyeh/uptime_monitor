import React from 'react'

export default function IncidentTable({incidents=[]}){
  if (incidents.length === 0) {
    return <p className="muted">No downtime incidents detected in recent checks.</p>
  }

  return (
    <table className="incidents-table">
      <thead>
        <tr><th>When</th><th>Site</th><th>Duration</th><th>Code</th></tr>
      </thead>
      <tbody>
        {incidents.map((it,i)=> (
          <tr key={i}>
            <td>{it.when}</td>
            <td>{it.site}</td>
            <td>{it.duration}</td>
            <td>{it.statusCode}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
