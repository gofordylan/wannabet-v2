'use client'

import { Loader2, Wallet } from 'lucide-react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'

import { Button } from '@/components/ui/button'
import { useProfile } from '@/hooks/useProfile'
import { shortenAddress } from '@/lib/utils'

export function ConnectWalletButton() {
  const { address, isConnected, isConnecting } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: profile } = useProfile(address)

  if (isConnecting || isPending) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
        Connecting...
      </Button>
    )
  }

  if (isConnected && address) {
    return (
      <Button
        variant="outline"
        onClick={() => disconnect()}
        className="font-mono"
      >
        <Wallet className="h-4 w-4" />
        {profile?.ensName ?? shortenAddress(address)}
      </Button>
    )
  }

  return (
    <Button
      onClick={() => {
        const injectedConnector = connectors.find((c) => c.type === 'injected')
        if (injectedConnector) {
          connect({ connector: injectedConnector })
        }
      }}
      variant="outline"
    >
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </Button>
  )
}
