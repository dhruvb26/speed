import { env } from '@/env'
import { db } from '@/index'
import { integrationsTable } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { v4 as uuid } from 'uuid'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const state = url.searchParams.get('state')

  if (error) {
    console.error('OAuth error:', error)
    return Response.redirect(
      new URL(`/integrations?error=${error}`, request.url)
    )
  }

  if (!code) {
    return Response.redirect(
      new URL('/integrations?error=no_code', request.url)
    )
  }

  if (!state) {
    return Response.redirect(
      new URL('/integrations?error=invalid_state', request.url)
    )
  }

  try {
    // Parse the state parameter to get the user ID
    let userId: string
    try {
      const stateData = JSON.parse(decodeURIComponent(state))
      userId = stateData.userId
    } catch (error) {
      console.error('Invalid state parameter:', error)
      return Response.redirect(
        new URL('/integrations?error=invalid_state', request.url)
      )
    }

    if (!userId) {
      return Response.redirect(
        new URL('/integrations?error=unauthorized', request.url)
      )
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_OAUTH_CLIENT_ID,
        client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
        redirect_uri: `${url.origin}/api/callbacks/gmail`,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token exchange failed:', errorData)
      return Response.redirect(
        new URL('/integrations?error=token_exchange_failed', request.url)
      )
    }

    const tokenData = await tokenResponse.json()
    const {
      access_token,
      refresh_token,
      expires_in,
      refresh_token_expires_in,
    } = tokenData

    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + expires_in * 1000)
    // Google doesn't always provide refresh_token_expires_in, so use a default of 6 months if not provided
    const refreshTokenExpiry = refresh_token_expires_in
      ? new Date(Date.now() + refresh_token_expires_in * 1000)
      : new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000) // 6 months in milliseconds

    // Check if integration already exists
    const existingIntegration = await db
      .select()
      .from(integrationsTable)
      .where(
        and(
          eq(integrationsTable.userId, userId),
          eq(integrationsTable.provider, 'gmail')
        )
      )
      .limit(1)

    if (existingIntegration.length > 0) {
      // Update existing integration
      await db
        .update(integrationsTable)
        .set({
          accessToken: access_token,
          refreshToken: refresh_token,
          tokenExpiry,
          refreshTokenExpiry,
          updatedAt: new Date(),
        })
        .where(eq(integrationsTable.id, existingIntegration[0].id))
    } else {
      // Create new integration
      await db.insert(integrationsTable).values({
        id: uuid(),
        userId,
        provider: 'gmail',
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiry,
        refreshTokenExpiry,
      })
    }

    return Response.redirect(
      new URL('/integrations?gmail=connected', request.url)
    )
  } catch (error) {
    console.error('OAuth callback error:', error)
    return Response.redirect(
      new URL('/integrations?error=server_error', request.url)
    )
  }
}
