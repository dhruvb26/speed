import { Hono } from "hono";
import { createDb } from "@/db";
import { integrationsTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuid } from "uuid";

const auth = new Hono();

auth.get("/callback/gmail", async (c) => {
  const url = new URL(c.req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const state = url.searchParams.get("state");

  if (error) {
    console.error("OAuth error:", error);
    return c.redirect(`/integrations?error=${error}`);
  }

  if (!code) {
    return c.redirect("/integrations?error=no_code");
  }

  if (!state) {
    return c.redirect("/integrations?error=invalid_state");
  }

  try {
    const db = createDb();

    let userId: string;
    try {
      const stateData = JSON.parse(decodeURIComponent(state));
      userId = stateData.userId;
    } catch (error) {
      console.error("Invalid state parameter:", error);
      return c.redirect("/integrations?error=invalid_state");
    }

    if (!userId) {
      return c.redirect("/integrations?error=unauthorized");
    }

    const {
      GOOGLE_OAUTH_CLIENT_ID,
      GOOGLE_OAUTH_CLIENT_SECRET,
      WEB_APP_URL,
    } = c.env as {
      GOOGLE_OAUTH_CLIENT_ID: string;
      GOOGLE_OAUTH_CLIENT_SECRET: string;
      WEB_APP_URL: string;
    };

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_OAUTH_CLIENT_ID,
        client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
        redirect_uri: `${url.origin}/api/auth/callback/gmail`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange failed:", errorData);
      return c.redirect("/integrations?error=token_exchange_failed");
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      refresh_token_expires_in: number;
    };

    const {
      access_token,
      refresh_token,
      expires_in,
      refresh_token_expires_in,
    } = tokenData;

    const tokenExpiry = new Date(Date.now() + expires_in * 1000);
    const refreshTokenExpiry = refresh_token_expires_in
      ? new Date(Date.now() + refresh_token_expires_in * 1000)
      : new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000);

    const existingIntegration = await db
      .select()
      .from(integrationsTable)
      .where(
        and(
          eq(integrationsTable.userId, userId),
          eq(integrationsTable.provider, "gmail")
        )
      )
      .limit(1);

    if (existingIntegration.length > 0) {
      await db
        .update(integrationsTable)
        .set({
          accessToken: access_token,
          refreshToken: refresh_token,
          tokenExpiry,
          refreshTokenExpiry,
          updatedAt: new Date(),
        })
        .where(eq(integrationsTable.id, existingIntegration[0].id));
    } else {
      await db.insert(integrationsTable).values({
        id: uuid(),
        userId,
        provider: "gmail",
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiry,
        refreshTokenExpiry,
      });
    }

    return c.redirect(`${WEB_APP_URL}/integrations?gmail=connected`);
  } catch (error) {
    console.error("OAuth callback error:", error);
  }
});

export default auth;
