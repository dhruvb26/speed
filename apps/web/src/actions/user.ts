'use server'

import { auth } from '@clerk/nextjs/server'
import { env } from '@/env'
import type { User, Result, ApiResponse } from '@/types'

export async function getUser(): Promise<ApiResponse<User>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    const response = await fetch(
      `${env.NEXT_PUBLIC_API_URL}/api/user/${userId}`,
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

    const result: Result<User> = await response.json()

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
    console.error('Error fetching user:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
