'use client'

import { X } from 'lucide-react'
import { BetStatus } from 'shared'

import { STATUS_CONFIG, StatusPennant } from '@/components/status-pennant'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'

interface WelcomeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Order of statuses to display in the welcome modal
const STATUS_ORDER: BetStatus[] = [
  BetStatus.PENDING,
  BetStatus.ACTIVE,
  BetStatus.JUDGING,
  BetStatus.CANCELLED,
  BetStatus.RESOLVED,
]

export function WelcomeModal({ open, onOpenChange }: WelcomeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[90vw] max-w-sm gap-0 overflow-hidden rounded-xl border-0 bg-white p-0 [&>button:last-child]:hidden">
        {/* Coral Header */}
        <div className="bg-wb-coral flex items-center justify-between px-4 py-3">
          <DialogTitle className="text-wb-brown text-lg font-bold">
            Info
          </DialogTitle>
          <DialogClose className="rounded-sm text-white opacity-80 transition-opacity hover:opacity-100">
            <X className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Body - Scrollable */}
        <div className="text-wb-brown max-h-[calc(85vh-52px)] space-y-4 overflow-y-auto bg-white px-4 py-4">
          {/* What is WannaBet */}
          <section>
            <h3 className="mb-1 text-base font-bold">What is WannaBet?</h3>
            <p className="text-wb-taupe text-sm">
              A peer-to-peer social betting app. Make trustless wagers with
              friends using smart contract escrow.
            </p>
          </section>

          {/* The Process */}
          <section>
            <h3 className="mb-2 text-base font-bold">The Process</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="bg-wb-coral text-wb-cream flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  1
                </div>
                <p className="text-sm">
                  <span className="font-bold">Create a Bet</span>
                  <span className="text-wb-taupe">
                    {' '}
                    - Set opponent, stakes, judge, and end date.
                  </span>
                </p>
              </div>

              <div className="flex items-start gap-2">
                <div className="bg-wb-coral text-wb-cream flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  2
                </div>
                <p className="text-sm">
                  <span className="font-bold">Opponent Accepts</span>
                  <span className="text-wb-taupe">
                    {' '}
                    - Stakes are locked in the contract.
                  </span>
                </p>
              </div>

              <div className="flex items-start gap-2">
                <div className="bg-wb-coral text-wb-cream flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  3
                </div>
                <p className="text-sm">
                  <span className="font-bold">Judge Settles</span>
                  <span className="text-wb-taupe">
                    {' '}
                    - Determines winner who gets paid.
                  </span>
                </p>
              </div>
            </div>
          </section>

          {/* Status Indicators */}
          <section>
            <h3 className="mb-2 text-base font-bold">Status Indicators</h3>
            <div className="space-y-1.5">
              {STATUS_ORDER.map((status) => {
                const config = STATUS_CONFIG[status]
                return (
                  <div key={status} className="flex items-center gap-2">
                    <StatusPennant status={status} size="sm" />
                    <p className="text-sm">
                      <span className="font-bold">{config.label}</span>
                      <span className="text-wb-taupe">
                        {' '}
                        - {config.description}
                      </span>
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
