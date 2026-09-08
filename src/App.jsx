import React, { useEffect, useRef, useState } from 'react'
import GameBoard from './components/GameBoard'
import GameEngine from './engine/GameEngine'
import { loadState, saveState } from './utils/storage'
import config from './config/gameConfig'
import './index.css'

const STORAGE_KEY = 'demo_slot_v1'

export default function App() {
  const persisted = loadState(STORAGE_KEY) || {}
  const engineRef = useRef(null)

  const [gameEngine, setGameEngine] = useState(null)
  const [started, setStarted] = useState(false)
  const [state, setState] = useState({
    balance: persisted.balance ?? config.initialBalance,
    bet: persisted.bet ?? config.defaultBet,
    sound: persisted.sound ?? true,
    freeSpinsRemaining: 0,
    winAmount: 0,
    gameState: 'IDLE',
    status: 'Ready',
    error: '',
    autoplayRemaining: 0,
    bonusTotal: 0,
    message: 'Ready',
  })

  useEffect(() => {
    const engine = new GameEngine({
      onUpdate: (patch) => setState((s) => ({ ...s, ...patch })),
    })

    if (persisted.sound !== undefined) {
      engine.setSoundEnabled(Boolean(persisted.sound))
    }

    engineRef.current = engine
    setGameEngine(engine)

    return () => engine.teardown && engine.teardown()
  }, [])

  useEffect(() => {
    saveState(STORAGE_KEY, {
      balance: state.balance,
      bet: state.bet,
      sound: state.sound,
    })
  }, [state.balance, state.bet, state.sound])

  useEffect(() => {
    if (!gameEngine) return
    gameEngine.setSoundEnabled(Boolean(state.sound))
  }, [gameEngine, state.sound])

  useEffect(() => {
    window.DEV = window.DEV || {}
    window.DEV.force = (mode) => {
      const engine = engineRef.current
      if (!engine) return null
      engine.setTestMode(mode)
      return engine
    }
    window.DEV.engine = engineRef.current
  }, [gameEngine])

  if (!gameEngine) {
    return (
      <div className="game-shell">
        <div className="start-screen loading-screen">
          <div className="brand-mark">RANDEL DAYRET SCAM</div>
          <h1>Loading game...</h1>
        </div>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="game-shell">
        <div className="start-screen">
          <div className="brand-mark premium-mark">RANDEL DAYRET SCAM</div>
          <h1 className="premium-logo">RANDEL DAYRET SCAM</h1>
          <p>Demo credits only. Virtual spins, bonus rounds, and scatter triggers.</p>
          <button className="primary-button" onClick={() => setStarted(true)}>Start Game</button>
        </div>
      </div>
    )
  }

  return (
    <div className="game-shell">
      <div className="game-panel">
        <GameBoard engine={gameEngine} state={state} setState={setState} />
      </div>
    </div>
  )
}
