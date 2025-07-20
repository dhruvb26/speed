import { Hono } from "hono";
import { Webhook } from "svix";
import { createDb } from "@/db";
import { organizationsTable, usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";

const webhooks = new Hono();

webhooks.post("/clerk", async (c) => {
  const { CLERK_WEBHOOK_SIGNING_SECRET } = c.env as {
    CLERK_WEBHOOK_SIGNING_SECRET: string;
  };

  if (!CLERK_WEBHOOK_SIGNING_SECRET) {
    throw new Error(
      "Please add CLERK_WEBHOOK_SIGNING_SECRET to your environment variables"
    );
  }

  const svix_id = c.req.header("svix-id");
  const svix_timestamp = c.req.header("svix-timestamp");
  const svix_signature = c.req.header("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return c.text("Error occurred -- no svix headers", 400);
  }

  const payload = await c.req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(CLERK_WEBHOOK_SIGNING_SECRET);

  let evt: any;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return c.text("Error occurred", 400);
  }

  const db = createDb();
  const eventType = evt.type;

  try {
    if (eventType === "user.created") {
      const { id, first_name, last_name, email_addresses } = evt.data;

      await db.insert(usersTable).values({
        id,
        name: `${first_name} ${last_name}`.trim(),
        email: email_addresses[0].email_address,
      });
    }

    if (eventType === "user.updated") {
      const { id, first_name, last_name, email_addresses } = evt.data;

      const updateData: Partial<typeof usersTable.$inferInsert> = {
        name: `${first_name} ${last_name}`.trim(),
        email: email_addresses[0].email_address,
      };

      const existingUser = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, id));

      if (existingUser.length > 0) {
        await db
          .update(usersTable)
          .set(updateData)
          .where(eq(usersTable.id, id));
      } else {
        await db.insert(usersTable).values({
          id,
          name: `${first_name} ${last_name}`.trim(),
          email: email_addresses[0].email_address,
        });
      }
    }

    if (eventType === "user.deleted") {
      const { id } = evt.data;

      if (typeof id === "string") {
        await db.delete(usersTable).where(eq(usersTable.id, id));
      } else {
        console.error("Invalid user ID for deletion:", id);
      }
    }

    if (eventType === "organization.created") {
      const { id, name, created_by } = evt.data;

      await db.insert(organizationsTable).values({
        id,
        name,
        userId: created_by,
      });
    }

    if (eventType === "organization.deleted") {
      const { id } = evt.data;

      if (typeof id === "string") {
        await db
          .delete(organizationsTable)
          .where(eq(organizationsTable.id, id));
      } else {
        console.error("Invalid organization ID for deletion:", id);
      }
    }
  } catch (error) {
    console.error("Database error in webhook:", error);
    return c.text("Database error occurred", 500);
  }

  return c.text("", 200);
});

export default webhooks;
