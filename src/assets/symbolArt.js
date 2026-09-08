import React from 'react'

const SYMBOL_MAP = {
  A: 'gem',
  K: 'crown',
  Q: 'orb',
  J: 'mask',
  '10': 'coin',
  STAR: 'star',
  DIAMOND: 'diamond',
  WILD: 'wild',
  SCATTER: 'scatter',
}

function createShape(className, key) {
  return React.createElement('span', { key, className: `shape ${className}` })
}

export function SymbolArt({ symbol }) {
  const kind = SYMBOL_MAP[symbol] || 'gem'

  const shapeNodes = (() => {
    if (kind === 'gem') {
      return [createShape('gem', 'gem'), createShape('gem gem--inner', 'gem-inner')]
    }

    return [createShape(kind, 'single-shape')]
  })()

  return React.createElement(
    'div',
    { className: `symbol-art symbol-art--${kind}`, 'aria-label': symbol || 'empty' },
    React.createElement('div', { className: 'symbol-art__glow' }),
    React.createElement('div', { className: 'symbol-art__core' }, shapeNodes)
  )
}

export const symbolAssetMap = SYMBOL_MAP
