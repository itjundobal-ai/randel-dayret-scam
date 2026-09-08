import React from 'react'

export default function BetControls({ state, setState }) {
  const change = (delta) => {
    setState((s) => ({
      ...s,
      bet: Math.max(1, Math.min(500, s.bet + delta)),
    }))
  }

  const maxBet = () => setState((s) => ({ ...s, bet: 500 }))

  return (
    <div className="bet-box">
      <button type="button" onClick={() => change(-1)}>-</button>
      <span>{state.bet}</span>
      <button type="button" onClick={() => change(1)}>+</button>
      <button type="button" className="ghost-button" onClick={maxBet}>Max</button>
    </div>
  )
}
