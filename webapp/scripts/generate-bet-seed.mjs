// Regenerates src/generated/bet-seed.json by scanning BetCreated logs from
// both factories on Base. Runs as a prebuild step (network is available on
// Vercel build machines). Exits 0 on failure so a flaky RPC never breaks the
// build - the runtime scanner picks up whatever the seed is missing.
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

async function getBetCreatedLogs(fromBlock, toBlock) {
  const logs = []
  let chunkSize = 100_000n
  let from = fromBlock
  while (from <= toBlock) {
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
        chunkSize = size
        break
      } catch (err) {
        if (size <= MIN_CHUNK_SIZE) throw err
        size /= 2n
      }
    }
  }
  return logs
}

async function main() {
  const existing = JSON.parse(await readFile(SEED_PATH, 'utf8'))
  const latestBlock = await client.getBlockNumber()
  const fromBlock = BigInt(existing.scannedToBlock + 1)

  console.log(
    `Scanning BetCreated logs from block ${fromBlock} to ${latestBlock}...`
  )
  const logs = await getBetCreatedLogs(fromBlock, latestBlock)
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
    scannedToBlock: Number(latestBlock),
    generatedAt: new Date().toISOString(),
    bets: [...known.values()].sort((a, b) => a.blockNumber - b.blockNumber),
  }
  await writeFile(SEED_PATH, JSON.stringify(seed, null, 2) + '\n')
  console.log(
    `Seed written: ${seed.bets.length} bets through block ${latestBlock}`
  )
}

main().catch((err) => {
  console.warn('Seed generation failed, keeping existing seed:', err.message)
})
