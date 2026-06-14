import { parseAbiItem } from 'abitype'
import { createConfig, factory } from 'ponder'
import { BET_FACTORY_V1, BET_FACTORY_V2, BET_V1_ABI, BET_V2_ABI } from 'shared'
import { base } from 'viem/chains'

export default createConfig({
  chains: {
    base: {
      id: base.id,
      // Defaults to a free public RPC; override with a dedicated endpoint in prod.
      rpc: process.env.BASE_RPC_URL || 'https://base-rpc.publicnode.com',
      ws: process.env.BASE_WS_URL,
    },
  },
  contracts: {
    BetFactory: {
      chain: 'base',
      abi: BET_FACTORY_V1.abi,
      startBlock: BET_FACTORY_V1.startBlock,
      address: BET_FACTORY_V1.address,
    },
    Bet: {
      chain: 'base',
      abi: BET_V1_ABI,
      startBlock: BET_FACTORY_V1.startBlock,
      address: factory({
        address: BET_FACTORY_V1.address,
        event: parseAbiItem('event BetCreated(address indexed bet)'),
        parameter: 'bet',
      }),
    },
    Bet2Factory: {
      chain: 'base',
      abi: BET_FACTORY_V2.abi,
      startBlock: BET_FACTORY_V2.startBlock,
      address: BET_FACTORY_V2.address,
    },
    Bet2: {
      chain: 'base',
      abi: BET_V2_ABI,
      startBlock: BET_FACTORY_V2.startBlock,
      address: factory({
        address: BET_FACTORY_V2.address,
        event: parseAbiItem('event BetCreated(address indexed bet)'),
        parameter: 'bet',
      }),
    },
  },
})
