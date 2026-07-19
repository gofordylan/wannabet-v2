import { unstable_cache } from 'next/cache'
import {
  BET_FACTORY_V1,
  BET_FACTORY_V2,
  BET_V2_ABI,
  type Bet,
  BetStatus,
  type BetUser,
  SUPPORTED_ASSETS,
} from 'shared'
import {
  type Address,
  createPublicClient,
  fallback,
  http,
  parseAbiItem,
  parseEventLogs,
  zeroAddress,
} from 'viem'
import { base, mainnet } from 'viem/chains'

import seed from '@/generated/bet-seed.json'

// =============================================================================
// RPC clients (free public endpoints, overridable via env)
// =============================================================================

const BASE_RPC_URLS = [
  'https://mainnet.base.org',
  'https://base-rpc.publicnode.com',
  'https://base.llamarpc.com',
]

const MAINNET_RPC_URLS = [
  'https://ethereum-rpc.publicnode.com',
  'https://eth.llamarpc.com',
  'https://cloudflare-eth.com',
]

function makeTransport(envUrl: string | undefined, fallbackUrls: string[]) {
  const urls = envUrl ? [envUrl, ...fallbackUrls] : fallbackUrls
  return fallback(urls.map((url) => http(url, { timeout: 10_000 })))
}

const baseClient = createPublicClient({
  chain: base,
  transport: makeTransport(process.env.BASE_RPC_URL, BASE_RPC_URLS),
})

// Mainnet is only used for ENS lookups
const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: makeTransport(process.env.MAINNET_RPC_URL, MAINNET_RPC_URLS),
})

// =============================================================================
// Bet discovery - BetCreated logs from both factories
// =============================================================================

const BET_CREATED_EVENT = parseAbiItem('event BetCreated(address indexed bet)')

// The bet clone emits this alongside the factory event; it's the only place
// the description exists (it is not stored in contract state)
const BET_INITIALIZED_EVENT = parseAbiItem(
  'event BetCreated(address indexed maker, address indexed taker, address indexed judge, address asset, uint40 acceptBy, uint40 endsBy, uint256 makerStake, uint256 takerStake, string description)'
)

const FACTORY_ADDRESSES = [
  BET_FACTORY_V1.address as Address,
  BET_FACTORY_V2.address as Address,
]

type DiscoveredBet = {
  address: string
  version: 1 | 2
  blockNumber: number
  createdAt: number // unix seconds
  description: string
}

// Public RPCs cap eth_getLogs ranges differently; learn a working chunk size
// and reuse it across requests within the same lambda.
let learnedChunkSize = 100_000n
const MIN_CHUNK_SIZE = 2_000n
// Per-request scan budget: the seed normally leaves only a tiny gap, but if it
// is stale/partial we return what we found in time rather than hanging the
// route. Later requests (and the next build) pick up where the seed left off.
const SCAN_BUDGET_MS = 15_000

async function getBetCreatedLogs(fromBlock: bigint, toBlock: bigint) {
  const deadline = Date.now() + SCAN_BUDGET_MS
  const logs = []
  let from = fromBlock
  while (from <= toBlock && Date.now() < deadline) {
    let size = learnedChunkSize
    for (;;) {
      const to = from + size - 1n > toBlock ? toBlock : from + size - 1n
      try {
        const chunk = await baseClient.getLogs({
          address: FACTORY_ADDRESSES,
          event: BET_CREATED_EVENT,
          fromBlock: from,
          toBlock: to,
        })
        logs.push(...chunk)
        from = to + 1n
        break
      } catch (err) {
        if (size <= MIN_CHUNK_SIZE) throw err
        size /= 2n
        learnedChunkSize = size
      }
    }
  }
  if (from <= toBlock) {
    console.warn(
      `Bet scan budget exhausted at block ${from - 1n} of ${toBlock}; serving partial results`
    )
  }
  return logs
}

// Read the description from the detailed BetCreated event the bet clone
// emitted in its creation transaction
async function fetchDescription(
  txHash: `0x${string}`,
  betAddress: string
): Promise<string> {
  try {
    const receipt = await baseClient.getTransactionReceipt({ hash: txHash })
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

async function discoverNewBets(
  fromBlock: bigint,
  toBlock: bigint
): Promise<DiscoveredBet[]> {
  if (fromBlock > toBlock) return []
  const logs = await getBetCreatedLogs(fromBlock, toBlock)

  // Fetch timestamps for the (few) blocks containing new bets
  const blockNumbers = [...new Set(logs.map((log) => log.blockNumber))]
  const timestamps = new Map<bigint, number>()
  for (const blockNumber of blockNumbers) {
    const block = await baseClient.getBlock({ blockNumber })
    timestamps.set(blockNumber, Number(block.timestamp))
  }

  const bets: DiscoveredBet[] = []
  for (const log of logs) {
    if (!log.args.bet) continue
    const address = log.args.bet.toLowerCase()
    const isV2 =
      log.address.toLowerCase() === BET_FACTORY_V2.address.toLowerCase()
    bets.push({
      address,
      version: isV2 ? 2 : 1,
      blockNumber: Number(log.blockNumber),
      createdAt: timestamps.get(log.blockNumber) ?? 0,
      description: await fetchDescription(log.transactionHash, address),
    })
  }
  return bets
}

// =============================================================================
// Bet state - read live from the bet contracts via multicall
// =============================================================================

// IBet.Status enum indices; EXPIRED (5) renders as CANCELLED
const STATUS_BY_INDEX: BetStatus[] = [
  BetStatus.PENDING,
  BetStatus.ACTIVE,
  BetStatus.JUDGING,
  BetStatus.RESOLVED,
  BetStatus.CANCELLED,
  BetStatus.CANCELLED,
]

const JUDGING_WINDOW_SECONDS = 30 * 24 * 60 * 60

type ChainBet = {
  address: string
  description: string
  maker: string
  taker: string
  judge: string
  winner: string | null
  asset: string
  makerStake: string
  status: BetStatus
  accepted: boolean
  createdAt: number // unix seconds
  acceptBy: number
  endsBy: number
  judgeDeadline: number
}

// Normalize status across contract versions (v1's bet() may not time-derive)
function deriveStatus(
  rawStatus: BetStatus,
  acceptBy: number,
  endsBy: number,
  judgeDeadline: number
): BetStatus {
  const now = Math.floor(Date.now() / 1000)
  if (rawStatus === BetStatus.PENDING && now > acceptBy) {
    return BetStatus.CANCELLED
  }
  if (rawStatus === BetStatus.ACTIVE || rawStatus === BetStatus.JUDGING) {
    if (now > judgeDeadline) return BetStatus.CANCELLED
    if (now > endsBy) return BetStatus.JUDGING
  }
  return rawStatus
}

async function loadChainBets(): Promise<ChainBet[]> {
  const latestBlock = await baseClient.getBlockNumber()

  // Seed (generated at build time) + incremental scan since then
  const known = new Map<string, DiscoveredBet>()
  for (const bet of seed.bets as DiscoveredBet[]) {
    known.set(bet.address.toLowerCase(), bet)
  }
  try {
    const discovered = await discoverNewBets(
      BigInt(seed.scannedToBlock + 1),
      latestBlock
    )
    for (const bet of discovered) {
      if (!known.has(bet.address)) known.set(bet.address, bet)
    }
  } catch (err) {
    // Serve seed bets rather than failing outright if the scan hiccups
    console.error('Incremental bet scan failed:', err)
  }

  const bets = [...known.values()]
  if (bets.length === 0) return []

  // bet() exists on both contract versions and returns live, time-derived state
  const contracts = bets.map(
    (bet) =>
      ({
        address: bet.address as Address,
        abi: BET_V2_ABI,
        functionName: 'bet',
      }) as const
  )

  const results = await baseClient.multicall({ contracts })

  return bets.flatMap((bet, i) => {
    const betResult = results[i]
    if (betResult.status !== 'success') {
      return []
    }

    const state = betResult.result as {
      maker: Address
      acceptBy: number
      endsBy: number
      status: number
      taker: Address
      judge: Address
      asset: Address
      winner: Address
      makerStake: bigint
      takerStake: bigint
    }

    const acceptBy = Number(state.acceptBy)
    const endsBy = Number(state.endsBy)
    const judgeDeadline = endsBy + JUDGING_WINDOW_SECONDS
    const rawStatus = STATUS_BY_INDEX[state.status] ?? BetStatus.PENDING
    const status = deriveStatus(rawStatus, acceptBy, endsBy, judgeDeadline)
    const accepted =
      state.status === 1 || // ACTIVE
      state.status === 2 || // JUDGING
      (state.status === 3 && state.winner !== zeroAddress) // RESOLVED

    return {
      address: bet.address,
      description: bet.description,
      maker: state.maker.toLowerCase(),
      taker: state.taker.toLowerCase(),
      judge: state.judge.toLowerCase(),
      winner: state.winner === zeroAddress ? null : state.winner.toLowerCase(),
      asset: state.asset.toLowerCase(),
      makerStake: state.makerStake.toString(),
      status,
      accepted,
      createdAt: bet.createdAt,
      acceptBy,
      endsBy,
      judgeDeadline,
    }
  })
}

const getChainBetsCached = unstable_cache(loadChainBets, ['chain-bets-v1'], {
  revalidate: 30,
  tags: ['bets'],
})

// =============================================================================
// ENS enrichment (mainnet, cached aggressively - names change rarely)
// =============================================================================

async function lookupEnsProfile(address: string): Promise<BetUser> {
  const user: BetUser = { address, name: null, avatarUrl: null }
  try {
    user.name = await mainnetClient.getEnsName({
      address: address as Address,
    })
    if (user.name) {
      user.avatarUrl = await mainnetClient.getEnsAvatar({ name: user.name })
    }
  } catch {
    // ENS is a nice-to-have; fall back to bare address on any failure
  }
  return user
}

async function lookupEnsProfiles(addresses: string[]): Promise<BetUser[]> {
  const users: BetUser[] = []
  const BATCH = 10
  for (let i = 0; i < addresses.length; i += BATCH) {
    const batch = addresses.slice(i, i + BATCH)
    users.push(...(await Promise.all(batch.map(lookupEnsProfile))))
  }
  return users
}

const getEnsProfilesCached = unstable_cache(
  lookupEnsProfiles,
  ['ens-profiles-v1'],
  { revalidate: 6 * 60 * 60 }
)

// =============================================================================
// One-off ENS resolution (used by /api/resolve for the create-bet form)
// =============================================================================

export async function resolveEnsAddress(name: string): Promise<string | null> {
  try {
    const { normalize } = await import('viem/ens')
    return await mainnetClient.getEnsAddress({ name: normalize(name) })
  } catch {
    return null
  }
}

export async function resolveEnsName(address: string): Promise<string | null> {
  try {
    return await mainnetClient.getEnsName({ address: address as Address })
  } catch {
    return null
  }
}

// =============================================================================
// Public API - enriched bets, newest first
// =============================================================================

function getAsset(assetAddress: string) {
  const usdc = SUPPORTED_ASSETS.USDC
  if (assetAddress.toLowerCase() === usdc.address.toLowerCase()) {
    return { ...usdc }
  }
  return { address: assetAddress, symbol: 'UNKNOWN', decimals: 18 }
}

function toMs(seconds: number): number {
  return seconds * 1000
}

export async function getBets(): Promise<Bet[]> {
  const chainBets = await getChainBetsCached()

  const addresses = new Set<string>()
  for (const bet of chainBets) {
    addresses.add(bet.maker)
    addresses.add(bet.taker)
    addresses.add(bet.judge)
    if (bet.winner) addresses.add(bet.winner)
  }
  const profiles = await getEnsProfilesCached([...addresses].sort())
  const users = new Map(profiles.map((user) => [user.address, user]))
  const getUser = (address: string): BetUser =>
    users.get(address) ?? { address, name: null, avatarUrl: null }

  return chainBets
    .map((bet) => {
      const asset = getAsset(bet.asset)
      const taker = getUser(bet.taker)
      return {
        address: bet.address,
        description: bet.description,
        maker: getUser(bet.maker),
        taker,
        judge: getUser(bet.judge),
        asset,
        amount: (Number(bet.makerStake) / 10 ** asset.decimals).toString(),
        status: bet.status,
        createdAt: toMs(bet.createdAt),
        expiresAt: toMs(bet.endsBy),
        acceptBy: toMs(bet.acceptBy),
        judgeDeadline: toMs(bet.judgeDeadline),
        winner: bet.winner ? getUser(bet.winner) : null,
        acceptedBy: bet.accepted ? taker : null,
      }
    })
    .sort((a, b) => b.createdAt - a.createdAt)
}
