import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, getAddress, http, isAddress } from 'viem'
import { mainnet } from 'viem/chains'
import { normalize } from 'viem/ens'

// ENS lives on Ethereum mainnet. Resolve names (including *.wannabet.eth
// subnames) and addresses here so the create-bet flow can pick a counterparty
// without any third-party profile service.
const client = createPublicClient({
  chain: mainnet,
  transport: http(
    process.env.MAINNET_RPC_URL || 'https://ethereum-rpc.publicnode.com'
  ),
})

type ResolvedUser = {
  address: string
  ensName: string | null
  ensAvatar: string | null
}

async function avatarFor(name: string): Promise<string | null> {
  try {
    return await client.getEnsAvatar({ name: normalize(name) })
  } catch {
    return null
  }
}

async function resolveName(name: string): Promise<ResolvedUser | null> {
  try {
    const normalized = normalize(name)
    const address = await client.getEnsAddress({ name: normalized })
    if (!address) return null
    return { address, ensName: name, ensAvatar: await avatarFor(normalized) }
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim()

  if (!query || query.length < 3) {
    return NextResponse.json({ users: [] })
  }

  try {
    // 1. Raw 0x address -> reverse-resolve its ENS name
    if (isAddress(query)) {
      const address = getAddress(query)
      const ensName = await client.getEnsName({ address }).catch(() => null)
      const ensAvatar = ensName ? await avatarFor(ensName) : null
      return NextResponse.json({ users: [{ address, ensName, ensAvatar }] })
    }

    // 2. Fully-qualified ENS name (contains a dot)
    if (query.includes('.')) {
      const user = await resolveName(query)
      return NextResponse.json({ users: user ? [user] : [] })
    }

    // 3. Bare label -> try a wannabet.eth subname first, then a plain .eth name
    for (const candidate of [`${query}.wannabet.eth`, `${query}.eth`]) {
      const user = await resolveName(candidate)
      if (user) return NextResponse.json({ users: [user] })
    }

    return NextResponse.json({ users: [] })
  } catch (error) {
    console.error('User search error:', error)
    return NextResponse.json(
      { users: [], error: 'Search failed' },
      { status: 500 }
    )
  }
}
