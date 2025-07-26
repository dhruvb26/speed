import { create } from 'zustand'

interface ChatStore {
  initialMessages: Record<string, string>
  setInitialMessage: (threadId: string, message: string) => void
  getInitialMessage: (threadId: string) => string | null
  clearInitialMessage: (threadId: string) => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  initialMessages: {},

  setInitialMessage: (threadId: string, message: string) => {
    set((state) => ({
      initialMessages: {
        ...state.initialMessages,
        [threadId]: message,
      },
    }))
  },

  getInitialMessage: (threadId: string) => {
    const state = get()
    return state.initialMessages[threadId] || null
  },

  clearInitialMessage: (threadId: string) => {
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [threadId]: removed, ...rest } = state.initialMessages
      return {
        initialMessages: rest,
      }
    })
  },
}))
