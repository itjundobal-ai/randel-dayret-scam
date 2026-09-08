import GameEngine from '../engine/GameEngine'
import config from '../config/gameConfig'

async function run() {
  const engine = new GameEngine({ onUpdate: (p) => {} })

  console.log('TEST: Engine basic spin')
  const res1 = await engine.spin({ bet: 10 })
  console.log('matrix shape:', res1.matrix.length, 'x', res1.matrix[0].length)
  console.log('totalWin:', res1.totalWin)

  console.log('\nTEST: Force 3 scatter -> bonus')
  engine.setTestMode('FORCE_3_SCATTER')
  const res2 = await engine.spin({ bet: 10 })
  console.log('scatterCount:', res2.scatterCount, 'bonusTriggered:', !!res2.bonusTriggered)
  if (!res2.bonusTriggered) throw new Error('Expected bonus triggered for FORCE_3_SCATTER')

  console.log('\nTEST: Run free spins')
  // run the awarded free spins
  const award = res2.scatterAward || config.scatterAwards[3]
  engine.bonusManager.start(award)
  let bonusTotal = 0
  while (engine.bonusManager.remaining > 0) {
    const r = await engine.playFreeSpin(0)
    // win in free spin may be included in bonus manager
  }
  bonusTotal = engine.bonusManager.complete()
  console.log('bonusTotal:', bonusTotal)

  console.log('\nTEST: Force 4 scatter')
  engine.setTestMode('FORCE_4_SCATTER')
  const res4 = await engine.spin({ bet: 10 })
  console.log('scatterCount:', res4.scatterCount, 'award:', res4.scatterAward)

  console.log('\nTEST: Force 5 scatter')
  engine.setTestMode('FORCE_5_SCATTER')
  const res5 = await engine.spin({ bet: 10 })
  console.log('scatterCount:', res5.scatterCount, 'award:', res5.scatterAward)

  console.log('\nAll tests completed')
}

run().catch((err) => {
  console.error('Test failed:', err)
  process.exit(1)
})
