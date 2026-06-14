# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WannaBet is a peer-to-peer betting app on the Base blockchain, deployed as a standalone web app (heywannabet.com / app.heywannabet.com). Users create trustless wagers using USDC smart contract escrow.

## Monorepo Structure

This is a pnpm monorepo with four packages:

- **webapp/** - Next.js 16 frontend (React 19, Tailwind v4, wagmi)
- **indexer/** - Ponder indexer for on-chain events
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
pnpm dev:indexer      # Run Ponder indexer

# Build
pnpm build            # Build all packages
pnpm build:web        # Webapp only
pnpm build:shared     # Shared package
pnpm build:indexer    # Indexer package

# Contracts
pnpm --filter contracts test      # Run contract tests
pnpm --filter contracts compile   # Compile contracts

# Formatting
pnpm prettier         # Format all files
```

## Architecture

### Data Flow

```
On-chain events → Ponder Indexer → /bets (ENS enrichment) → React Query → UI
```

### Type System

Types are centralized in the `indexer` package and re-exported:

- `BetStatus` enum: PENDING, ACTIVE, JUDGING, RESOLVED, CANCELLED
- `Bet` type: inferred from indexer API response
- `User`: address + resolved ENS profile (ensName, ensAvatar)

Import from `indexer/types`.

### Smart Contracts (Base Mainnet)

- **BetFactory**: Creates bet clones, find deployment info in `contracts/ignition/deployments`
- **USDC**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` - Default escrow asset

Contract ABIs are exported from the `shared` package (`BET_FACTORY_V1`, `BET_FACTORY_V2`, `BET_V1_ABI`, `BET_V2_ABI`).

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
