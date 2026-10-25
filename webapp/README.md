# WannaBet Webapp

A Next.js dapp to interact with the WannaBet [smart contracts](../contracts/README.md). Bet data is read directly from Base via free public RPCs - there is no indexer, database, or paid service behind the app.

Deployed at https://heywannabet.com.

## How bet data flows

1. `webapp/scripts/generate-bet-seed.mjs` runs before every build and scans `BetCreated` logs from both factories into `src/generated/bet-seed.json` (bet addresses, creation timestamps, descriptions).
2. At runtime, `/api/bets` scans blocks missing from the seed newest-first, reads live bet state with a single multicall, enriches addresses with ENS names/avatars (mainnet), and caches the result for 30 seconds. Successful discoveries and unscanned ranges are retained within a warm server instance; a cold start begins from the durable seed again. A stale seed cannot block recent discoveries, but complete historical backfill still requires a successful seed scan. Individually verified newer bets may be included in the seed without advancing its contiguous `scannedToBlock` cursor.
3. The list refreshes every 30 seconds and on window focus. After an on-chain write (create/accept/resolve/cancel), the client POSTs `/api/bets/revalidate` to bust the cache.

The seed may also include individually verified newer bets beyond `scannedToBlock`. That cursor records only contiguous historical scan coverage; adding a verified recent bet must not advance it or imply the intervening blocks were scanned.

## Environment variables

All optional - public RPCs are used by default:

```bash
BASE_RPC_URL                # Server-side Base RPC override
MAINNET_RPC_URL             # Server-side Ethereum RPC override (ENS lookups)
NEXT_PUBLIC_BASE_RPC_URL    # Browser wallet RPC override
```

## Dev commands

```bash
pnpm dev              # Start Next.js dev server
pnpm build            # Regenerate bet seed + production build
pnpm generate-seed    # Manually refresh src/generated/bet-seed.json
pnpm lint             # Run ESLint
```

## Discovery regression tests

Run `node --experimental-strip-types --test webapp/tests/bet-discovery.test.mjs` from the repository root (Node 22.6+). Covers stale seeds, resumable backfill, RPC/metadata failures, provider limits, deduplication, and concurrent requests.
