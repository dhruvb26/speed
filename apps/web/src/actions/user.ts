'use server'
import { db } from '@/index'
import { usersTable } from '@/db/schema'
import { auth } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'

export async function getUser() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const user = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      usage: usersTable.usage,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))

  return user[0]
}
