import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { formatBRL, parseBRL, cn } from '@/lib/utils'

interface BRLInputProps {
  value: number
  onChange?: (value: number) => void
  onBlur?: (value: number) => void
  className?: string
  inputClassName?: string
  placeholder?: string
}

export function BRLInput({
  value,
  onChange,
  onBlur,
  className,
  inputClassName,
  placeholder,
}: BRLInputProps) {
  const [display, setDisplay] = useState('')
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) {
      setDisplay(value ? formatBRL(value) : '')
    }
  }, [value, focused])

  const handleFocus = () => {
    setFocused(true)
    setDisplay(value ? String(value).replace('.', ',') : '')
  }

  const handleBlur = () => {
    setFocused(false)
    const num = parseBRL(display)
    setDisplay(num ? formatBRL(num) : '')
    onBlur?.(num)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setDisplay(raw)
    onChange?.(parseBRL(raw))
  }

  return (
    <div className={cn('relative', className)}>
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 pointer-events-none z-10">
        R$
      </span>
      <Input
        type="text"
        inputMode="decimal"
        value={display}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn('pl-8', inputClassName)}
        placeholder={placeholder || ''}
      />
    </div>
  )
}
