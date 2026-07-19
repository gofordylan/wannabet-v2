import { type ClassValue, clsx } from 'clsx'
import type { BetUser } from 'shared'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function getDisplayName(user: BetUser | null | undefined): string {
  if (!user) return '?'
  return user.name || shortenAddress(user.address)
}
