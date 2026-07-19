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

type Phase = 'idle' | 'cancelling' | 'success' | 'error'

export function useCancelBet(betAddress: Address) {
  const { address } = useAccount()
  const queryClient = useQueryClient()
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)

  const {
    writeContractAsync: cancel,
    data: cancelHash,
    reset: resetCancel,
  } = useWriteContract()

  const { isLoading: isCancelPending } = useWaitForTransactionReceipt({
    hash: cancelHash,
  })

  const reset = useCallback(() => {
    setPhase('idle')
    setError(null)
    resetCancel()
  }, [resetCancel])

  const submit = useCallback(async (): Promise<boolean> => {
    if (!address) {
      setError('Wallet not connected')
      setPhase('error')
      return false
    }

    try {
      setError(null)
      setPhase('cancelling')

      await cancel({
        address: betAddress,
        abi: BET_ABI,
        functionName: 'cancel',
      })

      // Wait a bit for the transaction to be mined
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Invalidate queries to refresh data
      await refreshBets()
      await queryClient.invalidateQueries({ queryKey: ['bets'] })
      await queryClient.invalidateQueries({ queryKey: ['bet', betAddress] })

      setPhase('success')
      return true
    } catch (err) {
      console.error('Cancel bet error:', err)
      setError(err instanceof Error ? err.message : 'Failed to cancel bet')
      setPhase('error')
      return false
    }
  }, [address, cancel, betAddress, queryClient])

  return {
    submit,
    reset,
    phase,
    error,
    isCancelPending,
    isPending: phase === 'cancelling',
  }
}
