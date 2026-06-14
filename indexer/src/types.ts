import { getEnrichedBets } from './api/handlers/bets'

// Re-export base types
export { BetStatus, SUPPORTED_ASSETS, type Asset, type User } from './lib/constants'

// Helper type to convert bigints to strings (matches JSON serialization)
type ReplaceBigInts<T> = T extends bigint
  ? string
  : T extends Array<infer U>
    ? Array<ReplaceBigInts<U>>
    : T extends object
      ? { [K in keyof T]: ReplaceBigInts<T[K]> }
      : T

// Bet type - inferred from the enriched API response with bigints converted to strings
export type Bet = ReplaceBigInts<Awaited<ReturnType<typeof getEnrichedBets>>[number]>
