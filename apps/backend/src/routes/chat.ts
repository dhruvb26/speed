import { Hono } from "hono";
import { invokeAgent } from "@/core/agent";
import { getHistory } from "@/core/checkpoint";
import { createDb } from "@/db";
import {
  chats,
  checkpointBlobs,
  checkpoints,
  checkpointWrites,
} from "@/db/schema";
import { eq } from "drizzle-orm";

const chat = new Hono();

chat.post("/agent", async (c) => {
  const { messages, config, userId } = await c.req.json();
  const result = await invokeAgent(
    { messages },
    {
      configurable: {
        thread_id: config.thread_id,
      },
    }
  );

  const db = createDb();
  const existingChat = await db
    .select()
    .from(chats)
    .where(eq(chats.id, config.thread_id));
  if (existingChat.length === 0) {
    await db.insert(chats).values({
      id: config.thread_id,
      name: "New Chat",
      userId,
    });
  }

  return c.json(result);
});

chat.get("/:id", async (c) => {
  const threadId = c.req.param("id");
  const history = await getHistory(threadId);
  return c.json(history);
});

chat.get("/user/:id", async (c) => {
  const userId = c.req.param("id");
  const db = createDb();

  const chatResults = await db
    .select()
    .from(chats)
    .where(eq(chats.userId, userId));
  return c.json(chatResults);
});

chat.delete("/:id", async (c) => {
  const threadId = c.req.param("id");
  const db = createDb();
  await db.delete(chats).where(eq(chats.id, threadId));

  await db
    .delete(checkpointWrites)
    .where(eq(checkpointWrites.threadId, threadId));
  await db
    .delete(checkpointBlobs)
    .where(eq(checkpointBlobs.threadId, threadId));
  await db.delete(checkpoints).where(eq(checkpoints.threadId, threadId));

  return c.json({ message: "Chat deleted" });
});

chat.put("/:id", async (c) => {
  const threadId = c.req.param("id");
  const { name } = await c.req.json();
  const db = createDb();
  await db.update(chats).set({ name }).where(eq(chats.id, threadId));
  return c.json({ message: "Chat updated" });
});

export default chat;
