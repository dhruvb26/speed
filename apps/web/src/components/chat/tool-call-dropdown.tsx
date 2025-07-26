'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useToolCallStore } from '@/store/tool-call-store'
import { CustomToolCall, ToolResult } from '@/types'

interface ToolCallDropdownProps {
  toolCall: CustomToolCall
  toolResult?: ToolResult
  triggerContent: string
  collapsible?: boolean
}

export function ToolCallDropdown({
  toolCall,
  toolResult,
  triggerContent,
  collapsible = true,
}: ToolCallDropdownProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const { streamingToolCalls } = useToolCallStore()

  const toggleDropdown = () => {
    if (collapsible) {
      setInternalIsOpen(!internalIsOpen)
    }
  }

  const streamingToolCall = streamingToolCalls[toolCall.id ?? '']
  const currentToolCall = streamingToolCall || toolCall
  const isCurrentlyStreaming = streamingToolCall?.isStreaming || false

  return (
    <div className="w-full max-w-[60%]">
      <Button
        className={cn(
          'hover:text-primary/70 hover:cursor-pointer no-underline hover:no-underline',
          !collapsible && 'px-2'
        )}
        variant="link"
        onClick={collapsible ? toggleDropdown : undefined}
      >
        <span className="text-sm truncate">{triggerContent}</span>
        {collapsible &&
          (internalIsOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          ))}
      </Button>

      {collapsible && internalIsOpen && (
        <div className="mt-1 ml-4 rounded-md bg-muted py-3 px-4 space-y-2">
          <div className="text-xs font-semibold mb-4">
            {currentToolCall.name}
          </div>
          {currentToolCall.args && (
            <div className="flex items-start gap-2 text-xs">
              <span className="text-muted-foreground shrink-0">Arguments:</span>
              {isCurrentlyStreaming ? (
                <span className="break-words max-w-sm">
                  {currentToolCall.args}
                </span>
              ) : (
                <span className="break-words max-w-sm">
                  {currentToolCall.args}
                </span>
              )}
            </div>
          )}

          {toolResult && (
            <div className="flex items-start gap-2 text-xs">
              <span className="text-muted-foreground shrink-0">Result:</span>
              <span className="break-words max-w-sm">{toolResult.content}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
