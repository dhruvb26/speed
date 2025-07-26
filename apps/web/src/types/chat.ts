import { CustomToolCall, LangGraphMessage, ToolResult } from '@/types'

export interface UserChat {
  id: string
  name: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'tool_call_chunk' | 'tool_result'
  content: string
  timestamp: Date
  toolCall?: CustomToolCall
  toolResult?: ToolResult
  isStreaming?: boolean
}

export interface ParsedStreamChunk {
  type:
    | 'assistant'
    | 'tool_call_chunk'
    | 'tool_result'
    | 'unknown'
    | 'complete'
    | 'error'
  id: string
  content?: string
  toolCall?: CustomToolCall
  toolResult?: ToolResult
  timestamp: string
}

export interface ParsedStreamInput {
  type: 'stream' | 'complete' | 'error' | 'unknown'
  message?: LangGraphMessage
  timestamp: string
}