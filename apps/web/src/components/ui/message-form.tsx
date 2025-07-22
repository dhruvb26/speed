'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowUp, PlusIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageFormProps {
  onSubmit: (message: string) => Promise<void>
  isLoading?: boolean
  className?: string
}

export function MessageForm({
  onSubmit,
  isLoading = false,
  className,
}: MessageFormProps) {
  const [inputValue, setInputValue] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputValue.trim()) return

    const message = inputValue.trim()
    setInputValue('')

    try {
      await onSubmit(message)
    } catch (error) {
      console.error('Error in message submission:', error)
      setInputValue(message)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'flex gap-2 shadow-sm flex-col rounded-3xl p-2 min-h-16 w-full border border-muted bg-muted',
        className
      )}
    >
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Tell it to do anything"
        disabled={isLoading}
        className="resize-none min-h-9 overflow-hidden border-none shadow-none"
      />
      <div className={cn('flex flex-row items-end pl-2', 'justify-between')}>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-full"
          disabled={isLoading}
        >
          <PlusIcon className="icon-button icon-xs" />
        </Button>

        <Button
          type="submit"
          size="icon"
          className="rounded-full"
          disabled={!inputValue.trim() || isLoading}
        >
          <ArrowUp className="icon-button icon-xs" />
        </Button>
      </div>
    </form>
  )
}
