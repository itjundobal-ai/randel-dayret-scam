export default class ReelManager {
  constructor({ config, rng }) {
    this.config = config
    this.rng = rng
    this.reelStrips = this._makeStrips()
  }

  _makeStrips() {
    const strips = []
    for (let reelIndex = 0; reelIndex < this.config.reels; reelIndex++) {
      const strip = []
      for (let i = 0; i < 45; i++) {
        strip.push(...this.config.symbols)
      }
      strips.push(strip)
    }
    return strips
  }

  spin() {
    const { reels, rows } = this.config
    const result = Array.from({ length: rows }, () => Array(reels).fill(null))

    for (let col = 0; col < reels; col++) {
      const strip = this.reelStrips[col]
      const start = Math.floor(this.rng.rand() * strip.length)

      for (let row = 0; row < rows; row++) {
        result[row][col] = strip[(start + row) % strip.length]
      }
    }

    return result
  }
}
