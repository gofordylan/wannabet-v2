/**
 * Watchdog timer for the Ponder indexer.
 *
 * Ponder 0.16 uses viem's WebSocket transport internally and can silently
 * stall when the connection drops — logging "WARN No new block received
 * within expected time" but never exiting. This module detects that
 * condition and calls process.exit(1) so Railway's restart policy can
 * bring the process back up automatically.
 *
 * Usage:
 *   - Import and call `touchWatchdog()` inside every ponder.on() handler.
 *   - The timer starts automatically on module load.
 */

const CHECK_INTERVAL_MS = 30_000 // check every 30 seconds
const STALL_THRESHOLD_MS = 300_000 // exit after 5 minutes with no block

let lastBlockAt: number = Date.now()

/**
 * Call this whenever a block event is processed. Resets the stall timer.
 */
export function touchWatchdog(): void {
  lastBlockAt = Date.now()
}

const timer = setInterval(() => {
  const stalledMs = Date.now() - lastBlockAt

  if (stalledMs >= STALL_THRESHOLD_MS) {
    const stalledSec = Math.round(stalledMs / 1000)
    console.error(
      `[watchdog] No block received in ${stalledSec}s (threshold: ${STALL_THRESHOLD_MS / 1000}s). ` +
        'WebSocket connection likely stalled. Exiting with code 1 for automatic restart.',
    )
    process.exit(1)
  }
}, CHECK_INTERVAL_MS)

// Don't let this timer prevent a clean exit in non-stall scenarios.
timer.unref()

console.log(
  `[watchdog] Started. Will exit(1) if no block is received within ${STALL_THRESHOLD_MS / 1000}s.`,
)
