import React from 'react'
import config from '../config/gameConfig'

export default function Paytable({ onClose }) {
  return (
    <div className="modal-panel paytable-panel">
      <div className="modal-header">
        <h3>Paytable</h3>
        <button type="button" className="ghost-button" onClick={onClose}>Close</button>
      </div>

      <div className="paytable-grid">
        {Object.entries(config.payouts).filter(([symbol]) => symbol !== config.scatter).map(([symbol, values]) => (
          <div key={symbol} className="paytable-row">
            <span className="symbol-pill">{symbol}</span>
            <span>3x: {values[3] ?? '-'}</span>
            <span>4x: {values[4] ?? '-'}</span>
            <span>5x: {values[5] ?? '-'}</span>
          </div>
        ))}
      </div>

      <div className="scatter-rule">
        <strong>Scatter</strong>
        <span>{config.scatterTrigger} scatters trigger bonus.</span>
      </div>
    </div>
  )
}
