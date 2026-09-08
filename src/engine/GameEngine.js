import RNG from './RNG'
import ReelManager from './ReelManager'
import WinCalculator from './WinCalculator'
import ScatterManager from './ScatterManager'
import BonusManager from './BonusManager'
import GameStateManager, { STATES } from './GameStateManager'
import AudioManager from '../audio/AudioManager'
import config from '../config/gameConfig'

export default class GameEngine {
  constructor({ onUpdate } = {}) {
    this.config = config
    this.rng = new RNG({ seed: 12345 })
    this.reelManager = new ReelManager({ config, rng: this.rng })
    this.winCalculator = new WinCalculator({ config })
    this.scatterManager = new ScatterManager({ config })
    this.bonusManager = new BonusManager({ config })
    this.audio = new AudioManager({ enabled: true })
    this.state = new GameStateManager(onUpdate)
    this.onUpdate = onUpdate
    this.testMode = null
  }

  setSoundEnabled(enabled) {
    this.audio.toggle(Boolean(enabled))
  }

  setTestMode(mode) {
    this.testMode = mode
  }

  _makeForcedMatrix(mode) {
    const matrix = Array.from({ length: this.config.rows }, () => Array(this.config.reels).fill('A'))

    if (mode === 'FORCE_NORMAL_WIN') {
      matrix[1][0] = 'STAR'
      matrix[1][1] = 'STAR'
      matrix[1][2] = 'STAR'
      matrix[1][3] = 'A'
      matrix[1][4] = 'A'
      return matrix
    }

    if (mode === 'FORCE_BIG_WIN') {
      matrix[1][0] = 'DIAMOND'
      matrix[1][1] = 'DIAMOND'
      matrix[1][2] = 'DIAMOND'
      matrix[1][3] = 'DIAMOND'
      matrix[1][4] = 'DIAMOND'
      return matrix
    }

    if (mode === 'FORCE_LOSS') {
      matrix[0][0] = 'A'
      matrix[0][1] = 'K'
      matrix[0][2] = 'Q'
      matrix[0][3] = 'J'
      matrix[0][4] = '10'
      matrix[1][0] = 'A'
      matrix[1][1] = 'K'
      matrix[1][2] = 'Q'
      matrix[1][3] = 'J'
      matrix[1][4] = '10'
      matrix[2][0] = '10'
      matrix[2][1] = 'J'
      matrix[2][2] = 'Q'
      matrix[2][3] = 'K'
      matrix[2][4] = 'A'
      return matrix
    }

    const scatterCount = Number(mode.replace('FORCE_', '').replace('_SCATTER', '')) || 3
    for (let i = 0; i < scatterCount; i++) {
      const row = i % this.config.rows
      const col = Math.min(i, this.config.reels - 1)
      matrix[row][col] = this.config.scatter
    }

    return matrix
  }

  _generateMatrix() {
    if (this.testMode && this.testMode.startsWith('FORCE_')) {
      return this._makeForcedMatrix(this.testMode)
    }
    return this.reelManager.spin()
  }

  async spin({ bet = 10, isFree = false } = {}) {
    if ([STATES.SPINNING, STATES.EVALUATING, STATES.SCATTER_TRIGGER, STATES.BONUS_INTRO].includes(this.state.state)) {
      this._error('Spin already running')
      return null
    }

    if (!isFree && (typeof bet !== 'number' || bet <= 0 || bet < this.config.minBet || bet > this.config.maxBet)) {
      this._error('Invalid bet')
      return null
    }

    this.state.set(STATES.SPINNING, {
      message: isFree ? 'Free spin' : 'Spinning...',
      winAmount: 0,
      error: '',
      freeSpinsRemaining: this.bonusManager.remaining,
    })

    const matrix = this._generateMatrix()
    this.state.set(STATES.STOPPING_REELS, {
      matrix,
      message: isFree ? 'Free-spin result' : 'Stopping reels...',
    })

    this.state.set(STATES.EVALUATING, {
      matrix,
      message: 'Evaluating symbols...',
    })

    const scatterCount = this.scatterManager.count(matrix)
    const scatterAward = this.scatterManager.award(scatterCount)
    const winEval = this.winCalculator.evaluate(matrix, isFree ? 0 : bet)

    const result = {
      matrix,
      winDetails: winEval.details,
      totalWin: winEval.totalWin,
      scatterCount,
      scatterAward,
      bet,
      isFree,
      bonusTriggered: false,
      error: null,
    }

    if (!isFree && scatterCount >= this.config.scatterTrigger) {
      this.bonusManager.start(scatterAward)
      result.bonusTriggered = true
      this.state.set(STATES.SCATTER_TRIGGER, {
        matrix,
        message: 'BONUS TRIGGERED',
        scatterCount,
        freeSpinsRemaining: scatterAward,
        bonusTotal: 0,
        winAmount: 0,
      })
      this.state.set(STATES.BONUS_INTRO, {
        matrix,
        message: `Free spins awarded: ${scatterAward}`,
        freeSpinsRemaining: scatterAward,
        bonusTotal: 0,
        winAmount: 0,
      })
      this.audio.play('scatter')
      return result
    }

    if (winEval.totalWin > 0) {
      this.state.set(STATES.WIN_DISPLAY, {
        matrix,
        message: `WIN ${winEval.totalWin}`,
        winAmount: winEval.totalWin,
        freeSpinsRemaining: this.bonusManager.remaining,
      })
      this.audio.play('win')
    } else {
      this.state.set(STATES.IDLE, {
        matrix,
        message: 'LOSS',
        winAmount: 0,
        freeSpinsRemaining: this.bonusManager.remaining,
      })
      this.audio.play('reelStop')
    }

    return result
  }

  startBonusRound(freeSpins) {
    const spinCount = Number(freeSpins) || 0
    if (spinCount <= 0) {
      this.state.set(STATES.IDLE, { message: 'Bonus unavailable', freeSpinsRemaining: 0 })
      return null
    }

    if (this.bonusManager.remaining <= 0) {
      this.bonusManager.start(spinCount)
    } else {
      this.bonusManager.remaining = spinCount
    }

    this.state.set(STATES.FREE_SPINS, {
      freeSpinsRemaining: this.bonusManager.remaining,
      bonusTotal: this.bonusManager.bonusTotal,
      message: `Free spins: ${this.bonusManager.remaining}`,
      winAmount: 0,
    })
    this.audio.play('bonus')
    return { freeSpinsRemaining: this.bonusManager.remaining }
  }

  async playFreeSpin() {
    if (this.bonusManager.remaining <= 0) {
      this.state.set(STATES.BONUS_COMPLETE, {
        message: 'Bonus complete',
        freeSpinsRemaining: 0,
        bonusTotal: this.bonusManager.bonusTotal,
      })
      return null
    }

    const result = await this.spin({ bet: 0, isFree: true })
    if (!result) return null

    const bonusWin = Number(result.totalWin) || 0
    this.bonusManager.recordWin(bonusWin)
    this.bonusManager.tick()

    const remaining = this.bonusManager.remaining
    const bonusTotal = this.bonusManager.bonusTotal

    if (remaining > 0) {
      this.state.set(STATES.FREE_SPINS, {
        matrix: result.matrix,
        freeSpinsRemaining: remaining,
        bonusTotal,
        winAmount: bonusWin,
        message: bonusWin > 0 ? `Free spin win ${bonusWin}` : 'Free spin loss',
      })
      this.audio.play(bonusWin > 0 ? 'win' : 'reelStop')
      return { ...result, remaining, bonusTotal, bonusRunning: true }
    }

    const finalTotal = this.bonusManager.complete()
    this.state.set(STATES.BONUS_COMPLETE, {
      matrix: result.matrix,
      freeSpinsRemaining: 0,
      bonusTotal: finalTotal,
      winAmount: bonusWin,
      message: `Bonus complete: +${finalTotal}`,
    })
    this.audio.play('bonus')
    return { ...result, remaining: 0, bonusTotal: finalTotal, bonusRunning: false }
  }

  _error(msg) {
    this.state.set(STATES.ERROR, { error: msg, message: msg })
  }

  teardown() {
    // no-op
  }
}
