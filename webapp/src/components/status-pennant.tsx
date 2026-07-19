import { BetStatus } from 'shared'

export const STATUS_CONFIG: Record<
  BetStatus,
  {
    bg: string
    label: string
    description: string
  }
> = {
  [BetStatus.PENDING]: {
    bg: 'bg-wb-status-pending',
    label: 'Pending',
    description: 'Waiting for opponent',
  },
  [BetStatus.ACTIVE]: {
    bg: 'bg-wb-status-active',
    label: 'Live',
    description: 'Bet is active',
  },
  [BetStatus.JUDGING]: {
    bg: 'bg-wb-status-judging',
    label: 'Judging',
    description: 'Waiting for judge to decide',
  },
  [BetStatus.RESOLVED]: {
    bg: 'bg-wb-status-resolved',
    label: 'Settled',
    description: 'Winner was decided',
  },
  [BetStatus.CANCELLED]: {
    bg: 'bg-wb-status-cancelled',
    label: 'Cancelled',
    description: 'Bet was canceled or expired',
  },
}

interface StatusPennantProps {
  status: BetStatus
  size?: 'sm' | 'md'
}

export function StatusPennant({ status, size = 'md' }: StatusPennantProps) {
  const config = STATUS_CONFIG[status]
  const sizeClasses =
    size === 'sm' ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-[11px]'

  return (
    <div
      className={`${config.bg} ${sizeClasses} inline-flex items-center justify-center rounded-full font-bold leading-none text-white`}
    >
      {config.label}
    </div>
  )
}
