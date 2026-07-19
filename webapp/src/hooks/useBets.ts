import { useQuery } from '@tanstack/react-query'
import type { Bet } from 'shared'

import { fetchBets } from '@/lib/bets'

export function useBets() {
  return useQuery<Bet[]>({
    queryKey: ['bets'],
    queryFn: fetchBets,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  })
}
