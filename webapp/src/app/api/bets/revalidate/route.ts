import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

// Called after on-chain writes (create/accept/resolve/cancel) so the next
// /api/bets read picks up the new state without waiting out the cache TTL.
export async function POST() {
  revalidateTag('bets', 'max')
  return NextResponse.json({ ok: true })
}
