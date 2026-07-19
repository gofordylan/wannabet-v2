import { NextResponse } from 'next/server'

import seed from '@/generated/bet-seed.json'

// Exposes the bet seed this deployment was built with (public chain data).
// Used to sync a freshly scanned seed back into the repo so future builds
// only scan the gap since this one: curl /api/seed > src/generated/bet-seed.json
export async function GET() {
  return NextResponse.json(seed)
}
