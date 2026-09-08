import React from 'react'
import Reel from './Reel'
import config from '../config/gameConfig'

export default function MachineShell({ matrix, highlights }) {
  return (
    <div className="room-scene">
      <div className="room-lights room-lights--left" />
      <div className="room-lights room-lights--right" />
      <div className="room-decoration room-decoration--left" />
      <div className="room-decoration room-decoration--right" />
      <div className="slot-machine">
        <div className="machine-top" />
        <div className="machine-face">
          <div className="machine-header">
            <div className="machine-title">SCATTER</div>
            <div className="machine-smoke" />
          </div>

          <div className="reel-window">
            {Array.from({ length: config.reels }).map((_, columnIndex) => (
              <Reel key={columnIndex} columnIndex={columnIndex} matrix={matrix} highlights={highlights} />
            ))}
          </div>

          <div className="machine-footer">
            <div className="button-plate">
              <div className="button button--small" />
              <div className="button button--small" />
              <div className="button button--small" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
