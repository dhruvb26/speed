import { createDb } from "@/db";
import { usersTable } from "@/db/schema";
import { Hono } from "hono";
import { eq } from "drizzle-orm";

const user = new Hono();

user.get("/:id", async (c) => {
  const { id } = c.req.param();

  try {
    const db = createDb();

    const userData = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        usage: usersTable.usage,
      })
      .from(usersTable)
      .where(eq(usersTable.id, id));

    if (!userData[0]) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json(userData[0]);
  } catch (error) {
    console.error("Error fetching user:", error);
    return c.json({ error: "Failed to fetch user" }, 500);
  }
});

export default user;
