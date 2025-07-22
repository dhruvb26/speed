import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import "dotenv/config";

const checkpointer = PostgresSaver.fromConnString(process.env.DATABASE_URL!);

export const getHistory = async (threadId: string) => {
  const readConfig = { configurable: { thread_id: threadId } };

  try {
    const checkpoints = [];
    for await (const checkpoint of checkpointer.list(readConfig)) {
      checkpoints.push(checkpoint);
    }

    const stateHistory = [];
    for await (const state of checkpointer.list(readConfig)) {
      stateHistory.push({
        checkpointId: state.checkpoint.id,
        timestamp: state.checkpoint.ts,
        config: state.config,
        values: state.checkpoint.channel_values,
        metadata: state.metadata,
        parentConfig: state.parentConfig,
        pendingSends: state.checkpoint.pending_sends,
      });
    }

    const messagesValue =
      stateHistory.length > 0 ? stateHistory[0].values?.messages : [];
    const messages = Array.isArray(messagesValue) ? messagesValue : [];

    return {
      threadId,
      checkpointCount: checkpoints.length,
      checkpoints: stateHistory,
      messagesCount: messages.length,
      messages: messages,
    };
  } catch (error) {
    console.error("Error retrieving thread history:", error);
    throw new Error(
      `Failed to get history for thread ${threadId}: ${(error as Error).message}`
    );
  }
};

export const getCheckpoint = async (
  threadId: string,
  checkpointId?: string
) => {
  const config = checkpointId
    ? { configurable: { thread_id: threadId, checkpoint_id: checkpointId } }
    : { configurable: { thread_id: threadId } };

  try {
    const checkpoint = await checkpointer.get(config);
    return {
      threadId,
      checkpointId: checkpointId || "latest",
      checkpoint: checkpoint,
      messages: checkpoint?.channel_values?.messages || [],
    };
  } catch (error) {
    console.error("Error retrieving checkpoint:", error);
    throw new Error(
      `Failed to get checkpoint for thread ${threadId}: ${(error as Error).message}`
    );
  }
};

export const getMessages = async (threadId: string) => {
  try {
    const config = { configurable: { thread_id: threadId } };
    const checkpoint = await checkpointer.get(config);

    return {
      threadId,
      messages: checkpoint?.channel_values?.messages || [],
      lastUpdated: checkpoint?.ts,
    };
  } catch (error) {
    console.error("Error retrieving messages:", error);
    throw new Error(
      `Failed to get messages for thread ${threadId}: ${(error as Error).message}`
    );
  }
};
