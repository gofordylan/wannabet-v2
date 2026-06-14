# Hosting & cost guide

How to run WannaBet cheaply (target: ~$5/mo or less). There are three moving
pieces: the **webapp** (Vercel), the **indexer** (a long-running Ponder process
+ Postgres), and the **RPC** the indexer uses to read Base.

## TL;DR

| Piece            | Was                         | Cheap/free option                                              |
| ---------------- | --------------------------- | ------------------------------------------------------------- |
| RPC ("Alchemy")  | paid RPC via `BASE_RPC_URL` | free public RPC (PublicNode / dRPC) — **config only, no code** |
| Indexer Postgres | Railway managed Postgres    | **Neon free tier** (`DATABASE_URL`)                            |
| Indexer compute  | Railway service             | keep one small always-on host (~$5/mo) — Railway / Fly / VPS   |
| Webapp           | Vercel                      | Vercel Hobby (free)                                            |

## 1. "Alchemy" — it isn't in the code

There are **no Alchemy references in the repo**. The indexer's RPC is whatever
you set `BASE_RPC_URL` (and optional `BASE_WS_URL`) to in the indexer's
environment. To stop paying:

1. In your indexer host's env vars, set:
   - `BASE_RPC_URL=https://base-rpc.publicnode.com` (free, no key), or use
     [dRPC](https://drpc.org), [Ankr](https://ankr.com), or Alchemy's free tier.
   - Optionally `BASE_WS_URL=wss://base-rpc.publicnode.com` for realtime.
2. If unset, the code now **defaults to PublicNode** (see `indexer/ponder.config.ts`),
   so a missing value no longer breaks the sync.

> The webapp's client RPC already defaults to the free `https://mainnet.base.org`,
> and the contracts package already uses free PublicNode. The only place a paid
> RPC mattered was the indexer.

ENS resolution (names + avatars) uses a separate **Ethereum mainnet** RPC,
`MAINNET_RPC_URL`, which also defaults to a free public node.

## 2. Railway — split the database from the compute

Ponder needs (a) a Postgres database and (b) a process that runs 24/7
(`ponder start`). The database is the part you can make free; the compute is the
part that costs a few dollars.

### Database → Neon (free)

1. Create a project at [neon.tech](https://neon.tech) (free tier: 0.5 GB,
   scales to zero).
2. Copy the connection string into the indexer's `DATABASE_URL`.
3. Redeploy. Ponder will create its schema on first run; the app's
   `source_override` table is created automatically.

This removes Railway's managed-Postgres line item.

### Compute → keep it small (~$5/mo)

Ponder must stay running to keep the index warm, so a sleep-on-idle free tier
(Render/Koyeb free) will repeatedly re-sync and is not recommended for the
indexer. Cheapest reliable options:

- **Railway Hobby** — keep just the indexer service (DB now on Neon).
- **Fly.io** — a single shared-cpu-1x machine.
- **A $4–5 VPS** (Hetzner, etc.) running `pnpm --filter indexer start` under a
  process manager.

Whichever you pick, set: `BASE_RPC_URL`, `MAINNET_RPC_URL`, `DATABASE_URL`
(and optional `BASE_WS_URL`).

### Point the webapp at the indexer

The indexer URL is no longer hardcoded — set `NEXT_PUBLIC_INDEXER_URL` in the
webapp (Vercel) env to your indexer's public URL. If unset it falls back to the
existing Railway URL, so nothing breaks during migration.

## 3. Webapp — Vercel Hobby (free)

The webapp is a standard Next.js app and runs on Vercel's free Hobby plan. The
only server-side env it needs is `MAINNET_RPC_URL` (optional) for the ENS
resolver in `/api/users/search`. Build config lives in `vercel.json`.

## Environment variable reference

**Indexer** (`indexer/.env`)

```bash
BASE_RPC_URL=https://base-rpc.publicnode.com   # free Base RPC
BASE_WS_URL=                                    # optional realtime
MAINNET_RPC_URL=https://ethereum-rpc.publicnode.com  # ENS resolution
DATABASE_URL=postgres://...                     # Neon free tier
```

**Webapp** (`webapp/.env.local`)

```bash
NEXT_PUBLIC_INDEXER_URL=https://your-indexer-host
NEXT_PUBLIC_BASE_URL=https://app.heywannabet.com
NEXT_PUBLIC_BASE_RPC_URL=                        # optional, defaults to base.org
MAINNET_RPC_URL=https://ethereum-rpc.publicnode.com
```

## Going fully $0 (optional)

If the indexer compute cost still bothers you, the bigger lever is dropping the
indexer entirely and reading bets directly from chain (or a free query API).
That's a real rewrite, not a config change — open an issue before attempting it.
