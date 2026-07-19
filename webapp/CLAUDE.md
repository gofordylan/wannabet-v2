# WannaBet Webapp

Next.js frontend for the WannaBet peer-to-peer betting app. A standalone dapp served at https://heywannabet.com — no indexer, database, or paid services behind it.

## Tech Stack

- **Framework:** Next.js 16, React 19, TypeScript, App Router
- **Web3:** wagmi 2.18, viem 2.38, Base mainnet (injected + Coinbase Wallet connectors)
- **UI:** Tailwind v4, Radix UI, vaul (drawers), lucide-react icons
- **Font:** Quicksand (weights 400, 500, 600, 700)
- **Data:** React Query → `/api/bets` (reads the chain directly via free public RPCs)
- **Identity:** ENS names/avatars via mainnet public RPC, fallback to shortened addresses

## Directory Structure

```
src/
├── app/
│   ├── layout.tsx            # Root layout + providers
│   ├── page.tsx              # Home - bet list
│   ├── globals.css           # Tailwind + CSS variables
│   ├── bet/[id]/page.tsx     # Bet detail page
│   └── api/
│       ├── bets/route.ts     # Enriched bets from chain (30s cache)
│       ├── bets/revalidate/route.ts  # Cache bust after on-chain writes
│       └── resolve/route.ts  # ENS forward/reverse resolution
├── components/
│   ├── bets-table.tsx        # Bet list cards
│   ├── bet-detail-dialog.tsx # Full bet view + actions (Drawer)
│   ├── create-bet-dialog.tsx # Create bet form (Drawer)
│   ├── address-input.tsx     # Address / ENS name input with resolution
│   ├── status-pennant.tsx    # Status pill badge (rounded-full, solid color)
│   ├── user-avatar.tsx       # ENS avatar with address-initials fallback
│   ├── connect-wallet-button.tsx
│   ├── bottom-nav.tsx        # Mobile navigation
│   ├── welcome-modal.tsx
│   ├── wagmi-provider.tsx    # Web3 provider
│   ├── theme-provider.tsx    # Light/dark theme
│   └── ui/                   # Shadcn-style Radix primitives
├── generated/
│   └── bet-seed.json         # Historical bets, regenerated at build time
├── lib/
│   ├── contracts.ts          # Re-exports ABIs from shared, addresses
│   ├── bets-server.ts        # Server-side chain reading + caching + ENS
│   ├── bets.ts               # Client fetchers for /api/bets
│   ├── wagmi-config.ts       # Wagmi/viem setup
│   └── utils.ts              # cn(), shortenAddress(), getDisplayName()
├── hooks/
│   ├── useBets.ts            # React Query for all bets
│   ├── useBet.ts             # React Query for single bet
│   └── useCreateBet/useAcceptBet/useResolveBet/useCancelBet
└── hooks/ (cont.)

scripts/
└── generate-bet-seed.mjs     # Prebuild historical BetCreated log scan
```

## Color Palette — Soft Clay

CSS variables defined in `globals.css`. Use via Tailwind classes like `bg-primary`, `text-muted`, `bg-wb-mint`.

### Theme Variables

| Variable     | Value   | Usage           |
| ------------ | ------- | --------------- |
| `background` | #faf5ef | Page background |
| `foreground` | #2d2a26 | Primary text    |
| `primary`    | #c4654a | Buttons, CTAs   |
| `accent`     | #5a7a5e | Highlights      |
| `muted`      | #a09686 | Secondary text  |
| `border`     | #e8e0d4 | Borders         |

### WannaBet Brand Colors (wb-\*)

| Token         | Hex     | Usage              |
| ------------- | ------- | ------------------ |
| `wb-mint`     | #5a7a5e | Active/Live status |
| `wb-brown`    | #2d2a26 | Primary text       |
| `wb-taupe`    | #8b7d6b | Secondary text     |
| `wb-coral`    | #c4654a | Buttons, CTAs      |
| `wb-cream`    | #faf5ef | Light backgrounds  |
| `wb-sand`     | #f2ebe2 | Card/control bg    |
| `wb-gold`     | #d4a04a | Winner/pending     |
| `wb-yellow`   | #d4a04a | Alias for gold     |
| `wb-pink`     | #a09686 | Cancelled status   |
| `wb-lavender` | #8b6baa | Judging status     |

### Status Tokens (wb-status-\*)

| Token                 | Hex     | Status    |
| --------------------- | ------- | --------- |
| `wb-status-active`    | #5a7a5e | Live      |
| `wb-status-pending`   | #d4a04a | Pending   |
| `wb-status-judging`   | #8b6baa | Judging   |
| `wb-status-resolved`  | #c4654a | Settled   |
| `wb-status-cancelled` | #a09686 | Cancelled |

## Provider Hierarchy

```tsx
<ThemeProvider>
  <WagmiProvider>
    {' '}
    {/* Web3/wallet + React Query */}
    {children}
    <BottomNav />
  </WagmiProvider>
</ThemeProvider>
```

## Component Patterns

- **Dialogs:** Use vaul `Drawer` for mobile-optimized sheets (CreateBetDialog, BetDetailDialog)
- **Forms:** Local `useState` + `updateField()` pattern, `isFormValid` derived via useMemo
- **Participant Entry:** `AddressInput` accepts a raw 0x address or an ENS name (resolved via `/api/resolve`)
- **Status Display:** `StatusPennant` renders solid color rounded-full pill badges with white text
- **Winner Display:** Gold ring + small trophy overlay on avatar, grayscale on loser
- **Cards:** White bg, rounded-3xl, shadow-clay, hover lift effect, staggered mount animation

## Environment Variables

All optional — free public RPCs are the default:

```bash
BASE_RPC_URL                # Server-side Base RPC override
MAINNET_RPC_URL             # Server-side Ethereum RPC override (ENS)
NEXT_PUBLIC_BASE_RPC_URL    # Browser wallet RPC override
```

## React Query Config

Use default options for all queries unless otherwise specified.

## Dev Commands

```bash
pnpm dev            # Start Next.js dev server
pnpm build          # Regenerate bet seed + production build
pnpm generate-seed  # Manually refresh src/generated/bet-seed.json
pnpm lint           # Run ESLint
```

## Dev Tips

- **Add color:** Edit `globals.css` @theme block, use as `bg-wb-newcolor`
- **Contract interaction:** Import ABIs from `lib/contracts.ts`, use wagmi hooks
- **Test bet states:** Set `DEV_SIMULATE_ROLE` in bet-detail-dialog.tsx
- **React Query:** Always use React Query for data fetching instead of React's useEffect + useState.
- **Types:** Import types from the `shared` package where possible. Derived types are always preferred.
- **Seed staleness:** The runtime scanner covers blocks created after the last build; redeploying refreshes the seed and keeps that gap small.
