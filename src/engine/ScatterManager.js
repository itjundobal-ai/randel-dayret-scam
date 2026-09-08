export default class ScatterManager {
  constructor({ config }) {
    this.config = config
  }

  count(matrix) {
    const scatter = this.config.scatter
    let count = 0

    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col] === scatter) count += 1
      }
    }

    return count
  }

  award(count) {
    return this.config.scatterAwards[count] || 0
  }
}
