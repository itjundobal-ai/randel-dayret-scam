import React, { useMemo, useRef, useState } from 'react'
import Reel from './Reel'
import BetControls from './BetControls'
import Paytable from './Paytable'
import BonusScreen from './BonusScreen'
import FreeSpinCounter from './FreeSpinCounter'
import config from '../config/gameConfig'

const EMPTY_MATRIX = Array.from({ length: config.rows }, () => Array(config.reels).fill(''))

function collectHighlights(result) {
  const winnings = []
  const scatters = []

  if (Array.isArray(result?.winDetails)) {
    result.winDetails.forEach((detail) => {
      if (Array.isArray(detail.cells)) {
        detail.cells.forEach((cell) => {
          if (cell.isWinning) winnings.push({ row: cell.row, col: cell.col })
        })
      }
    })
  }

  if (result?.matrix) {
    for (let row = 0; row < result.matrix.length; row++) {
      for (let col = 0; col < result.matrix[row].length; col++) {
        if (result.matrix[row][col] === config.scatter) {
          scatters.push({ row, col })
        }
      }
    }
  }

  return { wins: winnings, scatters }
}

export default function GameBoard({ engine, state, setState }) {
  const [matrix, setMatrix] = useState(EMPTY_MATRIX)
  const [showPaytable, setShowPaytable] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [bonusInfo, setBonusInfo] = useState(null)
  const [highlights, setHighlights] = useState({ wins: [], scatters: [] })
  const autoplayRef = useRef({ running: false })

  const isBusy = useMemo(() => {
    return ['SPINNING', 'EVALUATING', 'SCATTER_TRIGGER', 'BONUS_INTRO', 'FREE_SPINS'].includes(state.gameState)
  }, [state.gameState])

  const updateFromResult = (result, options = {}) => {
    if (!result) return

    const nextMatrix = result.matrix || EMPTY_MATRIX
    setMatrix(nextMatrix)
    setHighlights(collectHighlights(result))

    const nextBalance = state.balance - (options.skipBetDeduction ? 0 : state.bet) + (result.totalWin || 0)

    if (result.bonusTriggered) {
      setState((s) => ({
        ...s,
        balance: s.balance - s.bet,
        freeSpinsRemaining: result.scatterAward,
        winAmount: 0,
        gameState: 'SCATTER_TRIGGER',
        status: 'BONUS TRIGGERED',
        message: 'BONUS TRIGGERED',
        error: '',
      }))
      setBonusInfo({ freeSpins: result.scatterAward })
      return
    }

    setState((s) => ({
      ...s,
      balance: nextBalance,
      winAmount: result.totalWin || 0,
      gameState: result.totalWin > 0 ? 'WIN_DISPLAY' : 'IDLE',
      status: result.totalWin > 0 ? `WIN ${result.totalWin}` : 'LOSS',
      message: result.totalWin > 0 ? `WIN ${result.totalWin}` : 'LOSS',
      error: '',
      freeSpinsRemaining: s.freeSpinsRemaining || 0,
    }))
  }

  const runFreeSpinSequence = async () => {
    const freeSpinCount = state.freeSpinsRemaining || 0
    if (freeSpinCount <= 0) return

    const started = engine.startBonusRound(freeSpinCount)
    if (!started) return

    setBonusInfo(null)
    setState((s) => ({
      ...s,
      freeSpinsRemaining: freeSpinCount,
      gameState: 'FREE_SPINS',
      status: 'Free spins running',
      message: 'Free spins running',
      winAmount: 0,
    }))

    let remaining = freeSpinCount
    while (remaining > 0) {
      const result = await engine.playFreeSpin()
      if (!result) break

      setMatrix(result.matrix)
      setHighlights(collectHighlights(result))
      const bonusTotal = Number(result.bonusTotal) || 0
      const win = Number(result.totalWin) || 0

      setState((s) => ({
        ...s,
        balance: s.balance + win,
        winAmount: win,
        freeSpinsRemaining: result.remaining,
        bonusTotal,
        gameState: result.remaining > 0 ? 'FREE_SPINS' : 'BONUS_COMPLETE',
        status: result.remaining > 0 ? `Free spin win ${win}` : `Bonus complete +${bonusTotal}`,
        message: result.remaining > 0 ? `Free spin win ${win}` : `Bonus complete +${bonusTotal}`,
        error: '',
      }))

      remaining = result.remaining
      if (remaining <= 0) break
      await new Promise((resolve) => setTimeout(resolve, 480))
    }

    setState((s) => ({
      ...s,
      freeSpinsRemaining: 0,
      gameState: 'IDLE',
      message: 'Back to main game',
      status: 'Back to main game',
      winAmount: 0,
    }))
  }

  const doSpin = async ({ fromAutoplay = false } = {}) => {
    if (isBusy) return false

    if (state.freeSpinsRemaining > 0) {
      await runFreeSpinSequence()
      return true
    }

    if (state.balance < state.bet) {
      setState((s) => ({
        ...s,
        error: 'INSUFFICIENT CREDITS',
        status: 'INSUFFICIENT CREDITS',
        message: 'INSUFFICIENT CREDITS',
        gameState: 'ERROR',
      }))
      return false
    }

    const result = await engine.spin({ bet: state.bet })
    if (!result) return false

    setMatrix(result.matrix)
    setHighlights(collectHighlights(result))

    if (result.bonusTriggered) {
      setState((s) => ({
        ...s,
        balance: s.balance - s.bet,
        winAmount: 0,
        freeSpinsRemaining: result.scatterAward,
        gameState: 'SCATTER_TRIGGER',
        status: 'BONUS TRIGGERED',
        message: 'BONUS TRIGGERED',
        error: '',
      }))
      setBonusInfo({ freeSpins: result.scatterAward })
      return result
    }

    const nextBalance = state.balance - state.bet + (result.totalWin || 0)
    setState((s) => ({
      ...s,
      balance: nextBalance,
      winAmount: result.totalWin || 0,
      gameState: result.totalWin > 0 ? 'WIN_DISPLAY' : 'IDLE',
      status: result.totalWin > 0 ? `WIN ${result.totalWin}` : 'LOSS',
      message: result.totalWin > 0 ? `WIN ${result.totalWin}` : 'LOSS',
      error: '',
    }))

    if (!fromAutoplay) {
      setState((s) => ({ ...s, balance: s.balance }))
    }

    return result
  }

  const stopAutoplay = () => {
    autoplayRef.current.running = false
    setState((s) => ({ ...s, autoplayRemaining: 0 }))
  }

  const startAutoplay = async (count) => {
    if (autoplayRef.current.running) return

    autoplayRef.current.running = true
    setState((s) => ({ ...s, autoplayRemaining: count, gameState: 'IDLE' }))

    for (let index = 0; index < count; index++) {
      if (!autoplayRef.current.running) break
      if (state.balance < state.bet) {
        stopAutoplay()
        setState((s) => ({
          ...s,
          error: 'INSUFFICIENT CREDITS',
          status: 'Autoplay stopped: insufficient balance',
          message: 'Autoplay stopped: insufficient balance',
          gameState: 'ERROR',
          autoplayRemaining: 0,
        }))
        break
      }

      setState((s) => ({ ...s, autoplayRemaining: count - index }))
      const result = await doSpin({ fromAutoplay: true })

      if (!result) break
      if (result.bonusTriggered) {
        autoplayRef.current.running = false
        setState((s) => ({ ...s, autoplayRemaining: 0 }))
        break
      }

      await new Promise((resolve) => setTimeout(resolve, 350))
    }

    autoplayRef.current.running = false
    setState((s) => ({ ...s, autoplayRemaining: 0 }))
  }

  const onForce = (mode) => {
    engine.setTestMode(mode)
    setState((s) => ({ ...s, message: `Test mode: ${mode}` }))
  }

  const startBonus = async () => {
    if (!bonusInfo?.freeSpins) return
    const started = engine.startBonusRound(bonusInfo.freeSpins)
    if (!started) return
    setBonusInfo(null)
    await runFreeSpinSequence()
  }

  return (
    <>
      <header className="top-bar">
        <div className="brand-wordmark">
          <p className="eyebrow">Virtual credits</p>
          <h1 className="premium-logo premium-logo--header">RANDEL DAYRET SCAM</h1>
        </div>

        <div className="top-actions">
          <button type="button" className="icon-button" onClick={() => setShowSettings((prev) => !prev)}>Settings</button>
          <button type="button" className="icon-button" onClick={() => setShowPaytable((prev) => !prev)}>Paytable</button>
          <button type="button" className="icon-button" onClick={() => setState((s) => ({ ...s, sound: !s.sound }))}>
            {state.sound ? 'Sound On' : 'Sound Off'}
          </button>
        </div>
      </header>

      <div className="status-grid">
        <div className="stat-box">
          <span>Balance</span>
          <strong>{state.balance}</strong>
        </div>
        <div className="stat-box">
          <span>Bet</span>
          <strong>{state.bet}</strong>
        </div>
        <div className="stat-box">
          <span>Win</span>
          <strong>{state.winAmount || 0}</strong>
        </div>
      </div>

      <div className="machine">
        {Array.from({ length: config.reels }).map((_, columnIndex) => (
          <Reel key={columnIndex} columnIndex={columnIndex} matrix={matrix} highlights={highlights} />
        ))}
      </div>

      <div className="controls">
        <BetControls state={state} setState={setState} />
        <button type="button" className="spin-btn" onClick={() => doSpin()} disabled={isBusy}>
          {state.freeSpinsRemaining > 0 ? 'Free Spin' : 'Spin'}
        </button>
      </div>

      <div className="secondary-controls">
        <button type="button" className="ghost-button" onClick={() => startAutoplay(5)}>Autoplay 5</button>
        <button type="button" className="ghost-button" onClick={() => startAutoplay(10)}>Autoplay 10</button>
        <button type="button" className="ghost-button" onClick={() => startAutoplay(25)}>Autoplay 25</button>
        <button type="button" className="ghost-button" onClick={() => startAutoplay(50)}>Autoplay 50</button>
        <button type="button" className="ghost-button" onClick={stopAutoplay}>Stop</button>
        {state.autoplayRemaining > 0 && <span className="autoplay-pill">Remaining: {state.autoplayRemaining}</span>}
      </div>

      <div className="outcome-box">
        <p className="label">Status</p>
        <h2>{state.message || 'Ready'}</h2>
        {state.error && <small>{state.error}</small>}
      </div>

      <div className="debug-buttons">
        <button type="button" className="ghost-button" onClick={() => onForce('FORCE_NORMAL_WIN')}>Force Win</button>
        <button type="button" className="ghost-button" onClick={() => onForce('FORCE_LOSS')}>Force Loss</button>
        <button type="button" className="ghost-button" onClick={() => onForce('FORCE_3_SCATTER')}>Force 3 Scatter</button>
        <button type="button" className="ghost-button" onClick={() => onForce('FORCE_4_SCATTER')}>Force 4 Scatter</button>
        <button type="button" className="ghost-button" onClick={() => onForce('FORCE_5_SCATTER')}>Force 5 Scatter</button>
      </div>

      {showPaytable && <Paytable onClose={() => setShowPaytable(false)} />}

      {showSettings && (
        <div className="modal-panel settings-panel">
          <div className="modal-header">
            <h3>Settings</h3>
            <button type="button" className="ghost-button" onClick={() => setShowSettings(false)}>Close</button>
          </div>
          <label className="toggle-row">
            <span>Sound</span>
            <input
              type="checkbox"
              checked={Boolean(state.sound)}
              onChange={() => setState((s) => ({ ...s, sound: !s.sound }))}
            />
          </label>
          <button
            type="button"
            className="ghost-button full-width"
            onClick={() => {
              setState((s) => ({ ...s, balance: config.initialBalance, winAmount: 0, message: 'Balance reset', status: 'Balance reset' }))
              setShowSettings(false)
            }}
          >
            Reset demo balance
          </button>
        </div>
      )}

      {bonusInfo && <BonusScreen freeSpins={bonusInfo.freeSpins} onStart={startBonus} />}
      <FreeSpinCounter remaining={state.freeSpinsRemaining} />
    </>
  )
}
