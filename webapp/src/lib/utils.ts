import type { User } from 'indexer/types'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function getUsername(user: User | null | undefined): string {
  if (!user) return '?'
  return user.ensName || shortenAddress(user.address)
}
