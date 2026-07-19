import { NextRequest, NextResponse } from 'next/server'

import { resolveEnsAddress, resolveEnsName } from '@/lib/bets-server'

export const dynamic = 'force-dynamic'

// ENS resolution: ?name=foo.eth -> address, ?address=0x... -> primary name
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name')
  const address = request.nextUrl.searchParams.get('address')

  try {
    if (name) {
      return NextResponse.json({ address: await resolveEnsAddress(name) })
    }
    if (address) {
      return NextResponse.json({ name: await resolveEnsName(address) })
    }
  } catch {
    return NextResponse.json({ address: null, name: null })
  }

  return NextResponse.json(
    { error: 'Pass ?name= or ?address=' },
    { status: 400 }
  )
}
