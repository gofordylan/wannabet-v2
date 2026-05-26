/**
 * RPC Monitor — polls eth_blockNumber every 30 seconds via HTTP RPC.
 *
 * If the block number hasn't advanced for 5 minutes, the WebSocket connection
 * is likely stalled. We log an error and exit so the process auto-restarts.
 *
 * This intentionally monitors the RPC directly rather than event processing,
 * so a quiet period with no contract events does not trigger a false positive.
 */

const POLL_INTERVAL_MS = 30_000 // 30 seconds
const STALL_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes

const rpcUrl = process.env.BASE_RPC_URL

if (!rpcUrl) {
  console.warn('[rpc-monitor] BASE_RPC_URL is not set — monitor disabled')
} else {
  let lastBlockNumber: bigint | null = null
  let lastAdvancedAt: number = Date.now()

  async function pollBlockNumber(): Promise<void> {
    try {
      const response = await fetch(rpcUrl as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        }),
      })

      if (!response.ok) {
        console.error(
          `[rpc-monitor] HTTP error fetching eth_blockNumber: ${response.status} ${response.statusText}`,
        )
        return
      }

      const json = (await response.json()) as { result?: string; error?: unknown }

      if (!json.result) {
        console.error('[rpc-monitor] Unexpected response from eth_blockNumber:', json)
        return
      }

      const blockNumber = BigInt(json.result)
      const now = Date.now()

      if (lastBlockNumber === null || blockNumber > lastBlockNumber) {
        lastBlockNumber = blockNumber
        lastAdvancedAt = now
        return
      }

      // Block number has not advanced — check how long it has been stalled
      const stalledMs = now - lastAdvancedAt
      if (stalledMs >= STALL_THRESHOLD_MS) {
        console.error(
          `[rpc-monitor] Block number has not advanced for ${Math.round(stalledMs / 1000)}s ` +
            `(stuck at ${lastBlockNumber}). WebSocket likely stalled — exiting for restart.`,
        )
        process.exit(1)
      }
    } catch (err) {
      console.error('[rpc-monitor] Failed to poll eth_blockNumber:', err)
    }
  }

  const interval = setInterval(() => {
    void pollBlockNumber()
  }, POLL_INTERVAL_MS)

  // Don't let this interval prevent the process from exiting cleanly
  interval.unref()

  console.log('[rpc-monitor] Started — polling eth_blockNumber every 30s, stall threshold 5m')
}
