'use client'

import { Activity, ArrowLeft, Coins, Loader2, TrendingUp, Trophy } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMemo } from 'react'

import { BetsTable } from '@/components/bets-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserAvatar } from '@/components/user-avatar'
import { useBets } from '@/hooks/useBets'
import { BetStatus, type Bet, type User } from 'indexer/types'
import { getUsername, shortenAddress } from '@/lib/utils'

interface UserStats {
  totalBets: number
  activeBets: number
  wonBets: number
  lostBets: number
  totalWagered: string
  totalWon: string
  winRate: number
}

function getUserStats(address: string, userBets: Bet[]): UserStats {
  const lowerAddress = address.toLowerCase()
  const totalBets = userBets.length
  const activeBets = userBets.filter((b) => b.status === BetStatus.ACTIVE).length

  const wonBets = userBets.filter(
    (b) =>
      b.status === BetStatus.RESOLVED &&
      b.winner &&
      // Check if winner address matches
      (b.maker.address.toLowerCase() === lowerAddress
        ? b.winner.address === b.maker.address
        : b.winner.address === b.taker.address)
  ).length

  const lostBets = userBets.filter(
    (b) =>
      b.status === BetStatus.RESOLVED &&
      b.winner &&
      (b.maker.address.toLowerCase() === lowerAddress
        ? b.winner.address !== b.maker.address
        : b.winner.address !== b.taker.address)
  ).length

  const totalWagered = userBets
    .reduce((sum, bet) => sum + parseFloat(bet.amount), 0)
    .toFixed(2)

  const totalWon = (wonBets * 2 * parseFloat(userBets[0]?.amount || '0')).toFixed(2)

  const winRate =
    wonBets + lostBets > 0
      ? Math.round((wonBets / (wonBets + lostBets)) * 100)
      : 0

  return {
    totalBets,
    activeBets,
    wonBets,
    lostBets,
    totalWagered,
    totalWon,
    winRate,
  }
}

export default function ProfilePage() {
  const params = useParams()
  const address = params.address as string

  const betsQuery = useBets()

  // Filter bets where the address is maker, taker, or judge
  const userBets = useMemo(() => {
    if (!betsQuery.data) return []
    const lower = address.toLowerCase()
    return betsQuery.data.filter(
      (bet) =>
        bet.maker.address.toLowerCase() === lower ||
        bet.taker.address.toLowerCase() === lower ||
        bet.judge.address.toLowerCase() === lower
    )
  }, [betsQuery.data, address])

  // Create a user object from the address
  const user: User | null = useMemo(() => {
    if (userBets.length === 0) return null
    const lower = address.toLowerCase()
    const bet = userBets[0]
    if (bet.maker.address.toLowerCase() === lower) return bet.maker
    if (bet.taker.address.toLowerCase() === lower) return bet.taker
    if (bet.judge.address.toLowerCase() === lower) return bet.judge
    return null
  }, [userBets, address])

  const stats = useMemo(() => {
    if (!user) return null
    return getUserStats(address, userBets)
  }, [address, userBets, user])

  if (betsQuery.isLoading) {
    return (
      <div className="min-h-screen pb-20 sm:pb-4" style={{ background: '#faf5ef' }}>
        <main className="container mx-auto px-3 sm:px-4 py-6 md:py-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Feed
            </Button>
          </Link>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-wb-coral" />
          </div>
        </main>
      </div>
    )
  }

  if (betsQuery.error || !user || !stats) {
    return (
      <div className="min-h-screen pb-20 sm:pb-4" style={{ background: '#faf5ef' }}>
        <main className="container mx-auto px-3 sm:px-4 py-6 md:py-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Feed
            </Button>
          </Link>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-wb-brown">User Not Found</h1>
            <p className="text-wb-taupe mt-2">
              {betsQuery.error
                ? 'Error loading profile. Please try again.'
                : 'This user has no betting history yet.'}
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 sm:pb-4" style={{ background: '#faf5ef' }}>
      <main className="container mx-auto px-3 sm:px-4 py-6 md:py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Feed
            </Button>
          </Link>

          <div className="flex items-start gap-4">
            <UserAvatar user={user} size="lg" clickable={false} />
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{getUsername(user)}</h1>
              <p className="text-muted-foreground font-mono">
                {shortenAddress(user.address)}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                <Activity className="h-4 w-4" />
                Total Bets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalBets}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4" />
                Win Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.winRate}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                <Coins className="h-4 w-4" />
                Wagered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalWagered}</p>
              <p className="text-muted-foreground text-xs">USDC</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                <Trophy className="h-4 w-4" />
                Won
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalWon}</p>
              <p className="text-muted-foreground text-xs">USDC</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-bold">Bet History</h2>
          {userBets.length > 0 ? (
            <BetsTable bets={userBets} />
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No bets yet</p>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
