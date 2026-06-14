# WannaBet Webapp

Next.js frontend for the WannaBet peer-to-peer betting app. A standalone web app served at app.heywannabet.com.

## Tech Stack

- **Framework:** Next.js 16, React 19, TypeScript, App Router
- **Web3:** wagmi 2.18, viem 2.38, Base mainnet
- **UI:** Tailwind v4, Radix UI, vaul (drawers), lucide-react icons
- **Font:** Quicksand (weights 400, 500, 600, 700)
- **Data:** React Query, Ponder indexer (direct fetch)
- **Identity:** ENS names + avatars (incl. `*.wannabet.eth` subnames); wallet auth via wagmi `injected`

## Directory Structure

```
src/
├── app/
│   ├── layout.tsx            # Root layout + providers
│   ├── page.tsx              # Home - bet list
│   ├── globals.css           # Tailwind + CSS variables
│   ├── bet/[id]/page.tsx     # Bet detail page
│   └── profile/[address]/page.tsx
├── components/
│   ├── bets-table.tsx        # Bet list cards
│   ├── bet-detail-dialog.tsx # Full bet view + actions (Drawer)
│   ├── create-bet-dialog.tsx # Create bet form (Drawer)
│   ├── status-pennant.tsx    # Status pill badge (rounded-full, solid color)
│   ├── user-avatar.tsx       # Avatar with fallback
│   ├── user-search.tsx       # ENS / address resolver input
│   ├── connect-wallet-button.tsx
│   ├── bottom-nav.tsx        # Mobile navigation
│   ├── welcome-modal.tsx
│   ├── wagmi-provider.tsx    # Web3 provider
│   ├── theme-provider.tsx    # Light/dark theme
│   └── ui/                   # Shadcn-style Radix primitives
├── lib/
│   ├── contracts.ts          # Re-exports ABIs from shared, addresses
│   ├── indexer.ts            # Fetch from Ponder indexer
│   ├── wagmi-config.ts       # Wagmi/viem setup
│   └── utils.ts              # cn(), shortenAddress(), getUsername()
└── hooks/
    ├── useBets.ts            # React Query for all bets
    ├── useBet.ts             # React Query for single bet
    └── useProfile.ts         # React Query for an address's ENS profile
```

## Color Palette — Soft Clay

CSS variables defined in `globals.css`. Use via Tailwind classes like `bg-primary`, `text-muted`, `bg-wb-mint`.

### Theme Variables

| Variable          | Value   | Usage               |
| ----------------- | ------- | ------------------- |
| `background`      | #faf5ef | Page background     |
| `foreground`      | #2d2a26 | Primary text        |
| `primary`         | #c4654a | Buttons, CTAs       |
| `accent`          | #5a7a5e | Highlights          |
| `muted`           | #a09686 | Secondary text      |
| `border`          | #e8e0d4 | Borders             |

### WannaBet Brand Colors (wb-\*)

| Token       | Hex     | Usage                |
| ----------- | ------- | -------------------- |
| `wb-mint`   | #5a7a5e | Active/Live status   |
| `wb-brown`  | #2d2a26 | Primary text         |
| `wb-taupe`  | #8b7d6b | Secondary text       |
| `wb-coral`  | #c4654a | Buttons, CTAs        |
| `wb-cream`  | #faf5ef | Light backgrounds    |
| `wb-sand`   | #f2ebe2 | Card/control bg      |
| `wb-gold`   | #d4a04a | Winner/pending       |
| `wb-yellow` | #d4a04a | Alias for gold       |
| `wb-pink`   | #a09686 | Cancelled status     |
| `wb-lavender` | #8b6baa | Judging status     |

### Status Tokens (wb-status-\*)

| Token                | Hex     | Status    |
| -------------------- | ------- | --------- |
| `wb-status-active`   | #5a7a5e | Live      |
| `wb-status-pending`  | #d4a04a | Pending   |
| `wb-status-judging`  | #8b6baa | Judging   |
| `wb-status-resolved` | #c4654a | Settled   |
| `wb-status-cancelled`| #a09686 | Cancelled |

## Provider Hierarchy

```tsx
<ThemeProvider>
  <WagmiProvider>
    {' '}
    {/* Web3/wallet */}
    {children}
    <BottomNav />
  </WagmiProvider>
</ThemeProvider>
```

## Component Patterns

- **Dialogs:** Use vaul `Drawer` for mobile-optimized sheets (CreateBetDialog, BetDetailDialog)
- **Forms:** Local `useState` + `updateField()` pattern, `isFormValid` derived via useMemo
- **User Selection:** `UserSearch` resolves an ENS name (incl. `*.wannabet.eth`) or raw 0x address (debounced)
- **Status Display:** `StatusPennant` renders solid color rounded-full pill badges with white text
- **Winner Display:** Gold ring + small trophy overlay on avatar, grayscale on loser
- **Cards:** White bg, rounded-3xl, shadow-clay, hover lift effect, staggered mount animation

## Environment Variables

```bash
NEXT_PUBLIC_INDEXER_URL     # Ponder indexer base URL (defaults to hosted instance)
NEXT_PUBLIC_BASE_URL        # Public app URL (share links + OG)
NEXT_PUBLIC_BASE_RPC_URL    # Base RPC for wallet reads (optional)
MAINNET_RPC_URL             # Ethereum RPC for ENS resolution (optional)
```

## React Query Config

Use default options for all queries unless otherwise specified.

## Dev Commands

```bash
pnpm dev        # Start Next.js dev server
pnpm build      # Production build
pnpm lint       # Run ESLint
```

## Dev Tips

- **Add color:** Edit `globals.css` @theme block, use as `bg-wb-newcolor`
- **Contract interaction:** Import ABIs from `lib/contracts.ts`, use wagmi hooks
- **Test bet states:** Set `DEV_SIMULATE_ROLE` in bet-detail-dialog.tsx
- **Identity:** Names/avatars come from ENS; use `getUsername(user)` for name-or-shortened-address
- **React Query:** Always use React Query for data fetching instead of React's useEffect + useState.
- **Types:** Import types from the `indexer` or `shared` package where possible. Derived types are always preferred.
