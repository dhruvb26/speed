import { AIMessageChunk } from '@langchain/core/messages'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  id?: string
}

export interface SendMessageRequest {
  messages: ChatMessage[]
  config: {
    thread_id: string
  }
  userId: string
}

export interface SendMessageResponse {
  messages: LangGraphMessage[]
  thread_id: string
}

interface CustomAIMessageChunk extends AIMessageChunk {
  tool_call_id?: string
}

export interface ToolResult {
  id: string
  name: string
  content?: string
}

export interface LangGraphMessage {
  lc: number
  type: string
  id: [string, string, string] // [langchain_core, messages, AIMessageChunk/ToolMessage/HumanMessage]
  kwargs: CustomAIMessageChunk
}

export interface CustomToolCall {
  name: string
  // !! change from Record<string, any> to string
  args: string
  id?: string
  type?: 'tool_call'
}
