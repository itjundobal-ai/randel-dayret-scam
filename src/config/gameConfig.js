const gameConfig = {
  reels: 5,
  rows: 3,
  minBet: 1,
  maxBet: 500,
  defaultBet: 10,
  initialBalance: 1000,
  scatterTrigger: 3,
  scatterAwards: {
    3: 10,
    4: 15,
    5: 20,
  },
  symbols: ['A', 'K', 'Q', 'J', '10', 'STAR', 'DIAMOND', 'WILD', 'SCATTER'],
  wild: 'WILD',
  scatter: 'SCATTER',
  paylines: [
    [0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1],
    [2, 2, 2, 2, 2],
    [0, 1, 2, 1, 0],
    [2, 1, 0, 1, 2],
  ],
  payouts: {
    A: { 3: 1.4, 4: 2.8, 5: 5.5 },
    K: { 3: 1.2, 4: 2.2, 5: 4.5 },
    Q: { 3: 1, 4: 1.8, 5: 3.8 },
    J: { 3: 0.8, 4: 1.5, 5: 2.8 },
    '10': { 3: 0.6, 4: 1.2, 5: 2.2 },
    STAR: { 3: 2.2, 4: 5, 5: 10 },
    DIAMOND: { 3: 3.5, 4: 8, 5: 18 },
    WILD: { 3: 1.2, 4: 2.5, 5: 5 },
    SCATTER: {},
  },
}

export default gameConfig
