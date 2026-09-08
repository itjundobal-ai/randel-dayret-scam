import React from 'react'

export default function BonusScreen({ freeSpins = 0, onStart }) {
  return (
    <div className="modal-panel">
      <div className="modal-header">
        <div className="modal-brand">RANDEL DAYRET SCAM</div>
        <span className="badge">Bonus</span>
      </div>
      <h3>Bonus Triggered</h3>
      <p>You earned {freeSpins} free spins.</p>
      <button type="button" className="primary-button" onClick={onStart}>Start Free Spins</button>
    </div>
  )
}
