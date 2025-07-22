'use server'

import { v4 as uuid } from 'uuid'
import { env } from '@/env'
import { auth } from '@clerk/nextjs/server'
import type {
  ChatMessage,
  SendMessageRequest,
  SendMessageResponse,
  ChatHistoryResponse,
  UserChat,
  Result,
  ApiResponse,
} from '@/types'

export async function sendMessage(
  userMessage: string,
  threadId?: string
): Promise<ApiResponse<SendMessageResponse>> {
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

    const result: Result<SendMessageResponse> = await response.json()

    if (result.error) {
      return {
        success: false,
        error: result.error,
      }
    }

    const finalResponseData = {
      ...result.data!,
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
