'use client'

import { Check, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { type Address, isAddress } from 'viem'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn, shortenAddress } from '@/lib/utils'

interface AddressInputProps {
  label: string
  placeholder?: string
  helperText?: string
  required?: boolean
  value: string
  onChange: (value: string, resolvedAddress?: Address) => void
  labelClassName?: string
  inputClassName?: string
}

// Looks like an ENS name (e.g. vitalik.eth)
function isEnsLike(value: string): boolean {
  return /^[^\s.]+(\.[^\s.]+)*\.[a-z]{2,}$/i.test(value.trim())
}

async function resolveName(name: string): Promise<Address | null> {
  const response = await fetch(`/api/resolve?name=${encodeURIComponent(name)}`)
  if (!response.ok) return null
  const data = await response.json()
  return (data.address as Address | null) ?? null
}

export function AddressInput({
  label,
  placeholder = '0x... or name.eth',
  helperText,
  required = false,
  value,
  onChange,
  labelClassName,
  inputClassName,
}: AddressInputProps) {
  const [resolved, setResolved] = useState<Address | null>(null)
  const [isResolving, setIsResolving] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const requestIdRef = useRef(0)

  useEffect(() => {
    const trimmed = value.trim()
    const requestId = ++requestIdRef.current

    if (isAddress(trimmed)) {
      setResolved(trimmed)
      setNotFound(false)
      setIsResolving(false)
      return
    }

    setResolved(null)
    setNotFound(false)

    if (!isEnsLike(trimmed)) {
      setIsResolving(false)
      return
    }

    setIsResolving(true)
    const timeoutId = setTimeout(async () => {
      const address = await resolveName(trimmed)
      if (requestId !== requestIdRef.current) return
      setIsResolving(false)
      setResolved(address)
      setNotFound(!address)
    }, 400)

    return () => clearTimeout(timeoutId)
  }, [value])

  // Report resolution changes upward
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  useEffect(() => {
    onChangeRef.current(value, resolved ?? undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved])

  const showStatus = value.trim().length > 0

  return (
    <div className="space-y-1">
      <Label htmlFor={`address-${label}`} className={cn(labelClassName)}>
        {label}
      </Label>

      <div className="relative">
        <Input
          id={`address-${label}`}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value, undefined)}
          required={required}
          autoComplete="off"
          spellCheck={false}
          className={cn('h-10 pr-9 font-mono text-sm', inputClassName)}
        />
        {showStatus && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isResolving ? (
              <Loader2 className="text-wb-taupe h-4 w-4 animate-spin" />
            ) : resolved ? (
              <Check className="text-wb-mint h-4 w-4" />
            ) : null}
          </div>
        )}
      </div>

      {showStatus && resolved && !isAddress(value.trim()) && (
        <p className="text-wb-mint text-xs">{shortenAddress(resolved)}</p>
      )}
      {showStatus && notFound && (
        <p className="text-wb-coral text-xs">Name not found</p>
      )}
      {helperText && (
        <p className="text-muted-foreground text-xs">{helperText}</p>
      )}
    </div>
  )
}
