'use client'

import type { BetUser } from 'shared'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getDisplayName } from '@/lib/utils'

interface UserAvatarProps {
  user: BetUser
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

export function UserAvatar({ user, size = 'md' }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
    '2xl': 'h-40 w-40',
  }

  const getFallbackInitials = () => {
    if (user.name) {
      return user.name
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    // 0xAB... -> "AB"
    return user.address.slice(2, 4).toUpperCase()
  }

  return (
    <Avatar className={sizeClasses[size]}>
      <AvatarImage
        src={user.avatarUrl ?? undefined}
        alt={getDisplayName(user)}
      />
      <AvatarFallback>{getFallbackInitials()}</AvatarFallback>
    </Avatar>
  )
}
