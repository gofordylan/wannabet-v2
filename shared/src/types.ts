// =============================================================================
// BetStatus - matches IBet.sol Status enum (EXPIRED is folded into CANCELLED)
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
// BetUser - a bet participant, optionally enriched with ENS data
// =============================================================================
export type BetUser = {
  address: string
  /** ENS name, if the address has a primary name set */
  name: string | null
  /** ENS avatar URL, if the name has one */
  avatarUrl: string | null
}

// =============================================================================
// Bet - enriched bet as served by /api/bets (timestamps in milliseconds)
// =============================================================================
export type Bet = {
  address: string
  description: string
  maker: BetUser
  taker: BetUser
  judge: BetUser
  asset: Asset
  amount: string
  status: BetStatus
  createdAt: number
  expiresAt: number
  acceptBy: number
  judgeDeadline: number
  winner: BetUser | null
  /** The taker, once they have accepted the bet */
  acceptedBy: BetUser | null
  /**
   * True when the bet lapsed (accept or judging deadline passed) but nobody
   * has called cancel() yet - the stakes are still held by the bet contract.
   * Such bets display as CANCELLED but funds are reclaimable.
   */
  expired: boolean
}
