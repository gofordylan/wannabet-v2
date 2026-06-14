import { createPublicClient, getAddress, http, type Address } from 'viem'
import { mainnet } from 'viem/chains'
import { normalize } from 'viem/ens'

import { User } from './lib/constants'

// =============================================================================
// ENS Client (Ethereum mainnet)
// =============================================================================
// ENS records (names + avatars) live on Ethereum mainnet, not Base. We resolve
// them with a lightweight viem client. Multicall batching coalesces the many
// per-address lookups into a single eth_call per block, keeping RPC usage low
// enough for a free public endpoint. wannabet.eth subnames resolve through the
// same Universal Resolver path once they exist.

const MAINNET_RPC_URL =
  process.env.MAINNET_RPC_URL || 'https://ethereum-rpc.publicnode.com'

const client = createPublicClient({
  chain: mainnet,
  transport: http(MAINNET_RPC_URL),
  batch: { multicall: true },
})

// =============================================================================
// In-Memory Cache
// =============================================================================

interface CacheEntry {
  user: User
  expiresAt: number
}

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour - ENS records change rarely
const userCache = new Map<string, CacheEntry>()

function getCachedUser(address: string): User | null {
  const entry = userCache.get(address.toLowerCase())
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    userCache.delete(address.toLowerCase())
    return null
  }
  return entry.user
}

function setCachedUser(address: string, user: User): void {
  userCache.set(address.toLowerCase(), {
    user,
    expiresAt: Date.now() + CACHE_TTL_MS,
  })
}

// =============================================================================
// Resolution
// =============================================================================

function placeholderUser(address: string): User {
  return { address, ensName: null, ensAvatar: null }
}

async function resolveUser(address: string): Promise<User> {
  try {
    const ensName = await client.getEnsName({
      address: getAddress(address as Address),
    })
    if (!ensName) return placeholderUser(address)

    let ensAvatar: string | null = null
    try {
      ensAvatar = await client.getEnsAvatar({ name: normalize(ensName) })
    } catch {
      ensAvatar = null
    }

    return { address, ensName, ensAvatar }
  } catch {
    // Invalid address or RPC failure - degrade gracefully to the bare address
    return placeholderUser(address)
  }
}

/**
 * Resolve ENS profiles for a list of Ethereum addresses.
 * Uses an in-memory cache to reduce RPC calls.
 * Returns a Map of lowercased address -> User.
 */
export async function fetchUsersByAddresses(
  addresses: string[]
): Promise<Map<string, User>> {
  const result = new Map<string, User>()
  const addressesToFetch: string[] = []

  for (const address of addresses) {
    const cached = getCachedUser(address)
    if (cached) {
      result.set(address.toLowerCase(), cached)
    } else {
      addressesToFetch.push(address)
    }
  }

  if (addressesToFetch.length === 0) {
    return result
  }

  const resolved = await Promise.all(
    addressesToFetch.map(async (address) => ({
      address,
      user: await resolveUser(address),
    }))
  )
  for (const { address, user } of resolved) {
    setCachedUser(address, user)
    result.set(address.toLowerCase(), user)
  }

  return result
}

/**
 * Resolve a single user by address. Uses the bulk lookup internally.
 */
export async function fetchUserByAddress(address: string): Promise<User> {
  const users = await fetchUsersByAddresses([address])
  return users.get(address.toLowerCase()) ?? placeholderUser(address)
}
