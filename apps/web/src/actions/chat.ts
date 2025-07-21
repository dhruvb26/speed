'use server'

import { v4 as uuid } from 'uuid'
import { env } from '@/env'
import { auth } from '@clerk/nextjs/server'

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

export async function sendMessage(
  userMessage: string,
  threadId?: string
): Promise<{
  success: boolean
  data?: SendMessageResponse
  error?: string
}> {
  try {
    const finalThreadId = threadId || uuid()
    const { userId } = await auth()

    if (!userId) {
      return {
        success: false,
        error: 'User not found',
      }
    }

    const requestBody: SendMessageRequest = {
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
      config: {
        thread_id: finalThreadId,
      },
      userId: userId!,
    }

    const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/chat/agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
      }
    }

    const data: SendMessageResponse = await response.json()

    const finalResponseData = {
      ...data,
      thread_id: finalThreadId,
    }

    return {
      success: true,
      data: finalResponseData,
    }
  } catch (error) {
    console.error('Error sending message:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
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

export async function getChatHistory(threadId: string): Promise<{
  success: boolean
  data?: ChatHistoryResponse
  error?: string
}> {
  try {
    const response = await fetch(
      `${env.NEXT_PUBLIC_API_URL}/api/chat/${threadId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
      }
    }

    const data: ChatHistoryResponse = await response.json()

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Error fetching chat history:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export interface UserChat {
  id: string
  name: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export async function getUserChats(userId: string): Promise<{
  success: boolean
  data?: UserChat[]
  error?: string
}> {
  try {
    const response = await fetch(
      `${env.NEXT_PUBLIC_API_URL}/api/chat/user/${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
      }
    }

    const data: UserChat[] = await response.json()

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Error fetching user chats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export async function deleteChat(threadId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const response = await fetch(
      `${env.NEXT_PUBLIC_API_URL}/api/chat/${threadId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error deleting chat:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export async function updateChat(threadId: string, name: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const response = await fetch(
      `${env.NEXT_PUBLIC_API_URL}/api/chat/${threadId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      }
    )

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error updating chat:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}