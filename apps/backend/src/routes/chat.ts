import { Hono } from "hono";
import { invokeAgentStream } from "@/core/agent";
import { getHistory } from "@/core/checkpoint";
import { createDb } from "@/db";
import {
  chats,
  checkpointBlobs,
  checkpoints,
  checkpointWrites,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { Result } from "@/types/api-response";

const chat = new Hono();

chat.post("/agent", async (c) => {
  try {
    const { messages, config, userId } = await c.req.json();

    c.header("Content-Type", "text/event-stream");
    c.header("Cache-Control", "no-cache");
    c.header("Connection", "keep-alive");
    c.header("Access-Control-Allow-Origin", "*");
    c.header("Access-Control-Allow-Headers", "Cache-Control");

    const db = createDb();

    const existingChat = await db
      .select()
      .from(chats)
      .where(eq(chats.id, config.thread_id));

    if (existingChat.length === 0) {
      await db.insert(chats).values({
        id: config.thread_id,
        name: `Chat - ${new Date().toLocaleString()}`,
        userId,
      });
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const agentStream = await invokeAgentStream(
            { messages },
            {
              configurable: {
                thread_id: config.thread_id,
              },
            }
          );

          for await (const [message, metadata] of agentStream) {
            const data = JSON.stringify({
              type: "stream",
              message: message,
              metadata,
              timestamp: new Date().toISOString(),
            });

            controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
          }

          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ type: "complete" })}\n\n`
            )
          );
          controller.close();
        } catch (error) {
          const errorData = JSON.stringify({
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "An unknown error occurred",
          });
          controller.enqueue(
            new TextEncoder().encode(`data: ${errorData}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    });
  } catch (error) {
    const response: Result<null, string> = {
      data: null,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };

    return c.json(response, 500);
  }
});

chat.get("/:id", async (c) => {
  try {
    const threadId = c.req.param("id");
    const history = await getHistory(threadId);

    const response: Result<typeof history> = {
      data: history,
      error: null,
    };

    return c.json(response);
  } catch (error) {
    const response: Result<null, string> = {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to retrieve chat history",
    };

    return c.json(response, 500);
  }
});

chat.get("/user/:id", async (c) => {
  try {
    const userId = c.req.param("id");
    const db = createDb();

    const chatResults = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId));

    const response: Result<typeof chatResults> = {
      data: chatResults,
      error: null,
    };

    return c.json(response);
  } catch (error) {
    const response: Result<null, string> = {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to retrieve user chats",
    };

    return c.json(response, 500);
  }
});

chat.delete("/:id", async (c) => {
  try {
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

    const response: Result<{ message: string }> = {
      data: { message: "Chat deleted" },
      error: null,
    };

    return c.json(response);
  } catch (error) {
    const response: Result<null, string> = {
      data: null,
      error: error instanceof Error ? error.message : "Failed to delete chat",
    };

    return c.json(response, 500);
  }
});

chat.put("/:id", async (c) => {
  try {
    const threadId = c.req.param("id");
    const { name } = await c.req.json();
    const db = createDb();

    await db.update(chats).set({ name }).where(eq(chats.id, threadId));

    const result = {
      message: "Chat updated successfully",
      threadId,
    };

    const response: Result<typeof result> = {
      data: result,
      error: null,
    };

    return c.json(response);
  } catch (error) {
    const response: Result<null, string> = {
      data: null,
      error: error instanceof Error ? error.message : "Failed to update chat",
    };

    return c.json(response, 500);
  }
});

export default chat;
