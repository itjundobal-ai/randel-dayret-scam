import React from 'react'

export default function Reel({ columnIndex, matrix, highlights = {} }) {
  const column = matrix && matrix.length ? matrix.map((row) => row[columnIndex]) : Array.from({ length: 3 }).fill('')

  return (
    <div className="reel-column">
      {column.map((symbol, rowIndex) => {
        const isWin = highlights.wins && highlights.wins.some((cell) => cell.row === rowIndex && cell.col === columnIndex)
        const isScatter = highlights.scatters && highlights.scatters.some((cell) => cell.row === rowIndex && cell.col === columnIndex)

        return (
          <div
            key={`${rowIndex}-${columnIndex}`}
            className={`reel-slot ${isWin ? 'win' : ''} ${isScatter ? 'scatter' : ''}`}
          >
            {symbol || '—'}
          </div>
        )
      })}
    </div>
  )
}
