import { useCallback, useState } from 'react'
import { parseUnits, type Address } from 'viem'
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'

import {
  USDC_ADDRESS,
  USDC_DECIMALS,
  ERC20_ABI,
  BET_FACTORY_ADDRESS,
  BET_FACTORY_ABI,
} from '@/lib/contracts'
import { tagBetSource } from '@/lib/indexer'

export type CreateBetParams = {
  taker: Address
  judge: Address
  makerStake: string // Human-readable amount (e.g., "100")
  takerStake: string
  acceptBy: number // Unix timestamp
  endsBy: number // Unix timestamp
  description: string
}

type Phase = 'idle' | 'approving' | 'creating' | 'success' | 'error'

export function useCreateBet() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const queryClient = useQueryClient()
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [betAddress, setBetAddress] = useState<Address | null>(null)

  // Write contract hooks
  const {
    writeContractAsync: approve,
    data: approveHash,
    reset: resetApprove,
  } = useWriteContract()

  const {
    writeContractAsync: createBet,
    data: createHash,
    reset: resetCreate,
  } = useWriteContract()

  // Wait for approval transaction
  const { isLoading: isApprovalPending } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  // Wait for create transaction
  const { isLoading: isCreatePending } = useWaitForTransactionReceipt({
    hash: createHash,
  })

  const reset = useCallback(() => {
    setPhase('idle')
    setError(null)
    setBetAddress(null)
    resetApprove()
    resetCreate()
  }, [resetApprove, resetCreate])

  const submit = useCallback(
    async (params: CreateBetParams) => {
      if (!address || !publicClient) {
        setError('Wallet not connected')
        setPhase('error')
        return
      }

      try {
        setError(null)
        const makerStakeUnits = parseUnits(params.makerStake, USDC_DECIMALS)
        const takerStakeUnits = parseUnits(params.takerStake, USDC_DECIMALS)

        // First, predict the bet address - this is where we need to approve USDC
        const predictedBetAddress = (await publicClient.readContract({
          address: BET_FACTORY_ADDRESS,
          abi: BET_FACTORY_ABI,
          functionName: 'predictBetAddress',
          args: [address, params.taker, params.acceptBy, params.endsBy],
        })) as Address

        // Check current allowance for the predicted bet address
        const currentAllowance = (await publicClient.readContract({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address, predictedBetAddress],
        })) as bigint

        // Approve if needed - approve to the predicted bet address, not the factory
        if (currentAllowance < makerStakeUnits) {
          setPhase('approving')

          await approve({
            address: USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [predictedBetAddress, makerStakeUnits],
          })

          // Wait for approval to be confirmed by polling
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(
              () => reject(new Error('Approval timeout')),
              60000
            )
            const checkApproval = async () => {
              try {
                const newAllowance = (await publicClient.readContract({
                  address: USDC_ADDRESS,
                  abi: ERC20_ABI,
                  functionName: 'allowance',
                  args: [address, predictedBetAddress],
                })) as bigint

                if (newAllowance >= makerStakeUnits) {
                  clearTimeout(timeout)
                  resolve()
                } else {
                  setTimeout(checkApproval, 2000)
                }
              } catch {
                setTimeout(checkApproval, 2000)
              }
            }
            setTimeout(checkApproval, 3000)
          })
        }

        // Create the bet
        setPhase('creating')

        const hash = await createBet({
          address: BET_FACTORY_ADDRESS,
          abi: BET_FACTORY_ABI,
          functionName: 'createBet',
          args: [
            params.taker,
            params.judge,
            USDC_ADDRESS,
            makerStakeUnits,
            takerStakeUnits,
            params.acceptBy,
            params.endsBy,
            params.description,
          ],
        })

        // Wait for transaction to be mined
        const receipt = await publicClient.waitForTransactionReceipt({ hash })

        // Parse BetCreated event from logs to get the bet address
        const betCreatedLog = receipt.logs.find((log) => {
          // BetCreated event topic
          return (
            log.topics[0] ===
            '0x0a68feb3af8d20e83ca63ae35d7c4fb14618273aa52ab999eefbceb81e3ffba5'
          )
        })

        let finalBetAddress: Address
        if (betCreatedLog && betCreatedLog.topics[1]) {
          finalBetAddress = ('0x' +
            betCreatedLog.topics[1].slice(26)) as Address
        } else {
          finalBetAddress = predictedBetAddress
        }
        setBetAddress(finalBetAddress)

        // Tag this bet as created from the web app
        tagBetSource(finalBetAddress, 'web')

        // Wait for indexer to pick up the new bet before refreshing
        await new Promise((resolve) => setTimeout(resolve, 5000))

        // Invalidate the bets query to refresh the list
        await queryClient.invalidateQueries({ queryKey: ['bets'] })

        setPhase('success')
      } catch (err) {
        console.error('Create bet error:', err)
        setError(err instanceof Error ? err.message : 'Failed to create bet')
        setPhase('error')
      }
    },
    [address, publicClient, approve, createBet, queryClient]
  )

  return {
    submit,
    reset,
    phase,
    error,
    betAddress,
    isApprovalPending,
    isCreatePending,
    isPending: phase === 'approving' || phase === 'creating',
  }
}
