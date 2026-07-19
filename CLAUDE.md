# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WannaBet is a peer-to-peer betting app on Base. Users create trustless wagers using USDC smart contract escrow. Live at https://heywannabet.com.

## Monorepo Structure

This is a pnpm monorepo with three packages:

- **webapp/** - Next.js 16 frontend (React 19, Tailwind v4, wagmi)
- **contracts/** - Hardhat 3 smart contracts (Solidity)
- **shared/** - Shared types and contract ABIs

## Commands

```bash
# Install dependencies (all packages)
pnpm install

# Development
pnpm dev              # Run webapp + shared in watch mode
pnpm dev:web          # Webapp only (Next.js)
pnpm dev:shared       # Shared package watch mode

# Build
pnpm build            # Build all packages
pnpm build:web        # Webapp only (regenerates bet seed first)
pnpm build:shared     # Shared package

# Contracts
pnpm --filter contracts test      # Run contract tests
pnpm --filter contracts compile   # Compile contracts

# Formatting
pnpm prettier         # Format all files
```

## Architecture

### Data Flow

No indexer, no database, no paid services. The webapp reads the chain directly:

```
Build time:  BetCreated logs (free public RPC) → webapp/src/generated/bet-seed.json
Runtime:     seed + incremental log scan + multicall bet() → /api/bets → ENS enrichment → React Query → UI
```

- `webapp/src/lib/bets-server.ts` - all chain reading + caching (unstable_cache, 30s TTL, tag `bets`)
- `webapp/scripts/generate-bet-seed.mjs` - prebuild historical scan (fails soft; runtime scans the gap)
- `POST /api/bets/revalidate` - called after on-chain writes to bust the cache
- `GET /api/resolve?name=|address=` - ENS forward/reverse resolution for the UI

### Type System

Types live in the `shared` package:

- `BetStatus` enum: PENDING, ACTIVE, JUDGING, RESOLVED, CANCELLED
- `Bet` type: enriched bet as served by `/api/bets`
- `BetUser`: address + optional ENS name/avatar

### Smart Contracts (Base Mainnet)

- **BetFactory**: Creates bet clones, find deployment info in `contracts/ignition/deployments`
- **USDC**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` - Default escrow asset

Contract ABIs are exported from the `shared` package (`BET_FACTORY_V1`, `BET_FACTORY_V2`, `BET_V1_ABI`, `BET_V2_ABI`).

Note: a bet's description is NOT stored in contract state - it only exists in the
detailed `BetCreated` event emitted by the bet clone at creation.

### Key Timestamps

- `acceptBy`: Deadline for taker to accept (default: now + 7 days)
- `endsBy`: When the bet outcome must be known
- `judgeDeadline`: Computed by contract as `endsBy + 30 days`

## Package Dependencies

When installing new packages, check if it's already used elsewhere in the repo. If so:

1. Pin version in `pnpm-workspace.yaml` catalog
2. Set version in `package.json` to `catalog:`

## Conventions

- Components use `'use client'` directive if they need to be client-side (access to hooks, state, etc.)
- Drawer (vaul) for forms/details, Dialog for modals

## Webapp Details

See `webapp/CLAUDE.md` for detailed webapp-specific guidance including:

- Color palette (wb-\* tokens)
- React Query configuration
