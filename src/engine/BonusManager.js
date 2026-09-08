export default class BonusManager {
  constructor({ config }) {
    this.config = config
    this.bonusTotal = 0
    this.remaining = 0
  }

  start(freeSpins) {
    this.remaining = Number(freeSpins) || 0
    this.bonusTotal = 0
  }

  recordWin(amount) {
    this.bonusTotal += Number(amount) || 0
  }

  tick() {
    if (this.remaining > 0) this.remaining -= 1
  }

  complete() {
    const total = Number(this.bonusTotal) || 0
    this.bonusTotal = 0
    this.remaining = 0
    return total
  }
}
