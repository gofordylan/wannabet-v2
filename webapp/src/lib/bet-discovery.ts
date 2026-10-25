// Keep successful discovery work for the lifetime of a server instance. The
// build-time seed remains the durable baseline across cold starts. Always scan
// the newest missing range first so an old seed cannot starve recent bets.
export function createBetDiscovery<T extends { address: string }>(
  seed: { scannedToBlock: number; bets: T[] },
  scan: (from: bigint, to: bigint) => Promise<T[]>,
  options: {
    budgetMs?: number
    chunkSize?: bigint
    minChunkSize?: bigint
    now?: () => number
    onError?: (error: unknown) => void
  } = {}
) {
  const known = new Map(
    seed.bets.map((bet) => [bet.address.toLowerCase(), bet])
  )
  const missing: { from: bigint; to: bigint }[] = []
  let observedHead = BigInt(seed.scannedToBlock)
  let chunkSize = options.chunkSize ?? 10_000n
  const minChunkSize = options.minChunkSize ?? 1_000n
  const now = options.now ?? Date.now
  let inFlight: Promise<T[]> | undefined

  async function discover(latestBlock: bigint): Promise<T[]> {
    if (latestBlock > observedHead) {
      missing.push({ from: observedHead + 1n, to: latestBlock })
      observedHead = latestBlock
    }
    const deadline = now() + (options.budgetMs ?? 15_000)
    while (missing.length && now() < deadline) {
      const range = missing[missing.length - 1]
      const from =
        range.to - chunkSize + 1n > range.from
          ? range.to - chunkSize + 1n
          : range.from
      try {
        // Commit progress only after both log retrieval and metadata succeed.
        const bets = await scan(from, range.to)
        for (const bet of bets) known.set(bet.address.toLowerCase(), bet)
        range.to = from - 1n
        if (range.to < range.from) missing.pop()
      } catch (error) {
        if (chunkSize > minChunkSize) {
          chunkSize =
            chunkSize / 2n < minChunkSize ? minChunkSize : chunkSize / 2n
        } else {
          options.onError?.(error)
          break // Retain this range and all successful work for the next call.
        }
      }
    }
    return [...known.values()]
  }

  return (latestBlock: bigint): Promise<T[]> => {
    // Concurrent cache misses must not race on the discovery checkpoint.
    if (!inFlight) {
      inFlight = discover(latestBlock).finally(() => {
        inFlight = undefined
      })
    }
    return inFlight
  }
}
