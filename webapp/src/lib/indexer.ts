import type { Bet, User } from 'indexer/types'

const INDEXER_URL =
  process.env.NEXT_PUBLIC_INDEXER_URL ||
  'https://wannabet-v2-production.up.railway.app'

export async function tagBetSource(betAddress: string, source: string) {
  try {
    await fetch(`${INDEXER_URL}/bets/${betAddress.toLowerCase()}/source`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source }),
    })
  } catch (err) {
    console.warn('Failed to tag bet source:', err)
  }
}

export async function fetchBets(): Promise<Bet[]> {
  const response = await fetch(`${INDEXER_URL}/bets`)

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

export async function fetchUserByAddress(
  address: string
): Promise<User> {
  const response = await fetch(`${INDEXER_URL}/user/${address}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.status}`)
  }

  return response.json()
}
