'use client'

import Image from 'next/image'
import { useState } from 'react'
import { type Bet, BetStatus } from 'shared'

import { BetDetailDialog } from '@/components/bet-detail-dialog'
import { StatusPennant } from '@/components/status-pennant'
import { UserAvatar } from '@/components/user-avatar'
import { getDisplayName } from '@/lib/utils'

interface BetsTableProps {
  bets: Bet[]
}

export function BetsTable({ bets }: BetsTableProps) {
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null)

  return (
    <>
      <div className="flex flex-col gap-2.5 sm:gap-3">
        {bets.map((bet, index) => (
          <div
            key={bet.address}
            className="animate-card-mount shadow-clay cursor-pointer rounded-2xl border-0 bg-white p-3.5 transition-all hover:-translate-y-[3px] sm:rounded-3xl sm:p-6"
            style={{ animationDelay: `${50 + index * 50}ms` }}
            onClick={() => setSelectedBet(bet)}
          >
            {/* Header row: Avatars + names + status badge */}
            <div className="mb-2.5 flex items-start justify-between sm:mb-3.5">
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div
                    className={`relative rounded-full ring-2 ${
                      bet.status === BetStatus.RESOLVED &&
                      bet.winner?.address?.toLowerCase() ===
                        bet.maker.address?.toLowerCase()
                        ? 'ring-wb-gold'
                        : 'ring-wb-taupe/30'
                    } ${
                      bet.status === BetStatus.RESOLVED &&
                      bet.winner &&
                      bet.winner.address?.toLowerCase() !==
                        bet.maker.address?.toLowerCase()
                        ? 'grayscale'
                        : ''
                    }`}
                  >
                    <UserAvatar user={bet.maker} size="sm" />
                  </div>
                  <span
                    className={`text-wb-brown text-xs font-bold sm:text-sm ${
                      bet.status === BetStatus.RESOLVED &&
                      bet.winner?.address?.toLowerCase() ===
                        bet.maker.address?.toLowerCase()
                        ? 'decoration-wb-gold underline decoration-2 underline-offset-2'
                        : ''
                    }`}
                  >
                    {getDisplayName(bet.maker)}
                  </span>
                </div>
                <span
                  className="text-[11px] font-bold sm:text-[13px]"
                  style={{ color: '#d4c5a9' }}
                >
                  vs
                </span>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div
                    className={`relative rounded-full ring-2 ${
                      bet.status === BetStatus.RESOLVED &&
                      bet.winner?.address?.toLowerCase() ===
                        bet.taker.address?.toLowerCase()
                        ? 'ring-wb-gold'
                        : 'ring-wb-taupe/30'
                    } ${
                      bet.status === BetStatus.RESOLVED &&
                      bet.winner &&
                      bet.winner.address?.toLowerCase() !==
                        bet.taker.address?.toLowerCase()
                        ? 'grayscale'
                        : ''
                    }`}
                  >
                    <UserAvatar user={bet.taker} size="sm" />
                  </div>
                  <span
                    className={`text-wb-brown text-xs font-bold sm:text-sm ${
                      bet.status === BetStatus.RESOLVED &&
                      bet.winner?.address?.toLowerCase() ===
                        bet.taker.address?.toLowerCase()
                        ? 'decoration-wb-gold underline decoration-2 underline-offset-2'
                        : ''
                    }`}
                  >
                    {getDisplayName(bet.taker)}
                  </span>
                </div>
              </div>
              <StatusPennant status={bet.status} size="sm" />
            </div>

            {/* Description */}
            <p
              className="text-wb-brown line-clamp-2 text-[14px] font-bold leading-snug sm:text-[17px]"
              style={{ letterSpacing: '-0.01em' }}
            >
              {bet.description}
            </p>

            {/* Amount and date */}
            <div className="mt-2 flex items-center justify-between sm:mt-3">
              <div className="flex items-center gap-1">
                <span className="text-wb-coral text-[16px] font-bold sm:text-[20px]">
                  {bet.amount}
                </span>
                <Image
                  src="/img/usdc.png"
                  alt="USDC"
                  width={16}
                  height={16}
                  className="rounded-full sm:h-[18px] sm:w-[18px]"
                />
              </div>
              <span className="text-wb-taupe text-[10px] font-semibold sm:text-xs">
                Ends{' '}
                {new Intl.DateTimeFormat('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }).format(bet.expiresAt)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {selectedBet && (
        <BetDetailDialog
          bet={selectedBet}
          open={!!selectedBet}
          onOpenChange={(open) => !open && setSelectedBet(null)}
        />
      )}
    </>
  )
}
