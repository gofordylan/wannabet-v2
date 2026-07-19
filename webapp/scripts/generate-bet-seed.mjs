// Regenerates src/generated/bet-seed.json by scanning BetCreated logs from
// both factories on Base. Runs as a prebuild step (network is available on
// Vercel build machines). Exits 0 on failure so a flaky RPC never breaks the
// build - the runtime scanner picks up whatever the seed is missing.
//
// The scan is time-budgeted (SEED_SCAN_BUDGET_MS, default 20 min): if it can't
// reach the chain head in time it writes a partial seed whose scannedToBlock
// cursor marks real progress, and the next build resumes from there.
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BET_FACTORY_V1, BET_FACTORY_V2 } from 'shared'
import {
  createPublicClient,
  fallback,
  http,
  parseAbiItem,
  parseEventLogs,
} from 'viem'
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

const client = createPublicClient({
  chain: base,
  transport: fallback(urls.map((url) => http(url, { timeout: 15_000 }))),
})

const BET_CREATED_EVENT = parseAbiItem('event BetCreated(address indexed bet)')
// The bet clone emits this alongside the factory event; it's the only place
// the description exists (it is not stored in contract state)
const BET_INITIALIZED_EVENT = parseAbiItem(
  'event BetCreated(address indexed maker, address indexed taker, address indexed judge, address asset, uint40 acceptBy, uint40 endsBy, uint256 makerStake, uint256 takerStake, string description)'
)
const FACTORY_ADDRESSES = [BET_FACTORY_V1.address, BET_FACTORY_V2.address]
const MIN_CHUNK_SIZE = 2_000n
const MAX_CHUNK_SIZE = 500_000n
const SCAN_BUDGET_MS = Number(process.env.SEED_SCAN_BUDGET_MS ?? 20 * 60_000)

async function fetchDescription(txHash, betAddress) {
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
    return ''
  }
}

// Scan up to the budget deadline. Returns the logs found and the last block
// actually covered, which may be short of toBlock.
async function getBetCreatedLogs(fromBlock, toBlock, deadline) {
  const logs = []
  let chunkSize = 100_000n
  let from = fromBlock
  let chunksDone = 0
  while (from <= toBlock) {
    if (Date.now() > deadline) {
      console.log(
        `Scan budget exhausted at block ${from - 1n} (${logs.length} events so far)`
      )
      return { logs, scannedTo: from - 1n }
    }
    let size = chunkSize
    for (;;) {
      const to = from + size - 1n > toBlock ? toBlock : from + size - 1n
      try {
        const chunk = await client.getLogs({
          address: FACTORY_ADDRESSES,
          event: BET_CREATED_EVENT,
          fromBlock: from,
          toBlock: to,
        })
        logs.push(...chunk)
        from = to + 1n
        // Grow back toward the max after any halving
        chunkSize = size * 2n > MAX_CHUNK_SIZE ? MAX_CHUNK_SIZE : size * 2n
        break
      } catch (err) {
        if (size <= MIN_CHUNK_SIZE) throw err
        size /= 2n
        chunkSize = size
      }
    }
    chunksDone += 1
    if (chunksDone % 10 === 0) {
      const pct = Number(
        ((from - fromBlock) * 100n) / (toBlock - fromBlock + 1n)
      )
      console.log(
        `Scanned to block ${from - 1n} (${pct}%, ${logs.length} events, chunk size ${chunkSize})`
      )
    }
  }
  return { logs, scannedTo: toBlock }
}

async function main() {
  const deadline = Date.now() + SCAN_BUDGET_MS
  const existing = JSON.parse(await readFile(SEED_PATH, 'utf8'))
  const latestBlock = await client.getBlockNumber()
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

  const timestamps = new Map()
  for (const blockNumber of new Set(logs.map((log) => log.blockNumber))) {
    const block = await client.getBlock({ blockNumber })
    timestamps.set(blockNumber, Number(block.timestamp))
  }

  const known = new Map(existing.bets.map((bet) => [bet.address, bet]))
  for (const log of logs) {
    if (!log.args.bet) continue
    const address = log.args.bet.toLowerCase()
    if (known.has(address)) continue
    known.set(address, {
      address,
      version:
        log.address.toLowerCase() === BET_FACTORY_V2.address.toLowerCase()
          ? 2
          : 1,
      blockNumber: Number(log.blockNumber),
      createdAt: timestamps.get(log.blockNumber) ?? 0,
      description: await fetchDescription(log.transactionHash, address),
    })
  }

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
