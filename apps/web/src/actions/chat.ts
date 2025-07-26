'use server'

import { env } from '@/env'
import type {
  ChatHistoryResponse,
  UserChat,
  Result,
  ApiResponse,
} from '@/types'

export async function getChatHistory(
  threadId: string
): Promise<ApiResponse<ChatHistoryResponse>> {
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

    const result: Result<ChatHistoryResponse> = await response.json()

    if (result.error) {
      return {
        success: false,
        error: result.error,
      }
    }

    return {
      success: true,
      data: result.data!,
    }
  } catch (error) {
    console.error('Error fetching chat history:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export async function getUserChats(
  userId: string
): Promise<ApiResponse<UserChat[]>> {
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

    const result: Result<UserChat[]> = await response.json()

    if (result.error) {
      return {
        success: false,
        error: result.error,
      }
    }

    return {
      success: true,
      data: result.data!,
    }
  } catch (error) {
    console.error('Error fetching user chats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export async function deleteChat(
  threadId: string
): Promise<ApiResponse<{ message: string }>> {
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

    const result: Result<{ message: string }> = await response.json()

    if (result.error) {
      return {
        success: false,
        error: result.error,
      }
    }

    return {
      success: true,
      data: result.data!,
    }
  } catch (error) {
    console.error('Error deleting chat:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export async function updateChat(
  threadId: string,
  name: string
): Promise<ApiResponse<{ message: string; threadId: string }>> {
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

    const result: Result<{ message: string; threadId: string }> =
      await response.json()

    if (result.error) {
      return {
        success: false,
        error: result.error,
      }
    }

    return {
      success: true,
      data: result.data!,
    }
  } catch (error) {
    console.error('Error updating chat:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export async function sendMessage(
  message: string,
  threadId: string
): Promise<ApiResponse<{ messages: any[]; thread_id: string }>> {
  // This is a legacy function - new code should use the useChat hook for streaming
  try {
    const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/chat/agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: message }],
        config: { thread_id: threadId },
        userId: 'legacy', // This should be replaced with actual user ID
      }),
    })

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
      }
    }

    // For non-streaming, we'll collect all the response
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    const messages: any[] = []

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n').filter((line) => line.trim())

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.slice(6)
            const data = JSON.parse(jsonStr)
            if (data.type === 'stream' && data.message) {
              messages.push(data.message)
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }
    }

    return {
      success: true,
      data: { messages, thread_id: threadId },
    }
  } catch (error) {
    console.error('Error sending message:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
