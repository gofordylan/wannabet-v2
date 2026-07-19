import { NextResponse } from 'next/server'

import { getBets } from '@/lib/bets-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await getBets())
  } catch (err) {
    console.error('Failed to load bets:', err)
    return NextResponse.json({ error: 'Failed to load bets' }, { status: 500 })
  }
}
