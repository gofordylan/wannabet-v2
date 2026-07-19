// Regenerates src/generated/bet-seed.json by scanning BetCreated logs from
// both factories on Base. Runs as a prebuild step (network is available on
// Vercel build machines). Exits 0 on failure so a flaky RPC never breaks the
// build - the runtime scanner picks up whatever the seed is missing.
//
// Chunks are fetched in parallel waves spread across several public RPC
// providers (sequential scanning takes ~50 min for the full history; parallel
// takes a few minutes). The scan is still time-budgeted (SEED_SCAN_BUDGET_MS,
// default 20 min): on budget exhaustion or a dead range it writes a partial
// seed whose scannedToBlock cursor marks contiguous progress, and the runtime
// scanner covers the gap.
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BET_FACTORY_V1, BET_FACTORY_V2 } from 'shared'
import { createPublicClient, http, parseAbiItem, parseEventLogs } from 'viem'
import { base } from 'viem/chains'

const SEED_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '../src/generated/bet-seed.json'
)

const BASE_RPC_URLS = [
  'https://mainnet.base.org',
  'https://base-rpc.publicnode.com',
  'https://base.llamarpc.com',
]

const urls = process.env.BASE_RPC_URL
  ? [process.env.BASE_RPC_URL, ...BASE_RPC_URLS]
  : BASE_RPC_URLS

const clients = urls.map((url) =>
  createPublicClient({
    chain: base,
    transport: http(url, { timeout: 15_000 }),
  })
)

const BET_CREATED_EVENT = parseAbiItem('event BetCreated(address indexed bet)')
// The bet clone emits this alongside the factory event; it's the only place
// the description exists (it is not stored in contract state)
const BET_INITIALIZED_EVENT = parseAbiItem(
  'event BetCreated(address indexed maker, address indexed taker, address indexed judge, address asset, uint40 acceptBy, uint40 endsBy, uint256 makerStake, uint256 takerStake, string description)'
)
const FACTORY_ADDRESSES = [BET_FACTORY_V1.address, BET_FACTORY_V2.address]
const CHUNK_SIZE = 10_000n
const MIN_CHUNK_SIZE = 1_000n
const CONCURRENCY = 9
const SCAN_BUDGET_MS = Number(process.env.SEED_SCAN_BUDGET_MS ?? 30 * 60_000)

function min(a, b) {
  return a < b ? a : b
}

async function getLogsRange(client, fromBlock, toBlock) {
  return client.getLogs({
    address: FACTORY_ADDRESSES,
    event: BET_CREATED_EVENT,
    fromBlock,
    toBlock,
  })
}

// Fetch one chunk on a preferred client, halving the range on errors and
// failing over to the other providers before giving up.
async function fetchChunk(clientIndex, fromBlock, toBlock) {
  for (let attempt = 0; attempt < clients.length; attempt++) {
    const client = clients[(clientIndex + attempt) % clients.length]
    try {
      const logs = []
      let size = toBlock - fromBlock + 1n
      let from = fromBlock
      while (from <= toBlock) {
        const to = min(from + size - 1n, toBlock)
        try {
          logs.push(...(await getLogsRange(client, from, to)))
          from = to + 1n
        } catch (err) {
          if (size <= MIN_CHUNK_SIZE) throw err
          size /= 2n
        }
      }
      return logs
    } catch {
      // Try the next provider
    }
  }
  throw new Error(`All providers failed for blocks ${fromBlock}-${toBlock}`)
}

// Scan in parallel waves. Returns the logs found and the last block covered
// contiguously, which may be short of toBlock on budget exhaustion/failure.
async function getBetCreatedLogs(fromBlock, toBlock, deadline) {
  const logs = []
  let from = fromBlock
  let lastLogAt = Date.now()
  while (from <= toBlock) {
    if (Date.now() > deadline) {
      console.log(
        `Scan budget exhausted at block ${from - 1n} (${logs.length} events so far)`
      )
      return { logs, scannedTo: from - 1n }
    }
    const waveStart = from
    const tasks = []
    for (let i = 0; i < CONCURRENCY && from <= toBlock; i++) {
      const to = min(from + CHUNK_SIZE - 1n, toBlock)
      tasks.push(fetchChunk(i, from, to))
      from = to + 1n
    }
    try {
      const results = await Promise.all(tasks)
      logs.push(...results.flat())
    } catch (err) {
      console.warn(`Wave failed at block ${waveStart}: ${err.message}`)
      return { logs, scannedTo: waveStart - 1n }
    }
    if (Date.now() - lastLogAt > 10_000) {
      lastLogAt = Date.now()
      const pct = Number(
        ((from - fromBlock) * 100n) / (toBlock - fromBlock + 1n)
      )
      console.log(
        `Scanned to block ${from - 1n} (${pct}%, ${logs.length} events)`
      )
    }
  }
  return { logs, scannedTo: toBlock }
}

// Some free providers prune old block history ("pruned history unavailable"),
// so header lookups need the same provider failover as everything else
async function fetchBlockTimestamp(clientIndex, blockNumber) {
  for (let attempt = 0; attempt < clients.length; attempt++) {
    const client = clients[(clientIndex + attempt) % clients.length]
    try {
      const block = await client.getBlock({ blockNumber })
      return Number(block.timestamp)
    } catch {
      // Try the next provider
    }
  }
  console.warn(`No provider could serve block ${blockNumber}; timestamp 0`)
  return 0
}

async function fetchDescription(clientIndex, txHash, betAddress) {
  for (let attempt = 0; attempt < clients.length; attempt++) {
    const client = clients[(clientIndex + attempt) % clients.length]
    try {
      const receipt = await client.getTransactionReceipt({ hash: txHash })
      const decoded = parseEventLogs({
        abi: [BET_INITIALIZED_EVENT],
        logs: receipt.logs,
      })
      const match = decoded.find(
        (log) => log.address.toLowerCase() === betAddress
      )
      return match?.args.description ?? ''
    } catch {
      // Try the next provider
    }
  }
  return ''
}

async function mapInBatches(items, batchSize, fn) {
  const results = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    results.push(
      ...(await Promise.all(batch.map((item, j) => fn(item, i + j))))
    )
  }
  return results
}

async function main() {
  const deadline = Date.now() + SCAN_BUDGET_MS
  const existing = JSON.parse(await readFile(SEED_PATH, 'utf8'))
  const latestBlock = await clients[0].getBlockNumber()
  const fromBlock = BigInt(existing.scannedToBlock + 1)

  console.log(
    `Scanning BetCreated logs from block ${fromBlock} to ${latestBlock}...`
  )
  const { logs, scannedTo } = await getBetCreatedLogs(
    fromBlock,
    latestBlock,
    deadline
  )
  console.log(`Found ${logs.length} new bets`)

  const blockNumbers = [...new Set(logs.map((log) => log.blockNumber))]
  const timestamps = new Map()
  await mapInBatches(blockNumbers, 10, async (blockNumber, i) => {
    timestamps.set(blockNumber, await fetchBlockTimestamp(i, blockNumber))
  })

  const known = new Map(existing.bets.map((bet) => [bet.address, bet]))
  const newLogs = logs.filter(
    (log) => log.args.bet && !known.has(log.args.bet.toLowerCase())
  )
  const descriptions = await mapInBatches(newLogs, 10, (log, i) =>
    fetchDescription(i, log.transactionHash, log.args.bet.toLowerCase())
  )
  newLogs.forEach((log, i) => {
    const address = log.args.bet.toLowerCase()
    known.set(address, {
      address,
      version:
        log.address.toLowerCase() === BET_FACTORY_V2.address.toLowerCase()
          ? 2
          : 1,
      blockNumber: Number(log.blockNumber),
      createdAt: timestamps.get(log.blockNumber) ?? 0,
      description: descriptions[i],
    })
  })

  const seed = {
    scannedToBlock: Number(scannedTo),
    generatedAt: new Date().toISOString(),
    bets: [...known.values()].sort((a, b) => a.blockNumber - b.blockNumber),
  }
  await writeFile(SEED_PATH, JSON.stringify(seed, null, 2) + '\n')
  const suffix =
    scannedTo < latestBlock
      ? ` (partial - ${latestBlock - scannedTo} blocks left for the runtime scanner / next build)`
      : ''
  console.log(
    `Seed written: ${seed.bets.length} bets through block ${scannedTo}${suffix}`
  )
}

main().catch((err) => {
  console.warn('Seed generation failed, keeping existing seed:', err.message)
})
