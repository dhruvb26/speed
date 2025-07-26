import { create } from 'zustand'
import { CustomToolCall } from '@/types'

interface StreamingToolCall extends CustomToolCall {
  isStreaming: boolean
}

interface ToolCallStore {
  streamingToolCalls: Record<string, StreamingToolCall>

  // Actions
  updateToolCall: (toolCall: StreamingToolCall) => void
  clearToolCall: (id: string) => void
  clearAllToolCalls: () => void
}

export const useToolCallStore = create<ToolCallStore>((set) => ({
  streamingToolCalls: {},

  updateToolCall: (toolCall: StreamingToolCall) => {
    set((state) => ({
      streamingToolCalls: {
        ...state.streamingToolCalls,
        [toolCall.id ?? '']: toolCall,
      },
    }))
  },

  clearToolCall: (id: string) => {
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _, ...rest } = state.streamingToolCalls
      return { streamingToolCalls: rest }
    })
  },

  clearAllToolCalls: () => {
    set({ streamingToolCalls: {} })
  },
}))
