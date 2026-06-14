import pg from 'pg'
import { desc, eq } from 'ponder'
import { db } from 'ponder:api'
import schema from 'ponder:schema'

import { BetStatus, User, SUPPORTED_ASSETS } from '../../lib/constants'
import { fetchUsersByAddresses } from '../../ens'

// Direct PostgreSQL connection for reading source overrides
const readPool = process.env.DATABASE_URL
  ? new pg.Pool({ connectionString: process.env.DATABASE_URL })
  : null

// Raw bets from the database
export async function getBets(options?: { source?: string }) {
  return db
    .select()
    .from(schema.bet)
    .where(options?.source ? eq(schema.bet.source, options.source) : undefined)
    .orderBy(desc(schema.bet.createdAt))
}

// Fetch source overrides from the separate source_override table
async function getSourceOverrides(): Promise<Map<string, string>> {
  if (!readPool) return new Map()
  try {
    const result = await readPool.query('SELECT bet_address, source FROM source_override')
    const map = new Map<string, string>()
    for (const row of result.rows) {
      map.set((row.bet_address as string).toLowerCase(), row.source as string)
    }
    return map
  } catch {
    // Table may not exist yet if no overrides have been written
    return new Map()
  }
}

// Create a placeholder user from an address
function createPlaceholderUser(address: string): User {
  return {
    address,
    ensName: null,
    ensAvatar: null,
  }
}

// Determine bet status from database record
function deriveBetStatus(
  bet: Awaited<ReturnType<typeof getBets>>[number]
): BetStatus {
  const now = Math.floor(Date.now() / 1000)

  if (bet.cancelledAt) {
    return BetStatus.CANCELLED
  }
  if (bet.winner) {
    return BetStatus.RESOLVED
  }
  if (bet.acceptedAt) {
    // Bet is accepted - check if we're past endsBy (judging period)
    if (now > bet.endsBy) {
      return BetStatus.JUDGING
    }
    return BetStatus.ACTIVE
  }
  // Bet not accepted - check if acceptBy deadline has passed (expired)
  if (now > bet.acceptBy) {
    return BetStatus.CANCELLED
  }
  return BetStatus.PENDING
}

// Get asset metadata from address
function getAsset(assetAddress: string) {
  const usdc = SUPPORTED_ASSETS.USDC
  if (assetAddress.toLowerCase() === usdc.address.toLowerCase()) {
    return { ...usdc }
  }
  // Fallback for unknown assets
  return {
    address: assetAddress,
    symbol: 'UNKNOWN',
    decimals: 18,
  }
}

// Convert seconds to milliseconds for frontend date handling
function toMs(seconds: number): number {
  return seconds * 1000
}

// Enriched bets with derived status, Farcaster user data, and asset metadata
export async function getEnrichedBets(options?: { source?: string }) {
  // Fetch bets and source overrides in parallel
  const [bets, sourceOverrides] = await Promise.all([
    getBets(),
    getSourceOverrides(),
  ])

  // Collect all unique addresses to fetch
  const allAddresses = new Set<string>()
  for (const bet of bets) {
    allAddresses.add(bet.maker)
    allAddresses.add(bet.taker)
    allAddresses.add(bet.judge)
    if (bet.winner) {
      allAddresses.add(bet.winner)
    }
  }

  // Fetch all users in a single batch
  const usersMap = await fetchUsersByAddresses([...allAddresses])

  // Helper to get user from map or create placeholder
  const getUser = (address: string): User =>
    usersMap.get(address.toLowerCase()) ?? createPlaceholderUser(address)

  const enriched = bets.map((bet) => {
    const asset = getAsset(bet.asset)
    const amount = (Number(bet.makerStake) / 10 ** asset.decimals).toString()
    const taker = getUser(bet.taker)
    // Apply source override if one exists (e.g. web dapp tagging)
    const source = sourceOverrides.get(bet.address.toLowerCase()) ?? bet.source

    return {
      address: bet.address,
      description: bet.description,
      maker: getUser(bet.maker),
      taker,
      judge: getUser(bet.judge),
      asset,
      amount,
      status: deriveBetStatus(bet),
      source,
      createdAt: toMs(bet.createdAt),
      expiresAt: toMs(bet.endsBy),
      acceptBy: toMs(bet.acceptBy),
      judgeDeadline: toMs(bet.judgeDeadline),
      winner: bet.winner ? getUser(bet.winner) : null,
      acceptedAt: bet.acceptedAt ? toMs(bet.acceptedAt) : null,
      acceptedBy: bet.acceptedAt ? taker : null,
    }
  })

  // Apply source filter after overrides so web-tagged bets filter correctly
  if (options?.source) {
    return enriched.filter((bet) => bet.source === options.source)
  }

  return enriched
}
