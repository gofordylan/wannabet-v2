import type { Bet } from 'shared'

export async function fetchBets(): Promise<Bet[]> {
  const response = await fetch('/api/bets')

  if (!response.ok) {
    throw new Error(`Failed to fetch bets: ${response.status}`)
  }

  return response.json()
}

export async function fetchBetById(id: string): Promise<Bet | null> {
  const bets = await fetchBets()
  return (
    bets.find((bet) => bet.address.toLowerCase() === id.toLowerCase()) || null
  )
}

// Bust the server-side cache after an on-chain write so refetches see it
export async function refreshBets() {
  try {
    await fetch('/api/bets/revalidate', { method: 'POST' })
  } catch {
    // Best effort - the cache expires on its own shortly anyway
  }
}
