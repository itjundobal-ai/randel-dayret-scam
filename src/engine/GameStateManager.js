export const STATES = {
  IDLE: 'IDLE',
  SPINNING: 'SPINNING',
  STOPPING_REELS: 'STOPPING_REELS',
  EVALUATING: 'EVALUATING',
  WIN_DISPLAY: 'WIN_DISPLAY',
  SCATTER_TRIGGER: 'SCATTER_TRIGGER',
  BONUS_INTRO: 'BONUS_INTRO',
  FREE_SPINS: 'FREE_SPINS',
  BONUS_RESULT: 'BONUS_RESULT',
  BONUS_COMPLETE: 'BONUS_COMPLETE',
  ERROR: 'ERROR',
}

export default class GameStateManager {
  constructor(onChange) {
    this.state = STATES.IDLE
    this.onChange = onChange
  }

  set(state, payload = {}) {
    this.state = state
    if (this.onChange) {
      this.onChange({ gameState: state, ...payload })
    }
  }
}
