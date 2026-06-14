'use client'

import { format } from 'date-fns'
import { ArrowUpRight, Loader2, Share2 } from 'lucide-react'
import Image from 'next/image'
import { useState, useCallback, useEffect } from 'react'
import { useAccount } from 'wagmi'
import type { Address } from 'viem'

import { StatusPennant } from '@/components/status-pennant'
import { UsdcBalance } from '@/components/usdc-balance'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { UserAvatar } from '@/components/user-avatar'
import { useAcceptBet } from '@/hooks/useAcceptBet'
import { useResolveBet } from '@/hooks/useResolveBet'
import { useCancelBet } from '@/hooks/useCancelBet'
import { BetStatus, type Bet } from 'indexer/types'
import { getUsername } from '@/lib/utils'

// Base scan URL for transaction links
const BASE_SCAN_URL = 'https://basescan.org/address'

// Helper to get ring color based on bet status
const getStatusRingColor = (status: BetStatus) => {
  const colors: Record<BetStatus, string> = {
    [BetStatus.PENDING]: 'ring-wb-status-pending',
    [BetStatus.ACTIVE]: 'ring-wb-status-active',
    [BetStatus.JUDGING]: 'ring-wb-status-judging',
    [BetStatus.RESOLVED]: 'ring-wb-status-resolved',
    [BetStatus.CANCELLED]: 'ring-wb-status-cancelled',
  }
  return colors[status]
}

// Helper to get center badge background color based on bet status
const getStatusBgColor = (status: BetStatus) => {
  const colors: Record<BetStatus, string> = {
    [BetStatus.PENDING]: 'bg-wb-status-pending',
    [BetStatus.ACTIVE]: 'bg-wb-status-active',
    [BetStatus.JUDGING]: 'bg-wb-status-judging',
    [BetStatus.RESOLVED]: 'bg-wb-status-resolved',
    [BetStatus.CANCELLED]: 'bg-wb-status-cancelled',
  }
  return colors[status]
}

// Timeline event component
interface TimelineEventProps {
  icon: '⏳' | '🤝' | '⚖️' | '❌' | '💸'
  title: string
  description: string
  link?: string
}

function TimelineEvent({ icon, title, description, link }: TimelineEventProps) {
  return (
    <div className="bg-white flex items-start gap-3 rounded-xl border px-4 py-3">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <p className="text-wb-brown font-semibold">{title}</p>
        <p className="text-wb-taupe text-sm">
          {description}
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-wb-coral ml-1 inline-flex items-center hover:underline"
            >
              <ArrowUpRight className="h-3 w-3" />
            </a>
          )}
        </p>
      </div>
    </div>
  )
}

// Bet History component
interface BetHistoryProps {
  bet: Bet
  onClose: () => void
}

function BetHistory({ bet, onClose }: BetHistoryProps) {
  const contractLink = `${BASE_SCAN_URL}/${bet.address}`

  return (
    <div className="bg-background absolute inset-0 z-30 space-y-3 overflow-y-auto rounded-t-[10px] p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-wb-brown text-lg font-bold">Bet History</h3>
      </div>

      {/* Timeline Events */}
      <div className="space-y-2">
        {/* Bet Proposed - Always shown */}
        <TimelineEvent
          icon="⏳"
          title="Bet Proposed"
          description={`@${getUsername(bet.maker)} proposed this bet on ${format(bet.createdAt, 'MMM d, yyyy')}`}
          link={contractLink}
        />

        {/* Bet Accepted - Show if accepted */}
        {bet.acceptedAt && bet.acceptedBy && (
          <TimelineEvent
            icon="🤝"
            title="Bet Accepted"
            description={`@${getUsername(bet.acceptedBy)} accepted the bet on ${format(bet.acceptedAt, 'MMM d, yyyy')}`}
            link={contractLink}
          />
        )}

        {/* Bet Expired - Show if cancelled and never accepted */}
        {bet.status === BetStatus.CANCELLED && !bet.acceptedAt && (
          <TimelineEvent
            icon="❌"
            title="Bet Expired"
            description={`No one accepted the bet within 7 days. Bet expired on ${format(bet.acceptBy, 'MMM d, yyyy')}`}
          />
        )}

        {/* Winner Determined - Show if resolved */}
        {bet.status === BetStatus.RESOLVED && bet.winner && (
          <TimelineEvent
            icon="⚖️"
            title="Winner Determined"
            description={`@${getUsername(bet.judge)} determined @${getUsername(bet.winner)} was the winner`}
            link={contractLink}
          />
        )}

        {/* Funds Returned - Show if cancelled */}
        {bet.status === BetStatus.CANCELLED && (
          <TimelineEvent
            icon="💸"
            title="Funds Returned"
            description={`Funds returned to @${getUsername(bet.maker)}`}
            link={contractLink}
          />
        )}
      </div>

      {/* Hide Details Link */}
      <button
        type="button"
        className="text-wb-coral mx-auto block text-sm font-medium hover:underline"
        onClick={onClose}
      >
        Hide Details
      </button>
    </div>
  )
}

interface ActionCardProps {
  bet: Bet
  connectedAddress?: Address
  onAcceptBet: () => void
  onResolveBet: (winner: 'maker' | 'taker') => void
  onCancelBet: () => void
  isAccepting?: boolean
  isResolving?: boolean
  isCancelling?: boolean
}

function ActionCard({
  bet,
  connectedAddress,
  onAcceptBet,
  onResolveBet,
  onCancelBet,
  isAccepting,
  isResolving,
  isCancelling,
}: ActionCardProps) {
  const isPending = isAccepting || isResolving || isCancelling

  // Determine the connected user's role by wallet address
  const normalizedConnected = connectedAddress?.toLowerCase()
  const isTaker = normalizedConnected === bet.taker?.address?.toLowerCase()
  const isMaker = normalizedConnected === bet.maker?.address?.toLowerCase()
  const isJudge = normalizedConnected === bet.judge?.address?.toLowerCase()

  // State 3: Resolved - Winner display
  if (bet.status === BetStatus.RESOLVED && bet.winner) {
    return (
      <div className="bg-white rounded-xl border px-4 py-3">
        <div className="flex items-center justify-center gap-3">
          <span className="text-wb-brown text-sm">
            <span className="font-bold underline decoration-wb-gold decoration-2 underline-offset-2">@{getUsername(bet.winner)}</span> won the bet!
          </span>
        </div>
      </div>
    )
  }

  // State 4: Cancelled
  if (bet.status === BetStatus.CANCELLED) {
    return (
      <div className="bg-white rounded-xl border px-4 py-3">
        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl">❌</span>
          <span className="text-wb-brown text-center text-sm">
            @{getUsername(bet.maker)} canceled the bet and funds were returned
          </span>
        </div>
      </div>
    )
  }

  // State 2: Judge Selection (active or judging)
  if (
    (bet.status === BetStatus.ACTIVE || bet.status === BetStatus.JUDGING) &&
    bet.acceptedBy
  ) {
    // Only judge can resolve or cancel in ACTIVE/JUDGING state
    if (!isJudge) {
      return (
        <div className="bg-white rounded-xl border px-4 py-3">
          <p className="text-wb-taupe text-center text-sm">
            Waiting for @{getUsername(bet.judge)} to pick a winner
          </p>
        </div>
      )
    }

    return (
      <div className="bg-white space-y-3 rounded-xl border px-4 py-3">
        <p className="text-wb-taupe text-center text-xs">
          Pick a winner as the judge
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => onResolveBet('maker')}
            className="bg-wb-coral hover:bg-wb-coral/80 flex-1 text-white"
            disabled={isPending}
          >
            {isResolving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `@${getUsername(bet.maker)}`
            )}
          </Button>
          <Button
            onClick={() => onResolveBet('taker')}
            className="bg-wb-coral hover:bg-wb-coral/80 flex-1 text-white"
            disabled={isPending}
          >
            {isResolving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `@${getUsername(bet.acceptedBy)}`
            )}
          </Button>
        </div>
        <Button
          onClick={onCancelBet}
          variant="outline"
          className="w-full"
          size="sm"
          disabled={isPending}
        >
          {isCancelling ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {isCancelling ? 'Cancelling...' : 'Cancel (Split Funds)'}
        </Button>
        <p className="text-wb-taupe text-center text-xs">
          Picking a winner will send them {Number(bet.amount) * 2} USDC
        </p>
      </div>
    )
  }

  // State 1: Pending - Taker can accept, Maker can cancel
  if (bet.status === BetStatus.PENDING) {
    return (
      <div className="bg-white space-y-3 rounded-xl border px-4 py-3">
        {isTaker ? (
          <>
            <Button
              onClick={onAcceptBet}
              className="bg-wb-coral hover:bg-wb-coral/80 w-full text-white"
              size="lg"
              disabled={isPending}
            >
              {isAccepting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isAccepting ? 'Accepting...' : 'Accept Bet'}
            </Button>
            <p className="text-wb-taupe text-center text-xs">
              Accepting will send {bet.amount} USDC to the bet contract. Offer
              ends {format(bet.acceptBy, 'MMM d, yyyy')}.
            </p>
          </>
        ) : isMaker ? (
          <>
            <p className="text-wb-taupe text-center text-sm">
              Waiting for @{getUsername(bet.taker)} to accept
            </p>
            <Button
              onClick={onCancelBet}
              variant="outline"
              className="w-full"
              size="sm"
              disabled={isPending}
            >
              {isCancelling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isCancelling ? 'Cancelling...' : 'Cancel Bet'}
            </Button>
          </>
        ) : (
          <p className="text-wb-taupe text-center text-sm">
            Waiting for @{getUsername(bet.taker)} to accept. Offer ends{' '}
            {format(bet.acceptBy, 'MMM d, yyyy')}.
          </p>
        )}
      </div>
    )
  }

  // No action available
  return null
}

interface BetDetailDialogProps {
  bet: Bet
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BetDetailDialog({
  bet,
  open,
  onOpenChange,
}: BetDetailDialogProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle')
  const [showAcceptSuccess, setShowAcceptSuccess] = useState(false)
  const [showCancelSuccess, setShowCancelSuccess] = useState(false)
  const [showResolveSuccess, setShowResolveSuccess] = useState<{
    show: boolean
    winnerName: string | null
  }>({ show: false, winnerName: null })
  const { address } = useAccount()

  // Share bet functionality (native share sheet, falling back to clipboard)
  const handleShare = useCallback(async (context?: 'accept' | 'resolve') => {
    const betUrl = `${window.location.origin}/bet/${bet.address}`
    let text: string
    if (context === 'accept') {
      text = `I just accepted a bet on WannaBet: "${bet.description}" — ${bet.amount} USDC each.`
    } else if (context === 'resolve') {
      const winnerName = showResolveSuccess.winnerName || 'someone'
      text = `A bet was resolved on WannaBet: "${bet.description}" — winner ${winnerName} takes ${Number(bet.amount) * 2} USDC.`
    } else {
      text = `Check out this bet on WannaBet: "${bet.description}" — ${bet.amount} USDC each.`
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'WannaBet', text, url: betUrl })
        return
      } catch {
        // user cancelled or share unsupported - fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(betUrl)
      setShareStatus('copied')
      setTimeout(() => setShareStatus('idle'), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [bet, showResolveSuccess.winnerName])

  // Contract interaction hooks
  const {
    submit: submitAccept,
    isPending: isAccepting,
    phase: acceptPhase,
  } = useAcceptBet(bet.address as Address, bet.amount)

  const {
    submit: submitResolve,
    isPending: isResolving,
  } = useResolveBet(bet.address as Address)

  const {
    submit: submitCancel,
    isPending: isCancelling,
  } = useCancelBet(bet.address as Address)

  // Handle accept bet - just trigger the submit, useEffect handles success
  const handleAcceptBet = async () => {
    await submitAccept()
  }

  // Watch for successful accept and show success state
  useEffect(() => {
    if (acceptPhase === 'success') {
      setShowAcceptSuccess(true)
    }
  }, [acceptPhase])

  const handleResolveBet = async (winner: 'maker' | 'taker') => {
    const winnerAddress =
      winner === 'maker'
        ? (bet.maker.address as Address)
        : (bet.acceptedBy?.address as Address)
    const winnerUser = winner === 'maker' ? bet.maker : bet.acceptedBy
    if (winnerAddress) {
      await submitResolve(winnerAddress)
      // Show success state
      setShowResolveSuccess({
        show: true,
        winnerName: getUsername(winnerUser),
      })
    }
  }

  const handleCancelBet = async () => {
    const success = await submitCancel()
    // Show success state
    if (success) {
      setShowCancelSuccess(true)
    }
  }

  const handleReset = () => {
    setShowDetails(false)
    setShowAcceptSuccess(false)
    setShowCancelSuccess(false)
    setShowResolveSuccess({ show: false, winnerName: null })
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen)
        if (!isOpen) handleReset()
      }}
    >
      <DrawerContent className="relative fixed bottom-0 left-0 right-0 mx-auto flex max-h-[90dvh] max-w-3xl flex-col pb-[env(safe-area-inset-bottom)]">
        {/* Accept Success Overlay */}
        {showAcceptSuccess && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-t-[10px] bg-background/95 px-6 py-12">
            <div className="text-4xl mb-4">🤝</div>
            <p className="text-wb-brown text-lg font-semibold mb-2">
              Bet Accepted!
            </p>
            <p className="text-wb-taupe text-sm text-center mb-6">
              You&apos;re now in a bet with @{getUsername(bet.maker)} for {bet.amount} USDC each.
              Good luck!
            </p>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <Button
                className="bg-wb-coral hover:bg-wb-coral/90 w-full text-white"
                size="lg"
                onClick={() => handleShare('accept')}
              >
                <Share2 className="mr-2 h-4 w-4" />
                {shareStatus === 'copied' ? 'Copied!' : 'Share Bet'}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                size="lg"
                onClick={() => {
                  onOpenChange(false)
                  handleReset()
                }}
              >
                Done
              </Button>
            </div>
          </div>
        )}

        {/* Cancel Success Overlay */}
        {showCancelSuccess && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-t-[10px] bg-background/95 px-6 py-12">
            <div className="text-4xl mb-4">✅</div>
            <p className="text-wb-brown text-lg font-semibold mb-2">
              Bet Cancelled
            </p>
            <p className="text-wb-taupe text-sm text-center mb-6">
              The bet has been cancelled and funds have been returned.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <Button
                className="bg-wb-coral hover:bg-wb-coral/90 w-full text-white"
                size="lg"
                onClick={() => {
                  onOpenChange(false)
                  handleReset()
                }}
              >
                Done
              </Button>
            </div>
          </div>
        )}

        {/* Resolve Success Overlay */}
        {showResolveSuccess.show && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-t-[10px] bg-background/95 px-6 py-12">
            <p className="text-wb-brown text-lg font-semibold mb-2">
              Winner Selected!
            </p>
            <p className="text-wb-taupe text-sm text-center mb-6">
              @{showResolveSuccess.winnerName} has been declared the winner and will receive {Number(bet.amount) * 2} USDC.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <Button
                className="bg-wb-coral hover:bg-wb-coral/90 w-full text-white"
                size="lg"
                onClick={() => handleShare('resolve')}
              >
                <Share2 className="mr-2 h-4 w-4" />
                {shareStatus === 'copied' ? 'Copied!' : 'Share Result'}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                size="lg"
                onClick={() => {
                  onOpenChange(false)
                  handleReset()
                }}
              >
                Done
              </Button>
            </div>
          </div>
        )}

        <DrawerHeader className="relative pb-2">
          <DrawerTitle className="sr-only">Bet Details</DrawerTitle>
          {/* Share button - Top left */}
          <button
            type="button"
            onClick={() => handleShare()}
            className="absolute left-4 top-4 flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-sm text-wb-taupe transition-colors hover:bg-wb-sand hover:text-wb-brown"
          >
            <Share2 className="h-4 w-4" />
            {shareStatus === 'copied' ? 'Copied!' : 'Share'}
          </button>
          {/* Status Pennant - Top right */}
          <div className="absolute right-4 top-0">
            <StatusPennant status={bet.status} />
          </div>

          {/* Large Overlapping Avatars */}
          <div className="flex items-center justify-center gap-2 pt-4">
            {/* Maker avatar - positioned left */}
            <div
              className={`rounded-full ring-4 ${getStatusRingColor(bet.status)} z-10 ${
                bet.status === BetStatus.RESOLVED &&
                bet.winner &&
                bet.winner.address?.toLowerCase() !== bet.maker.address?.toLowerCase()
                  ? 'grayscale'
                  : ''
              }`}
            >
              <UserAvatar user={bet.maker} size="2xl" clickable={false} />
            </div>

            {/* Center badge - overlapping both */}
            <div
              className={`absolute z-20 flex h-16 w-16 flex-col items-center justify-center rounded-full ${getStatusBgColor(bet.status)} shadow-md`}
            >
              <div className="flex items-center gap-0.5">
                <Image
                  src="/img/usdc.png"
                  alt="USDC"
                  width={16}
                  height={16}
                  className="rounded-full"
                />
                <span className="font-bold">{bet.amount}</span>
              </div>
              <span className="text-[10px] opacity-70">each</span>
            </div>

            {/* Taker avatar - positioned right */}
            <div
              className={`rounded-full ring-4 ${getStatusRingColor(bet.status)} ${
                bet.status === BetStatus.RESOLVED &&
                bet.winner &&
                bet.winner.address?.toLowerCase() !== (bet.acceptedBy || bet.taker)?.address?.toLowerCase()
                  ? 'grayscale'
                  : ''
              }`}
            >
              <UserAvatar
                user={bet.acceptedBy || bet.taker}
                size="2xl"
                clickable={false}
              />
            </div>
          </div>

          {/* Usernames below avatars */}
          <div className="mt-2 flex justify-center gap-24">
            <span className="text-wb-brown text-sm font-medium">
              @{getUsername(bet.maker)}
            </span>
            <span className="text-wb-brown text-sm font-medium">
              @{getUsername(bet.acceptedBy || bet.taker)}
            </span>
          </div>
        </DrawerHeader>

        <div className="min-h-0 space-y-4 overflow-y-auto px-4 pb-6">
          {/* Bet Description */}
          <div className="text-center">
            <p className="text-wb-taupe text-sm">
              @{getUsername(bet.maker)} bet that...
            </p>
            <h2 className="text-wb-brown mt-1 text-2xl font-bold leading-tight">
              {bet.description}
            </h2>
            <p className="text-wb-taupe mt-2 text-sm">
              Ends: {format(bet.expiresAt, 'MMM d, yyyy')} | Judge: @
              {getUsername(bet.judge)}
            </p>
          </div>

          {/* Action Card - Context Dependent */}
          <ActionCard
            bet={bet}
            connectedAddress={address}
            onAcceptBet={handleAcceptBet}
            onResolveBet={handleResolveBet}
            onCancelBet={handleCancelBet}
            isAccepting={isAccepting}
            isResolving={isResolving}
            isCancelling={isCancelling}
          />

          {/* USDC Balance - Show for takers of pending bets */}
          {bet.status === BetStatus.PENDING &&
            address?.toLowerCase() === bet.taker.address?.toLowerCase() && (
              <div className="-mt-2 text-center">
                <UsdcBalance />
              </div>
            )}

          {/* Show More Details Link */}
          {!showDetails && (
            <button
              type="button"
              className="text-wb-coral mx-auto block text-sm font-medium hover:underline"
              onClick={() => setShowDetails(true)}
            >
              Show More Details
            </button>
          )}
        </div>

        {/* Bet History Overlay */}
        {showDetails && (
          <BetHistory bet={bet} onClose={() => setShowDetails(false)} />
        )}
      </DrawerContent>
    </Drawer>
  )
}
