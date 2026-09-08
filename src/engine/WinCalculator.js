export default class WinCalculator {
  constructor({ config }) {
    this.config = config
  }

  evaluate(matrix, bet) {
    const payouts = this.config.payouts
    const wild = this.config.wild
    const results = []
    let totalWin = 0

    this.config.paylines.forEach((line) => {
      const symbols = line.map((rowIndex, reelIndex) => matrix[rowIndex][reelIndex])
      const counts = {}

      for (const symbol of symbols) {
        if (symbol === wild) continue
        counts[symbol] = (counts[symbol] || 0) + 1
      }

      const baseSymbol = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
      if (!baseSymbol) return

      const matches = symbols.filter((symbol) => symbol === baseSymbol || symbol === wild).length
      if (matches < 3) return

      const multiplier = payouts[baseSymbol]?.[matches] || 0
      const win = Number((bet * multiplier).toFixed(2))

      if (win > 0) {
        totalWin += win
        results.push({
          line,
          base: baseSymbol,
          count: matches,
          win,
          cells: symbols.map((symbol, index) => ({
            row: line[index],
            col: index,
            symbol,
            isWinning: symbol === baseSymbol || symbol === wild,
          })),
        })
      }
    })

    return { totalWin: Number(totalWin.toFixed(2)), details: results }
  }
}
