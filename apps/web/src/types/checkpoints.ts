import { LangGraphMessage } from '@/types'

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

export interface CheckpointMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ChatHistoryResponse {
  threadId: string
  checkpointCount: number
  checkpoints: Checkpoint[]
  messages: LangGraphMessage[]
}
