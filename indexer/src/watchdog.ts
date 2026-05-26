const WATCHDOG_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

let lastBlockAt: number = Date.now()
let lastBlockNumber: number | null = null
let watchdogTimer: ReturnType<typeof setTimeout> | null = null

function scheduleWatchdog() {
  if (watchdogTimer !== null) {
    clearTimeout(watchdogTimer)
  }

  watchdogTimer = setTimeout(() => {
    console.error(
      `[watchdog] No new block seen in ${WATCHDOG_TIMEOUT_MS / 1000}s — last block ${lastBlockNumber} at ${new Date(lastBlockAt).toISOString()}. Exiting.`
    )
    process.exit(1)
  }, WATCHDOG_TIMEOUT_MS)

  // Allow the process to exit naturally even if this timer is still pending
  watchdogTimer.unref()
}

/**
 * Call once per event, passing the block number of that event.
 * The watchdog timer is only reset when the block number changes,
 * so multiple events from the same block incur no extra overhead.
 */
export function touchWatchdog(blockNumber: number): void {
  if (blockNumber === lastBlockNumber) {
    // Same block — no need to reset the timer
    return
  }

  lastBlockNumber = blockNumber
  lastBlockAt = Date.now()
  scheduleWatchdog()
}
