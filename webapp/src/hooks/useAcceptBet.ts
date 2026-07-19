import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { type Address, parseUnits } from 'viem'
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'

import { refreshBets } from '@/lib/bets'
import {
  BET_ABI,
  ERC20_ABI,
  USDC_ADDRESS,
  USDC_DECIMALS,
} from '@/lib/contracts'

type Phase = 'idle' | 'approving' | 'accepting' | 'success' | 'error'

export function useAcceptBet(betAddress: Address, takerStake: string) {
  const { address } = useAccount()
  const queryClient = useQueryClient()
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)

  const takerStakeUnits = parseUnits(takerStake, USDC_DECIMALS)

  // Read current USDC allowance for the bet contract
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, betAddress] : undefined,
    query: { enabled: !!address },
  })

  // Write contract hooks
  const {
    writeContractAsync: approve,
    data: approveHash,
    reset: resetApprove,
  } = useWriteContract()

  const {
    writeContractAsync: accept,
    data: acceptHash,
    reset: resetAccept,
  } = useWriteContract()

  // Wait for transactions
  const { isLoading: isApprovalPending } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  const { isLoading: isAcceptPending } = useWaitForTransactionReceipt({
    hash: acceptHash,
  })

  const reset = useCallback(() => {
    setPhase('idle')
    setError(null)
    resetApprove()
    resetAccept()
  }, [resetApprove, resetAccept])

  const submit = useCallback(async () => {
    if (!address) {
      setError('Wallet not connected')
      setPhase('error')
      return
    }

    try {
      setError(null)

      // Check if approval is needed
      const currentAllowance = allowance ?? BigInt(0)
      if (currentAllowance < takerStakeUnits) {
        setPhase('approving')

        await approve({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [betAddress, takerStakeUnits],
        })

        // Wait for approval to be confirmed
        await new Promise<void>((resolve, reject) => {
          const checkApproval = async () => {
            const result = await refetchAllowance()
            if (result.data && result.data >= takerStakeUnits) {
              resolve()
            } else {
              setTimeout(checkApproval, 1000)
            }
          }
          setTimeout(checkApproval, 2000)
          setTimeout(() => reject(new Error('Approval timeout')), 60000)
        })
      }

      // Accept the bet
      setPhase('accepting')

      await accept({
        address: betAddress,
        abi: BET_ABI,
        functionName: 'accept',
      })

      // Wait a bit for the transaction to be mined
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Invalidate queries to refresh data
      await refreshBets()
      await queryClient.invalidateQueries({ queryKey: ['bets'] })
      await queryClient.invalidateQueries({ queryKey: ['bet', betAddress] })

      setPhase('success')
    } catch (err) {
      console.error('Accept bet error:', err)
      setError(err instanceof Error ? err.message : 'Failed to accept bet')
      setPhase('error')
    }
  }, [
    address,
    allowance,
    approve,
    accept,
    betAddress,
    takerStakeUnits,
    queryClient,
    refetchAllowance,
  ])

  return {
    submit,
    reset,
    phase,
    error,
    isApprovalPending,
    isAcceptPending,
    isPending: phase === 'approving' || phase === 'accepting',
  }
}
