'use client'

import {
  ArrowDownUp,
  Bell,
  Globe,
  HelpCircle,
  Loader2,
  User,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { type Bet, BetStatus } from 'shared'
import { useAccount } from 'wagmi'

import { BetsTable } from '@/components/bets-table'
import { ConnectWalletButton } from '@/components/connect-wallet-button'
import { WelcomeModal } from '@/components/welcome-modal'
import { useBets } from '@/hooks/useBets'

type FilterType = 'all' | 'my' | 'notifications'

// Helper to check if a bet requires action from the user
function betRequiresAction(bet: Bet, userAddress: string): boolean {
  const addr = userAddress.toLowerCase()
  const needsAccept =
    bet.taker.address?.toLowerCase() === addr &&
    bet.status === BetStatus.PENDING
  const needsJudgment =
    bet.judge.address?.toLowerCase() === addr &&
    bet.status === BetStatus.JUDGING
  return needsAccept || needsJudgment
}

type StatusFilter = BetStatus

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: BetStatus.PENDING, label: 'Pending' },
  { value: BetStatus.ACTIVE, label: 'Live' },
  { value: BetStatus.JUDGING, label: 'Judging' },
  { value: BetStatus.RESOLVED, label: 'Settled' },
  { value: BetStatus.CANCELLED, label: 'Cancelled' },
]

const DEFAULT_STATUSES = new Set<StatusFilter>([
  BetStatus.PENDING,
  BetStatus.ACTIVE,
  BetStatus.JUDGING,
  BetStatus.RESOLVED,
])

const WELCOME_DISMISSED_KEY = 'welcomeDismissed'

const getEmptyStateMessage = (
  filter: FilterType,
  hasAddress: boolean,
  activeStatuses: Set<StatusFilter>
): string => {
  if (filter === 'my') {
    if (!hasAddress) return 'Connect your wallet to see your bets'
    return 'No bets where you are a participant'
  }
  if (filter === 'notifications') return 'No pending actions'
  if (activeStatuses.size === 0) return 'Select a status filter to see bets'
  return 'No bets found. Create one to get started!'
}

type SortOption = 'created' | 'ends' | 'value'

export default function HomePage() {
  const [showWelcome, setShowWelcome] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [activeStatuses, setActiveStatuses] =
    useState<Set<StatusFilter>>(DEFAULT_STATUSES)
  const [sortBy, setSortBy] = useState<SortOption>('created')
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(10)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const { address } = useAccount()

  const PAGE_SIZE = 10

  // Close sort dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node))
        setSortOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Load initial state from localStorage after client mounts
  useEffect(() => {
    const dismissed = localStorage.getItem(WELCOME_DISMISSED_KEY) === 'true'
    setShowWelcome(!dismissed)
  }, [])

  // Fetch bets data
  const betsQuery = useBets()

  // Bets requiring action (for notifications tab and badge)
  const betsRequiringAction = useMemo(() => {
    if (!betsQuery.data || !address) return []
    return betsQuery.data.filter((bet) => betRequiresAction(bet, address))
  }, [betsQuery.data, address])

  // Toggle a status filter on/off
  const toggleStatus = useCallback((status: StatusFilter) => {
    setActiveStatuses((prev) => {
      const next = new Set(prev)
      if (next.has(status)) {
        next.delete(status)
      } else {
        next.add(status)
      }
      return next
    })
  }, [])

  // Filter and sort bets
  const filteredBets = useMemo(() => {
    if (!betsQuery.data) return []

    // Tab filter
    let bets = betsQuery.data
    if (activeFilter === 'notifications') {
      bets = betsRequiringAction
    } else if (activeFilter === 'my') {
      if (!address) return []
      bets = bets.filter(
        (bet) =>
          bet.maker.address?.toLowerCase() === address.toLowerCase() ||
          bet.taker.address?.toLowerCase() === address.toLowerCase() ||
          bet.judge.address?.toLowerCase() === address.toLowerCase()
      )
    }

    // Status filter (multi-select)
    bets = bets.filter((bet) => activeStatuses.has(bet.status))

    // Sort
    bets = [...bets].sort((a, b) => {
      if (sortBy === 'ends') {
        return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
      }
      if (sortBy === 'value') {
        return parseFloat(b.amount) - parseFloat(a.amount)
      }
      // 'created' - newest first (default from API)
      return 0
    })

    return bets
  }, [
    betsQuery.data,
    activeFilter,
    address,
    activeStatuses,
    betsRequiringAction,
    sortBy,
  ])

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [activeFilter, activeStatuses, sortBy])

  const visibleBets = filteredBets.slice(0, visibleCount)
  const hasMore = visibleCount < filteredBets.length

  // Only enable infinite scroll after the user has scrolled
  const hasScrolled = useRef(false)
  useEffect(() => {
    const onScroll = () => {
      hasScrolled.current = true
    }
    window.addEventListener('scroll', onScroll, { once: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Reset scroll flag when filters change
  useEffect(() => {
    hasScrolled.current = false
    const onScroll = () => {
      hasScrolled.current = true
    }
    window.addEventListener('scroll', onScroll, { once: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [activeFilter, activeStatuses, sortBy])

  // Infinite scroll observer
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasScrolled.current) {
          setVisibleCount((prev) => prev + PAGE_SIZE)
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore])

  const handleCloseWelcome = (open: boolean) => {
    setShowWelcome(open)
    if (!open) {
      localStorage.setItem(WELCOME_DISMISSED_KEY, 'true')
    }
  }

  const navItems = [
    {
      key: 'notifications' as FilterType,
      icon: Bell,
      label: 'Alerts',
      badge:
        betsRequiringAction.length > 0 ? betsRequiringAction.length : undefined,
    },
    { key: 'my' as FilterType, icon: User, label: 'My Bets' },
    { key: 'all' as FilterType, icon: Globe, label: 'All Bets' },
  ]

  return (
    <div
      className="relative min-h-screen pb-20 sm:pb-4"
      style={{ background: '#faf5ef' }}
    >
      {/* Subtle radial gradient overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 20% 10%, rgba(196,101,74,0.05) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 90%, rgba(90,122,94,0.04) 0%, transparent 50%)',
        }}
      />

      {/* Header */}
      <header className="relative z-10 mx-auto max-w-[680px] px-3 pt-3 sm:px-6 sm:pt-6">
        <div className="mb-3 flex items-center justify-between sm:mb-5">
          <div className="flex items-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/logo.png"
              alt="WannaBet"
              className="h-8 w-8 sm:h-10 sm:w-10"
            />
            <span
              className="text-[20px] font-bold sm:text-[24px]"
              style={{ letterSpacing: '-0.01em' }}
            >
              Wanna<span className="text-wb-coral">Bet</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Connect Wallet Button */}
            <div>
              <ConnectWalletButton />
            </div>

            {/* Help button */}
            <button
              onClick={() => setShowWelcome(true)}
              className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[12px] font-bold transition-all hover:-translate-y-0.5 sm:gap-1.5 sm:px-4 sm:py-2 sm:text-[13px]"
              style={{
                background: 'rgba(139,125,107,0.08)',
                color: '#8b7d6b',
              }}
              aria-label="How it works"
            >
              <HelpCircle size={14} className="sm:hidden" />
              <HelpCircle size={16} className="hidden sm:block" />
              <span className="hidden sm:inline">What is this?</span>
              <span className="sm:hidden">Info</span>
            </button>
          </div>
        </div>
      </header>

      {/* Segmented Control Navigation */}
      <section className="relative z-10 mx-auto max-w-[680px] px-3 sm:px-6">
        <div
          className="mb-3 flex rounded-xl p-0.5 sm:mb-4"
          style={{ background: 'rgba(139,125,107,0.08)' }}
        >
          {navItems.map((item) => {
            const isActive = activeFilter === item.key
            return (
              <button
                key={item.key}
                onClick={() => setActiveFilter(item.key)}
                className="flex flex-1 items-center justify-center gap-1 rounded-[10px] py-1.5 text-[11px] font-bold transition-all sm:gap-1.5 sm:py-2 sm:text-[12px]"
                style={{
                  background: isActive ? 'white' : 'transparent',
                  color: isActive ? '#2d2a26' : '#8b7d6b',
                  boxShadow: isActive
                    ? '0 1px 6px rgba(139,125,107,0.15)'
                    : 'none',
                }}
              >
                <item.icon size={14} />
                {item.label}
                {item.badge && (
                  <span
                    className="flex h-[16px] min-w-[16px] items-center justify-center rounded-full px-0.5 text-[9px] font-bold text-white"
                    style={{ background: '#c4654a' }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* Status Filters + Sort */}
      <section className="relative z-20 mx-auto max-w-[680px] px-3 sm:px-6">
        <div className="mb-3 flex items-center gap-2 sm:mb-5">
          <div className="no-scrollbar flex flex-1 gap-1.5 overflow-x-auto sm:flex-wrap">
            {STATUS_FILTERS.map((f) => {
              const active = activeStatuses.has(f.value)
              return (
                <button
                  key={f.value}
                  onClick={() => toggleStatus(f.value)}
                  className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all sm:px-3.5 sm:py-1.5 sm:text-xs"
                  style={{
                    background: active ? '#c4654a' : 'rgba(139,125,107,0.08)',
                    color: active ? 'white' : '#8b7d6b',
                  }}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
          <div className="relative shrink-0" ref={sortRef}>
            <button
              onClick={() => setSortOpen((v) => !v)}
              className="flex items-center justify-center rounded-full p-1.5 transition-all sm:p-2"
              style={{
                background:
                  sortBy !== 'created'
                    ? 'rgba(196,101,74,0.12)'
                    : 'rgba(139,125,107,0.08)',
                color: sortBy !== 'created' ? '#c4654a' : '#8b7d6b',
              }}
              aria-label="Sort"
            >
              <ArrowDownUp size={14} />
            </button>
            {sortOpen && (
              <div
                className="absolute right-0 top-full z-50 mt-1 overflow-hidden rounded-xl bg-white py-1"
                style={{
                  boxShadow: '0 4px 16px rgba(139,125,107,0.18)',
                  minWidth: 130,
                }}
              >
                {(
                  [
                    ['created', 'Most recent'],
                    ['value', 'Highest value'],
                    ['ends', 'Ending soon'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSortBy(key)
                      setSortOpen(false)
                    }}
                    className="flex w-full items-center px-3.5 py-2 text-left text-[12px] font-bold transition-colors"
                    style={{
                      color: sortBy === key ? '#c4654a' : '#2d2a26',
                      background:
                        sortBy === key
                          ? 'rgba(196,101,74,0.06)'
                          : 'transparent',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-[680px] px-3 sm:px-6">
        {betsQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-wb-taupe h-6 w-6 animate-spin" />
          </div>
        ) : betsQuery.error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-wb-taupe text-[15px] font-semibold">
              Error loading bets
            </div>
          </div>
        ) : filteredBets.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-wb-taupe text-[15px] font-semibold">
              {getEmptyStateMessage(activeFilter, !!address, activeStatuses)}
            </div>
          </div>
        ) : (
          <>
            <BetsTable bets={visibleBets} />
            {hasMore && (
              <div
                ref={sentinelRef}
                className="flex items-center justify-center py-4"
              >
                <Loader2 className="text-wb-taupe h-5 w-5 animate-spin" />
              </div>
            )}
          </>
        )}
      </main>

      <WelcomeModal open={showWelcome} onOpenChange={handleCloseWelcome} />
    </div>
  )
}
