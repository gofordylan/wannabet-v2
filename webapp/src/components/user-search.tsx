'use client'

import type { User } from 'indexer/types'
import { Search } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserAvatar } from '@/components/user-avatar'
import { cn, getUsername, shortenAddress } from '@/lib/utils'

interface UserSearchProps {
  label: string
  placeholder?: string
  helperText?: string
  required?: boolean
  value: string
  onChange: (value: string, user?: User) => void
  excludeAddresses?: string[]
  labelClassName?: string
  inputClassName?: string
}

const EMPTY_ARRAY: string[] = []

// Resolve an ENS name (incl. *.wannabet.eth subnames) or a raw 0x address.
async function searchUsers(query: string): Promise<User[]> {
  const response = await fetch(
    `/api/users/search?q=${encodeURIComponent(query)}`
  )
  if (!response.ok) {
    throw new Error('Search failed')
  }
  const data = await response.json()
  return data.users || []
}

export function UserSearch({
  label,
  placeholder = 'name.eth or 0x address',
  helperText,
  required = false,
  value,
  onChange,
  excludeAddresses = EMPTY_ARRAY,
  labelClassName,
  inputClassName,
}: UserSearchProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [searchQuery, setSearchQuery] = useState(value)
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | undefined>()

  const lastSearchRef = useRef<string>('')

  const performSearch = useCallback(
    async (query: string) => {
      const trimmedQuery = query.trim()

      if (
        !trimmedQuery ||
        trimmedQuery.length < 3 ||
        lastSearchRef.current === trimmedQuery
      ) {
        return
      }

      lastSearchRef.current = trimmedQuery
      setIsLoading(true)

      try {
        const results = await searchUsers(trimmedQuery)
        const excluded = new Set(excludeAddresses.map((a) => a.toLowerCase()))
        const filtered = results.filter(
          (user) => user.address && !excluded.has(user.address.toLowerCase())
        )
        setUsers(filtered.slice(0, 10))
      } catch (error) {
        console.error('Search error:', error)
        setUsers([])
      } finally {
        setIsLoading(false)
      }
    },
    [excludeAddresses]
  )

  // Debounced search effect
  useEffect(() => {
    const stripped = searchQuery.trim()
    if (!stripped || stripped.length < 3) {
      setUsers([])
      lastSearchRef.current = ''
      return
    }

    const timeoutId = setTimeout(() => {
      performSearch(searchQuery)
    }, 350)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [searchQuery, performSearch])

  const handleUserSelect = (user: User) => {
    const display = getUsername(user)
    setSearchQuery(display)
    setSelectedUser(user)
    onChange(user.address, user)
    setIsFocused(false)
    setUsers([])
    lastSearchRef.current = display
  }

  const handleInputChange = (newValue: string) => {
    setSearchQuery(newValue)
    onChange(newValue, undefined)
    if (!newValue.trim()) {
      setSelectedUser(undefined)
      setUsers([])
      lastSearchRef.current = ''
    }
  }

  const handleClearSelection = () => {
    setSearchQuery('')
    setSelectedUser(undefined)
    onChange('', undefined)
    setUsers([])
    lastSearchRef.current = ''
  }

  return (
    <div className="space-y-1">
      <Label htmlFor="user-search" className={cn(labelClassName)}>
        {label}
      </Label>

      {/* Show avatar card if user is selected, otherwise show search input */}
      {selectedUser ? (
        <div className="border-primary bg-primary/10 flex h-10 items-center justify-between gap-2 rounded-md border-2 px-3">
          <div className="flex items-center gap-2">
            <UserAvatar user={selectedUser} size="sm" clickable={false} />
            <p className="text-sm font-medium">{getUsername(selectedUser)}</p>
          </div>
          <button
            type="button"
            onClick={handleClearSelection}
            className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            id="user-search"
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              // Delay to allow click on user
              setTimeout(() => setIsFocused(false), 200)
            }}
            required={required}
            className={cn('h-10 pl-9', inputClassName)}
          />

          {/* Dropdown with resolved suggestion */}
          {isFocused && searchQuery.trim().length >= 3 && (
            <div className="bg-background absolute top-full z-50 mt-1 max-h-[280px] w-full overflow-y-auto rounded-lg border shadow-lg">
              {isLoading ? (
                <div className="text-muted-foreground p-4 text-center text-sm">
                  Resolving...
                </div>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <button
                    key={user.address}
                    type="button"
                    onClick={() => handleUserSelect(user)}
                    className="hover:bg-primary/10 flex w-full items-center gap-3 border-b p-3 text-left transition-colors last:border-b-0"
                  >
                    <UserAvatar user={user} size="md" clickable={false} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">
                        {getUsername(user)}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {shortenAddress(user.address)}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-muted-foreground p-4 text-center text-sm">
                  No match. Enter a full ENS name or 0x address.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {helperText && (
        <p className="text-muted-foreground text-xs">{helperText}</p>
      )}
    </div>
  )
}
