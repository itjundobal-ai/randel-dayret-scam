export default class RNG {
  constructor({ seed = 42 } = {}) {
    this.seed = seed >>> 0
    this.testMode = null
  }

  setSeed(n) {
    this.seed = n >>> 0
  }

  rand() {
    let x = this.seed >>> 0
    x ^= x << 13
    x ^= x >>> 7
    x ^= x << 17
    this.seed = x >>> 0
    return (this.seed >>> 0) / 0xffffffff
  }

  pick(array) {
    if (!Array.isArray(array) || !array.length) return null
    return array[Math.floor(this.rand() * array.length)]
  }

  setTestMode(mode) {
    this.testMode = mode
  }
}
