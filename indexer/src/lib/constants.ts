// =============================================================================
// BetStatus - matches IBet.sol Status enum
// =============================================================================
export enum BetStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  JUDGING = 'JUDGING',
  RESOLVED = 'RESOLVED',
  CANCELLED = 'CANCELLED',
}

// =============================================================================
// Asset - supported betting assets
// =============================================================================
export const SUPPORTED_ASSETS = {
  USDC: {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    symbol: 'USDC',
    decimals: 6,
  },
} as const

export type Asset = {
  address: string
  symbol: string
  decimals: number
}

// =============================================================================
// User - enriched user data (address + ENS profile resolved on Ethereum mainnet)
// =============================================================================
export type User = {
  address: string
  ensName: string | null
  ensAvatar: string | null
}
