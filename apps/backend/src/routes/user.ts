import { createDb } from "@/db";
import { usersTable } from "@/db/schema";
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import type { Result } from "@/types/api-response";
import type { User } from "@/types/user";

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
      return c.json<Result<never, string>>(
        {
          data: null,
          error: "User not found",
        },
        404
      );
    }

    return c.json<Result<User, never>>({
      data: userData[0],
      error: null,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return c.json<Result<never, string>>(
      {
        data: null,
        error: "Failed to fetch user",
      },
      500
    );
  }
});

export default user;
