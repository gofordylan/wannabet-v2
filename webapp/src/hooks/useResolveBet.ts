import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import type { Address } from 'viem'
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'

import { refreshBets } from '@/lib/bets'
import { BET_ABI } from '@/lib/contracts'

type Phase = 'idle' | 'resolving' | 'success' | 'error'

export function useResolveBet(betAddress: Address) {
  const { address } = useAccount()
  const queryClient = useQueryClient()
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)

  const {
    writeContractAsync: resolve,
    data: resolveHash,
    reset: resetResolve,
  } = useWriteContract()

  const { isLoading: isResolvePending } = useWaitForTransactionReceipt({
    hash: resolveHash,
  })

  const reset = useCallback(() => {
    setPhase('idle')
    setError(null)
    resetResolve()
  }, [resetResolve])

  const submit = useCallback(
    async (winner: Address) => {
      if (!address) {
        setError('Wallet not connected')
        setPhase('error')
        return
      }

      try {
        setError(null)
        setPhase('resolving')

        await resolve({
          address: betAddress,
          abi: BET_ABI,
          functionName: 'resolve',
          args: [winner],
        })

        // Wait a bit for the transaction to be mined
        await new Promise((resolve) => setTimeout(resolve, 3000))

        // Invalidate queries to refresh data
        await refreshBets()
        await queryClient.invalidateQueries({ queryKey: ['bets'] })
        await queryClient.invalidateQueries({ queryKey: ['bet', betAddress] })

        setPhase('success')
      } catch (err) {
        console.error('Resolve bet error:', err)
        setError(err instanceof Error ? err.message : 'Failed to resolve bet')
        setPhase('error')
      }
    },
    [address, resolve, betAddress, queryClient]
  )

  return {
    submit,
    reset,
    phase,
    error,
    isResolvePending,
    isPending: phase === 'resolving',
  }
}
