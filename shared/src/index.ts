export * from './types.js'

export const BET_FACTORY_V1 = {
  address: '0x0F0A585aF686397d94428825D8cCfa2589b159A0',
  startBlock: 37339202,
  abi: [
    {
      inputs: [
        {
          internalType: 'address',
          name: '_owner',
          type: 'address',
        },
        {
          internalType: 'address',
          name: '_betImplementation',
          type: 'address',
        },
      ],
      stateMutability: 'nonpayable',
      type: 'constructor',
    },
    {
      inputs: [],
      name: 'BetNotFound',
      type: 'error',
    },
    {
      inputs: [],
      name: 'FailedDeployment',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'balance',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'needed',
          type: 'uint256',
        },
      ],
      name: 'InsufficientBalance',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'owner',
          type: 'address',
        },
      ],
      name: 'OwnableInvalidOwner',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
      ],
      name: 'OwnableUnauthorizedAccount',
      type: 'error',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'bet',
          type: 'address',
        },
      ],
      name: 'BetCreated',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'newImplementation',
          type: 'address',
        },
      ],
      name: 'ImplementationUpdated',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'previousOwner',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'newOwner',
          type: 'address',
        },
      ],
      name: 'OwnershipTransferred',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'token',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'pool',
          type: 'address',
        },
      ],
      name: 'PoolConfigured',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'newTreasury',
          type: 'address',
        },
      ],
      name: 'TreasuryUpdated',
      type: 'event',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'addr',
          type: 'address',
        },
      ],
      name: 'bet',
      outputs: [
        {
          components: [
            {
              internalType: 'address',
              name: 'maker',
              type: 'address',
            },
            {
              internalType: 'uint40',
              name: 'acceptBy',
              type: 'uint40',
            },
            {
              internalType: 'uint40',
              name: 'resolveBy',
              type: 'uint40',
            },
            {
              internalType: 'enum IBet.Status',
              name: 'status',
              type: 'uint8',
            },
            {
              internalType: 'address',
              name: 'taker',
              type: 'address',
            },
            {
              internalType: 'address',
              name: 'judge',
              type: 'address',
            },
            {
              internalType: 'address',
              name: 'asset',
              type: 'address',
            },
            {
              internalType: 'address',
              name: 'winner',
              type: 'address',
            },
            {
              internalType: 'uint256',
              name: 'makerStake',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'takerStake',
              type: 'uint256',
            },
          ],
          internalType: 'struct IBet.Bet',
          name: '',
          type: 'tuple',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'betCount',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'betImplementation',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'taker',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'judge',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'asset',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'makerStake',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'takerStake',
          type: 'uint256',
        },
        {
          internalType: 'uint40',
          name: 'acceptBy',
          type: 'uint40',
        },
        {
          internalType: 'uint40',
          name: 'resolveBy',
          type: 'uint40',
        },
        {
          internalType: 'string',
          name: 'description',
          type: 'string',
        },
      ],
      name: 'createBet',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'owner',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'maker',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'taker',
          type: 'address',
        },
        {
          internalType: 'uint40',
          name: 'acceptBy',
          type: 'uint40',
        },
        {
          internalType: 'uint40',
          name: 'resolveBy',
          type: 'uint40',
        },
      ],
      name: 'predictBetAddress',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'renounceOwnership',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_token',
          type: 'address',
        },
        {
          internalType: 'address',
          name: '_pool',
          type: 'address',
        },
      ],
      name: 'setPool',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_treasury',
          type: 'address',
        },
      ],
      name: 'setTreasury',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      name: 'tokenToPool',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'newOwner',
          type: 'address',
        },
      ],
      name: 'transferOwnership',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'treasury',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_betImplementation',
          type: 'address',
        },
      ],
      name: 'updateImplementation',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ],
} as const

export const BET_V1_ABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'InvalidAddress',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidAmount',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidInitialization',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidStatus',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidTimestamp',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NotInitializing',
    type: 'error',
  },
  {
    inputs: [],
    name: 'Unauthorized',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [],
    name: 'BetAccepted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [],
    name: 'BetCancelled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'maker',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'taker',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'judge',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'asset',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint40',
        name: 'acceptBy',
        type: 'uint40',
      },
      {
        indexed: false,
        internalType: 'uint40',
        name: 'resolveBy',
        type: 'uint40',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'makerStake',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'takerStake',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'description',
        type: 'string',
      },
    ],
    name: 'BetCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'winner',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'BetResolved',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint64',
        name: 'version',
        type: 'uint64',
      },
    ],
    name: 'Initialized',
    type: 'event',
  },
  {
    inputs: [],
    name: 'accept',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'bet',
    outputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'maker',
            type: 'address',
          },
          {
            internalType: 'uint40',
            name: 'acceptBy',
            type: 'uint40',
          },
          {
            internalType: 'uint40',
            name: 'resolveBy',
            type: 'uint40',
          },
          {
            internalType: 'enum IBet.Status',
            name: 'status',
            type: 'uint8',
          },
          {
            internalType: 'address',
            name: 'taker',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'judge',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'asset',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'winner',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'makerStake',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'takerStake',
            type: 'uint256',
          },
        ],
        internalType: 'struct IBet.Bet',
        name: 'state',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'cancel',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'maker',
            type: 'address',
          },
          {
            internalType: 'uint40',
            name: 'acceptBy',
            type: 'uint40',
          },
          {
            internalType: 'uint40',
            name: 'resolveBy',
            type: 'uint40',
          },
          {
            internalType: 'enum IBet.Status',
            name: 'status',
            type: 'uint8',
          },
          {
            internalType: 'address',
            name: 'taker',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'judge',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'asset',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'winner',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'makerStake',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'takerStake',
            type: 'uint256',
          },
        ],
        internalType: 'struct IBet.Bet',
        name: 'initialBet',
        type: 'tuple',
      },
      {
        internalType: 'string',
        name: 'description',
        type: 'string',
      },
      {
        internalType: 'address',
        name: 'pool',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'treasury',
        type: 'address',
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'winner',
        type: 'address',
      },
    ],
    name: 'resolve',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'status',
    outputs: [
      {
        internalType: 'enum IBet.Status',
        name: '',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export const BET_FACTORY_V2 = {
  address: '0x252B30995510703D09cB4f3597b098D4a96b4E62',
  startBlock: 40402624,
  abi: [
    {
      inputs: [
        {
          internalType: 'address',
          name: '_owner',
          type: 'address',
        },
        {
          internalType: 'address',
          name: '_betImplementation',
          type: 'address',
        },
      ],
      stateMutability: 'nonpayable',
      type: 'constructor',
    },
    {
      inputs: [],
      name: 'ATokenMismatch',
      type: 'error',
    },
    {
      inputs: [],
      name: 'BetNotFound',
      type: 'error',
    },
    {
      inputs: [],
      name: 'FailedDeployment',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'balance',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'needed',
          type: 'uint256',
        },
      ],
      name: 'InsufficientBalance',
      type: 'error',
    },
    {
      inputs: [],
      name: 'InvalidPool',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'owner',
          type: 'address',
        },
      ],
      name: 'OwnableInvalidOwner',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
      ],
      name: 'OwnableUnauthorizedAccount',
      type: 'error',
    },
    {
      inputs: [],
      name: 'TokenNotSupported',
      type: 'error',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'bet',
          type: 'address',
        },
      ],
      name: 'BetCreated',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'newImplementation',
          type: 'address',
        },
      ],
      name: 'ImplementationUpdated',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'previousOwner',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'newOwner',
          type: 'address',
        },
      ],
      name: 'OwnershipTransferStarted',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'previousOwner',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'newOwner',
          type: 'address',
        },
      ],
      name: 'OwnershipTransferred',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'token',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'pool',
          type: 'address',
        },
      ],
      name: 'PoolConfigured',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'newTreasury',
          type: 'address',
        },
      ],
      name: 'TreasuryUpdated',
      type: 'event',
    },
    {
      inputs: [],
      name: 'AAVE_ADDRESSES_PROVIDER',
      outputs: [
        {
          internalType: 'contract IPoolAddressesProvider',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'acceptOwnership',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'addr',
          type: 'address',
        },
      ],
      name: 'bet',
      outputs: [
        {
          components: [
            {
              internalType: 'address',
              name: 'maker',
              type: 'address',
            },
            {
              internalType: 'uint40',
              name: 'acceptBy',
              type: 'uint40',
            },
            {
              internalType: 'uint40',
              name: 'endsBy',
              type: 'uint40',
            },
            {
              internalType: 'enum IBet.Status',
              name: 'status',
              type: 'uint8',
            },
            {
              internalType: 'address',
              name: 'taker',
              type: 'address',
            },
            {
              internalType: 'address',
              name: 'judge',
              type: 'address',
            },
            {
              internalType: 'address',
              name: 'asset',
              type: 'address',
            },
            {
              internalType: 'address',
              name: 'winner',
              type: 'address',
            },
            {
              internalType: 'uint256',
              name: 'makerStake',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'takerStake',
              type: 'uint256',
            },
          ],
          internalType: 'struct IBet.Bet',
          name: '',
          type: 'tuple',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'betCount',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'betImplementation',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'taker',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'judge',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'asset',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'makerStake',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'takerStake',
          type: 'uint256',
        },
        {
          internalType: 'uint40',
          name: 'acceptBy',
          type: 'uint40',
        },
        {
          internalType: 'uint40',
          name: 'endsBy',
          type: 'uint40',
        },
        {
          internalType: 'string',
          name: 'description',
          type: 'string',
        },
      ],
      name: 'createBet',
      outputs: [
        {
          internalType: 'address',
          name: 'newBet',
          type: 'address',
        },
      ],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'owner',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'pendingOwner',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'maker',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'taker',
          type: 'address',
        },
        {
          internalType: 'uint40',
          name: 'acceptBy',
          type: 'uint40',
        },
        {
          internalType: 'uint40',
          name: 'endsBy',
          type: 'uint40',
        },
      ],
      name: 'predictBetAddress',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'renounceOwnership',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_token',
          type: 'address',
        },
        {
          internalType: 'address',
          name: '_pool',
          type: 'address',
        },
      ],
      name: 'setPool',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_treasury',
          type: 'address',
        },
      ],
      name: 'setTreasury',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'token',
          type: 'address',
        },
      ],
      name: 'tokenToPool',
      outputs: [
        {
          internalType: 'address',
          name: 'aavePool',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'newOwner',
          type: 'address',
        },
      ],
      name: 'transferOwnership',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'treasury',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_betImplementation',
          type: 'address',
        },
      ],
      name: 'updateImplementation',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ],
} as const

export const BET_V2_ABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'InvalidAddress',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidInitialization',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidStatus',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidTimestamp',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NotInitializing',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
    ],
    name: 'SafeERC20FailedOperation',
    type: 'error',
  },
  {
    inputs: [],
    name: 'Unauthorized',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [],
    name: 'BetAccepted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [],
    name: 'BetCancelled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'maker',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'taker',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'judge',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'asset',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint40',
        name: 'acceptBy',
        type: 'uint40',
      },
      {
        indexed: false,
        internalType: 'uint40',
        name: 'endsBy',
        type: 'uint40',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'makerStake',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'takerStake',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'description',
        type: 'string',
      },
    ],
    name: 'BetCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'winner',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'BetResolved',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint64',
        name: 'version',
        type: 'uint64',
      },
    ],
    name: 'Initialized',
    type: 'event',
  },
  {
    inputs: [],
    name: 'JUDGING_WINDOW',
    outputs: [
      {
        internalType: 'uint40',
        name: '',
        type: 'uint40',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'accept',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'bet',
    outputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'maker',
            type: 'address',
          },
          {
            internalType: 'uint40',
            name: 'acceptBy',
            type: 'uint40',
          },
          {
            internalType: 'uint40',
            name: 'endsBy',
            type: 'uint40',
          },
          {
            internalType: 'enum IBet.Status',
            name: 'status',
            type: 'uint8',
          },
          {
            internalType: 'address',
            name: 'taker',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'judge',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'asset',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'winner',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'makerStake',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'takerStake',
            type: 'uint256',
          },
        ],
        internalType: 'struct IBet.Bet',
        name: 'state',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'cancel',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'maker',
            type: 'address',
          },
          {
            internalType: 'uint40',
            name: 'acceptBy',
            type: 'uint40',
          },
          {
            internalType: 'uint40',
            name: 'endsBy',
            type: 'uint40',
          },
          {
            internalType: 'enum IBet.Status',
            name: 'status',
            type: 'uint8',
          },
          {
            internalType: 'address',
            name: 'taker',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'judge',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'asset',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'winner',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'makerStake',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'takerStake',
            type: 'uint256',
          },
        ],
        internalType: 'struct IBet.Bet',
        name: 'initialBet',
        type: 'tuple',
      },
      {
        internalType: 'string',
        name: 'description',
        type: 'string',
      },
      {
        internalType: 'address',
        name: 'pool',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'treasury',
        type: 'address',
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'judgingDeadline',
    outputs: [
      {
        internalType: 'uint40',
        name: '',
        type: 'uint40',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'winner',
        type: 'address',
      },
    ],
    name: 'resolve',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'status',
    outputs: [
      {
        internalType: 'enum IBet.Status',
        name: '',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const
