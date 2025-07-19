import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { db } from '@/index'
import { organizationsTable, usersTable } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { env } from '@/env'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = env.CLERK_WEBHOOK_SIGNING_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error(
      'Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local'
    )
  }

  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400,
    })
  }

  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, first_name, last_name, email_addresses } = evt.data

    await db.insert(usersTable).values({
      id,
      name: `${first_name} ${last_name}`.trim(),
      email: email_addresses[0].email_address,
    })
  }

  // TODO: Add better error handling

  if (eventType === 'user.updated') {
    try {
      const { id, first_name, last_name, email_addresses } = evt.data

      const updateData: Partial<typeof usersTable.$inferInsert> = {
        name: `${first_name} ${last_name}`.trim(),
        email: email_addresses[0].email_address,
      }

      const existingUser = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, id))

      if (existingUser.length > 0) {
        await db.update(usersTable).set(updateData).where(eq(usersTable.id, id))
      } else {
        await db.insert(usersTable).values({
          id,
          name: `${first_name} ${last_name}`.trim(),
          email: email_addresses[0].email_address,
        })
      }
    } catch (error) {
      console.error('Error updating user:', error)
      return new Response('Error updating user', { status: 500 })
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data

    if (typeof id === 'string') {
      await db.delete(usersTable).where(eq(usersTable.id, id))
    } else {
      console.error('Invalid user ID for deletion:', id)
    }
  }

  if (eventType === 'organization.created') {
    const { id, name, created_by } = evt.data

    await db.insert(organizationsTable).values({
      id,
      name,
      userId: created_by,
    })
  }

  if (eventType === 'organization.deleted') {
    const { id } = evt.data

    if (typeof id === 'string') {
      await db.delete(organizationsTable).where(eq(organizationsTable.id, id))
    } else {
      console.error('Invalid organization ID for deletion:', id)
    }
  }

  return new Response('', { status: 200 })
}
