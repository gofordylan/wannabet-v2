import assert from 'node:assert/strict'
import test from 'node:test'

import { createBetDiscovery } from '../src/lib/bet-discovery.ts'

const seed = { scannedToBlock: 100, bets: [{ address: '0xold', createdAt: 1 }] }

test('stale seed discovers newest blocks first, resumes history, and retains prior bets', async () => {
  let clock = 0
  const ranges = []
  const discover = createBetDiscovery(
    seed,
    async (from, to) => {
      ranges.push([from, to])
      clock += 15
      return [{ address: `0x${to}`, createdAt: Number(to) }]
    },
    { now: () => clock, budgetMs: 15, chunkSize: 10n }
  )
  assert.deepEqual(
    (await discover(130n)).map((b) => b.address),
    ['0xold', '0x130']
  )
  assert.deepEqual(
    (await discover(132n)).map((b) => b.address),
    ['0xold', '0x130', '0x132']
  )
  await discover(132n)
  const bets = await discover(132n)
  assert.deepEqual(ranges, [
    [121n, 130n],
    [131n, 132n],
    [111n, 120n],
    [101n, 110n],
  ])
  assert.equal(bets.length, 5)
  assert.equal(bets.find((b) => b.address === '0x130').createdAt, 130)
  await discover(132n)
  assert.equal(ranges.length, 4)
})

test('failed ranges are retried without dropping prior discoveries or advancing past failure', async () => {
  let fail = true
  const ranges = []
  const discover = createBetDiscovery(
    seed,
    async (from, to) => {
      ranges.push([from, to])
      if (fail) throw new Error('RPC unavailable')
      return [{ address: '0xnew' }]
    },
    { chunkSize: 10n, minChunkSize: 10n }
  )
  assert.deepEqual(await discover(110n), seed.bets)
  fail = false
  assert.equal((await discover(110n)).length, 2)
  assert.deepEqual(ranges, [
    [101n, 110n],
    [101n, 110n],
  ])
})

test('adapts provider limits and covers every missing block without duplicates', async () => {
  const covered = []
  const discover = createBetDiscovery(
    seed,
    async (from, to) => {
      if (to - from + 1n > 2n) throw new Error('range too large')
      for (let block = from; block <= to; block++) covered.push(Number(block))
      return [{ address: '0xOLD', createdAt: 1 }]
    },
    { chunkSize: 8n, minChunkSize: 1n }
  )
  assert.equal((await discover(108n)).length, 1)
  assert.deepEqual(
    covered.sort((a, b) => a - b),
    [101, 102, 103, 104, 105, 106, 107, 108]
  )
})

test('budget applies to failed retries, and cold starts still prioritize recent blocks', async () => {
  let clock = 0
  let calls = 0
  const discover = createBetDiscovery(
    seed,
    async () => {
      calls++
      clock += 20
      throw new Error('timeout')
    },
    { now: () => clock, budgetMs: 15 }
  )
  await discover(5_000_000n)
  assert.equal(calls, 1)
  const ranges = []
  const cold = createBetDiscovery(
    seed,
    async (from, to) => {
      ranges.push([from, to])
      clock += 20
      return []
    },
    { now: () => clock, budgetMs: 15 }
  )
  await cold(5_000_000n)
  assert.deepEqual(ranges, [[4_990_001n, 5_000_000n]])
})

test('concurrent requests share a scan; new head is picked up on the next call', async () => {
  let release
  const gate = new Promise((resolve) => {
    release = resolve
  })
  const ranges = []
  const discover = createBetDiscovery(seed, async (from, to) => {
    ranges.push([from, to])
    await gate
    return []
  })
  const first = discover(110n)
  const second = discover(112n)
  assert.equal(first, second)
  release()
  await first
  await discover(112n)
  assert.deepEqual(ranges, [
    [101n, 110n],
    [111n, 112n],
  ])
})
