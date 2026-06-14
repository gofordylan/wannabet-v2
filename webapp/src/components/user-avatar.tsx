'use client'

import Link from 'next/link'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { User } from 'indexer/types'
import { getUsername } from '@/lib/utils'

interface UserAvatarProps {
  user: User
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  clickable?: boolean
}

export function UserAvatar({
  user,
  size = 'md',
  clickable = true,
}: UserAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
    '2xl': 'h-40 w-40',
  }

  const getFallbackInitials = () => {
    if (user.ensName) {
      return user.ensName.replace(/\.eth$/, '').slice(0, 2).toUpperCase()
    }
    // Fall back to the first two hex characters of the address
    return user.address.slice(2, 4).toUpperCase()
  }

  const avatar = (
    <Avatar className={sizeClasses[size]}>
      <AvatarImage src={user.ensAvatar ?? undefined} alt={getUsername(user)} />
      <AvatarFallback>{getFallbackInitials()}</AvatarFallback>
    </Avatar>
  )

  if (!clickable) {
    return avatar
  }

  return (
    <Link
      href={`/profile/${user.address}`}
      className="inline-block transition-opacity hover:opacity-80"
      title={getUsername(user)}
    >
      {avatar}
    </Link>
  )
}
