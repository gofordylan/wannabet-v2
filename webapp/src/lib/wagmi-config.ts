import { createConfig, http } from 'wagmi'
import { base } from 'wagmi/chains'
import { coinbaseWallet, injected } from 'wagmi/connectors'

// Use custom RPC if provided, otherwise fall back to public RPC
const baseRpcUrl =
  process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [injected(), coinbaseWallet({ appName: 'WannaBet' })],
  transports: {
    [base.id]: http(baseRpcUrl),
  },
})
