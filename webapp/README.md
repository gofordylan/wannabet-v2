# WannaBet Webapp

A Next.js dapp to interact with the WannaBet [smart contracts](../contracts/README.md). Bet data is read directly from Base via free public RPCs - there is no indexer, database, or paid service behind the app.

Deployed at https://heywannabet.com.

## How bet data flows

1. `webapp/scripts/generate-bet-seed.mjs` runs before every build and scans `BetCreated` logs from both factories into `src/generated/bet-seed.json` (bet addresses, creation timestamps, descriptions).
2. At runtime, `/api/bets` scans only the blocks since the seed was generated, reads live bet state with a single multicall, enriches addresses with ENS names/avatars (mainnet), and caches the result for 30 seconds.
3. After an on-chain write (create/accept/resolve/cancel), the client POSTs `/api/bets/revalidate` to bust the cache.

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
