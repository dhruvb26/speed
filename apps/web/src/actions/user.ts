'use server'
import { auth } from '@clerk/nextjs/server'
import { env } from '@/env'

export async function getUser() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const response = await fetch(`${env.BACKEND_URL}/api/user/${userId}`)
  const data = await response.json()

  return data
}
