import { ponder } from 'ponder:registry'
import { bet, betCreatedEvent, factoryBetCreatedEvent } from 'ponder:schema'
import { BET_FACTORY_V1, BET_FACTORY_V2, BET_V2_ABI } from 'shared'
import { touchWatchdog } from './watchdog'

const FACTORY_ADDRESSES = new Set([
  BET_FACTORY_V1.address.toLowerCase(),
  BET_FACTORY_V2.address.toLowerCase(),
])

const ENTRYPOINT_V07 = '0x0000000071727de22e5e9d8baf0edac6f37da032'

function detectSource(txTo: string | null): string | null {
  if (!txTo) return null
  const to = txTo.toLowerCase()
  if (FACTORY_ADDRESSES.has(to)) return 'fc'
  if (to === ENTRYPOINT_V07) return 'x'
  return null
}

ponder.on('Bet2Factory:BetCreated', async ({ event, context }) => {
  touchWatchdog(event.block.number)
  await context.db.insert(factoryBetCreatedEvent).values({
    ...event.args,
    factory: event.log.address,
    timestamp: Number(event.block.timestamp),
  })
})

ponder.on('Bet2:BetCreated', async ({ event, context }) => {
  touchWatchdog(event.block.number)
  // Read judgeDeadline from the contract
  const judgeDeadline = await context.client.readContract({
    address: event.log.address,
    abi: BET_V2_ABI,
    functionName: 'judgingDeadline',
  })

  await context.db.insert(betCreatedEvent).values({
    ...event.args,
    bet: event.log.address,
    id: event.id,
    factory: event.log.address,
    timestamp: Number(event.block.timestamp),
  })

  await context.db.insert(bet).values({
    ...event.args,
    address: event.log.address,
    createdAt: Number(event.block.timestamp),
    judgeDeadline,
    version: 2,
    source: detectSource(event.transaction.to),
  })
})

ponder.on('Bet2:BetAccepted', async ({ event, context }) => {
  touchWatchdog(event.block.number)
  await context.db.update(bet, { address: event.log.address }).set({
    acceptedAt: Number(event.block.timestamp),
  })
})

ponder.on('Bet2:BetResolved', async ({ event, context }) => {
  touchWatchdog(event.block.number)
  await context.db.update(bet, { address: event.log.address }).set({
    winner: event.args.winner,
    resolvedAt: Number(event.block.timestamp),
  })
})

ponder.on('Bet2:BetCancelled', async ({ event, context }) => {
  touchWatchdog(event.block.number)
  await context.db.update(bet, { address: event.log.address }).set({
    cancelledAt: Number(event.block.timestamp),
  })
})
