'use client'

import { useQuery } from '@tanstack/react-query'
import { Loader2, Wallet } from 'lucide-react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'

import { Button } from '@/components/ui/button'
import { shortenAddress } from '@/lib/utils'

function useEnsDisplayName(address: string | undefined) {
  return useQuery({
    queryKey: ['ens-name', address?.toLowerCase()],
    queryFn: async () => {
      const response = await fetch(`/api/resolve?address=${address}`)
      if (!response.ok) return null
      const data = await response.json()
      return (data.name as string | null) ?? null
    },
    enabled: !!address,
    staleTime: 60 * 60 * 1000,
  })
}

export function ConnectWalletButton() {
  const { address, isConnected, isConnecting } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: ensName } = useEnsDisplayName(address)

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
        {ensName || shortenAddress(address)}
      </Button>
    )
  }

  const handleConnect = () => {
    // Prefer a browser wallet when one is installed; otherwise fall back to
    // Coinbase Wallet (works via popup/QR without an extension)
    const injectedConnector = connectors.find((c) => c.type === 'injected')
    const coinbaseConnector = connectors.find(
      (c) => c.type === 'coinbaseWallet'
    )
    const hasInjectedProvider =
      typeof window !== 'undefined' &&
      !!(window as { ethereum?: unknown }).ethereum
    const connector =
      (hasInjectedProvider ? injectedConnector : coinbaseConnector) ??
      injectedConnector ??
      coinbaseConnector
    if (connector) {
      connect({ connector })
    }
  }

  return (
    <Button onClick={handleConnect} variant="outline">
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </Button>
  )
}
