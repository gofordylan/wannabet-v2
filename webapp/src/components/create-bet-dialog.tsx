'use client'

import { Loader2, Plus, Share2 } from 'lucide-react'
import Image from 'next/image'
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { Address } from 'viem'
import { useAccount } from 'wagmi'

import { AddressInput } from '@/components/address-input'
import { DatePicker } from '@/components/date-picker'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { UsdcBalance } from '@/components/usdc-balance'
import { useCreateBet } from '@/hooks/useCreateBet'
import { shortenAddress } from '@/lib/utils'

type SubmitPhase = 'idle' | 'approving' | 'creating' | 'done' | 'error'

interface FormData {
  taker: string
  takerAddress?: Address
  judge: string
  judgeAddress?: Address
  amount: string
  expiresAt: string
  description: string
}

const INITIAL_FORM_DATA: FormData = {
  taker: '',
  judge: '',
  amount: '',
  expiresAt: '',
  description: '',
}

export function CreateBetDialog() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA)
  const [phase, setPhase] = useState<SubmitPhase>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle')

  const { isConnected } = useAccount()
  const {
    submit: submitCreateBet,
    reset: resetCreateBet,
    phase: createPhase,
    error: createError,
    betAddress,
  } = useCreateBet()

  // Sync hook phase with local phase
  useEffect(() => {
    if (createPhase === 'approving') setPhase('approving')
    else if (createPhase === 'creating') setPhase('creating')
    else if (createPhase === 'success') setPhase('done')
    else if (createPhase === 'error') {
      setPhase('error')
      setErrorMessage(createError)
    }
  }, [createPhase, createError])

  // Open dialog via #create hash
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#create') {
        setOpen(true)
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search
        )
      }
    }
    window.addEventListener('hashchange', handleHash)
    handleHash()
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  // Form validation
  const isFormValid = useMemo(() => {
    const hasOpponent = !!formData.takerAddress
    const hasDescription = formData.description.trim().length > 5
    const hasValidDate = formData.expiresAt.length > 0
    const hasValidAmount = Number(formData.amount) > 0
    const hasJudge = !!formData.judgeAddress

    return (
      hasOpponent &&
      hasDescription &&
      hasValidDate &&
      hasValidAmount &&
      hasJudge &&
      isConnected
    )
  }, [formData, isConnected])

  const isSubmitting = phase === 'approving' || phase === 'creating'

  // Reset form
  const handleReset = useCallback(() => {
    setFormData(INITIAL_FORM_DATA)
    setPhase('idle')
    setErrorMessage(null)
    setShareStatus('idle')
    resetCreateBet()
  }, [resetCreateBet])

  // Copy a link to the new bet
  const handleShare = useCallback(async () => {
    if (!betAddress) return
    const betUrl = `https://heywannabet.com/bet/${betAddress}`

    try {
      await navigator.clipboard.writeText(betUrl)
      setShareStatus('copied')
      setTimeout(() => setShareStatus('idle'), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [betAddress])

  // Update form field
  const updateField = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  // Submit bet creation
  const handleSubmit = useCallback(async () => {
    if (!formData.takerAddress || !formData.judgeAddress) {
      setErrorMessage(
        'Please enter valid addresses or ENS names for opponent and judge'
      )
      setPhase('error')
      return
    }

    // Calculate timestamps
    const now = Math.floor(Date.now() / 1000)
    const endsBy = Math.floor(new Date(formData.expiresAt).getTime() / 1000)

    // Validate that endsBy is in the future
    if (endsBy <= now) {
      setErrorMessage('End date must be in the future')
      setPhase('error')
      return
    }

    // acceptBy must be before endsBy - set to min(7 days from now, endsBy - 1 hour)
    // with a minimum of 1 hour from now
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60
    const oneHourBeforeEnd = endsBy - 60 * 60
    const oneHourFromNow = now + 60 * 60

    const acceptBy = Math.max(
      oneHourFromNow,
      Math.min(sevenDaysFromNow, oneHourBeforeEnd)
    )

    await submitCreateBet({
      taker: formData.takerAddress,
      judge: formData.judgeAddress,
      makerStake: formData.amount,
      takerStake: formData.amount, // Same stake for both sides
      acceptBy,
      endsBy,
      description: formData.description,
    })
  }, [formData, submitCreateBet])

  return (
    <Drawer
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) handleReset()
      }}
      repositionInputs={false}
    >
      <DrawerTrigger asChild>
        <Button
          size="icon"
          className="bg-wb-coral hover:bg-wb-coral/90 fixed bottom-4 right-3 z-50 h-12 w-12 rounded-full text-white sm:bottom-6 sm:right-6 sm:h-14 sm:w-14 [&_svg]:size-6 sm:[&_svg]:size-8"
          style={{ boxShadow: '0 4px 20px rgba(196,101,74,0.35)' }}
        >
          <Plus className="h-8 w-8" />
        </Button>
      </DrawerTrigger>

      <DrawerContent className="bg-wb-cream max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-wb-brown">Create New Bet</DrawerTitle>
        </DrawerHeader>

        <div className="overflow-y-auto px-6 pb-4">
          {/* Success State */}
          {phase === 'done' && (
            <div className="space-y-4 text-center">
              <div className="text-4xl">🎉</div>
              <p className="text-wb-brown text-lg font-semibold">
                Bet Created Successfully!
              </p>
              <p className="text-wb-taupe text-sm">
                Your bet has been created on Base. Waiting for{' '}
                {formData.takerAddress
                  ? shortenAddress(formData.takerAddress)
                  : 'your opponent'}{' '}
                to accept.
              </p>
              <div className="flex flex-col gap-2 pt-4">
                <Button
                  className="bg-wb-coral hover:bg-wb-coral/90 w-full text-white"
                  size="lg"
                  onClick={handleShare}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  {shareStatus === 'copied' ? 'Copied!' : 'Share Bet'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    setOpen(false)
                    handleReset()
                  }}
                >
                  Done
                </Button>
              </div>
            </div>
          )}

          {/* Error State */}
          {phase === 'error' && (
            <div className="space-y-4 text-center">
              <div className="text-4xl">❌</div>
              <p className="text-wb-brown text-lg font-semibold">
                Failed to Create Bet
              </p>
              <p className="text-wb-taupe text-sm">{errorMessage}</p>
              <div className="flex flex-col gap-2 pt-4">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    setPhase('idle')
                    setErrorMessage(null)
                  }}
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Form */}
          {phase !== 'done' && phase !== 'error' && (
            <div className="space-y-2">
              {/* Opponent */}
              <AddressInput
                label="Who I'm betting"
                value={formData.taker}
                required
                onChange={(value, resolvedAddress) => {
                  updateField('taker', value)
                  updateField('takerAddress', resolvedAddress)
                }}
                labelClassName="text-wb-brown text-sm"
                inputClassName="bg-wb-sand text-wb-brown placeholder:text-wb-taupe"
              />

              {/* Description */}
              <div className="space-y-1">
                <Label className="text-wb-brown text-sm">
                  I am betting that...
                </Label>
                <Textarea
                  placeholder="e.g., the Knicks will win the championship"
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className="bg-wb-sand text-wb-brown placeholder:text-wb-taupe min-h-[60px] resize-none"
                />
              </div>

              {/* End Date and Amount - Side by side */}
              <div className="grid grid-cols-2 items-end gap-3">
                <div className="space-y-1">
                  <Label className="text-wb-brown text-sm">When it ends</Label>
                  <DatePicker
                    value={formData.expiresAt}
                    onChange={(date) => updateField('expiresAt', date)}
                    minDate={new Date()}
                    placeholder="Select date"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-wb-brown text-sm">
                    How much (each)
                  </Label>
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*\.?[0-9]*"
                      placeholder="100"
                      value={formData.amount}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const val = e.target.value
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          updateField('amount', val)
                        }
                      }}
                      className="bg-wb-sand text-wb-brown placeholder:text-wb-taupe pr-10"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Image
                        src="/img/usdc.png"
                        alt="USDC"
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="-mt-1 text-right">
                <UsdcBalance />
              </div>

              {/* Judge */}
              <AddressInput
                label="Who will judge"
                value={formData.judge}
                required
                onChange={(value, resolvedAddress) => {
                  updateField('judge', value)
                  updateField('judgeAddress', resolvedAddress)
                }}
                labelClassName="text-wb-brown text-sm"
                inputClassName="bg-wb-sand text-wb-brown placeholder:text-wb-taupe"
              />

              {/* Submit */}
              <Button
                className="bg-wb-coral hover:bg-wb-coral/90 w-full text-white"
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {phase === 'approving'
                  ? 'Approving USDC...'
                  : phase === 'creating'
                    ? 'Creating Bet...'
                    : !isConnected
                      ? 'Connect Wallet'
                      : 'Create Bet'}
              </Button>

              <p className="text-wb-taupe text-center text-xs">
                Bet offers expire 7 days after creation
              </p>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
