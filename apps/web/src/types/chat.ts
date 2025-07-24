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

export interface LangChainMessage {
  lc: number
  type: string
  id: string[]
  kwargs: {
    content: string
    additional_kwargs: any
    response_metadata?: any
    id: string
    tool_calls?: any[]
    invalid_tool_calls?: any[]
    usage_metadata?: any
  }
}

export interface SendMessageResponse {
  messages: LangChainMessage[]
  thread_id: string
}

export interface CheckpointMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface LangGraphMessageKwargs {
  content: string
  additional_kwargs: Record<string, unknown>
  response_metadata: Record<string, unknown>
  id: string
  tool_calls?: unknown[]
  invalid_tool_calls?: unknown[]
  usage_metadata?: Record<string, unknown>
}

export interface LangGraphMessage {
  lc: number
  type: string
  id: [string, string, string]
  kwargs: LangGraphMessageKwargs
}

export interface CheckpointConfig {
  configurable: {
    thread_id: string
    checkpoint_ns: string
    checkpoint_id: string
  }
}

export interface CheckpointValues {
  messages?: LangGraphMessage[]
  [key: string]: unknown
}

export interface CheckpointMetadata {
  step: number
  source: string
  writes: Record<string, unknown> | null
  parents: Record<string, unknown>
}

export interface Checkpoint {
  checkpointId: string
  timestamp: string
  config: CheckpointConfig
  values: CheckpointValues
  metadata: CheckpointMetadata
  parentConfig: CheckpointConfig
  pendingSends: unknown[]
}

export interface ChatHistoryResponse {
  threadId: string
  checkpointCount: number
  checkpoints: Checkpoint[]
  messages: LangGraphMessage[]
}

export interface UserChat {
  id: string
  name: string
  userId: string
  createdAt: Date
  updatedAt: Date
}
