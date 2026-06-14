import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'

import { fetchUserByAddress } from '@/lib/indexer'

// Resolves an address to its ENS profile (name + avatar) via the indexer.
export function useProfile(address?: Address) {
  return useQuery({
    queryKey: ['profile', address],
    enabled: !!address,
    queryFn: () => fetchUserByAddress(address!),
  })
}
