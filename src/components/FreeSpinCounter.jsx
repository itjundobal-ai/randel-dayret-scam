import React from 'react'

export default function FreeSpinCounter({ remaining = 0 }) {
  if (!remaining) return null

  return (
    <div className="flow-card">
      <div className="flow-header">RANDEL DAYRET SCAM</div>
      <div className="free-spin-badge">
        <span>Remaining</span>
        <strong>{remaining}</strong>
      </div>
    </div>
  )
}
