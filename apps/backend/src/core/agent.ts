import {
  MessagesAnnotation,
  StateGraph,
  Annotation,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import type { BaseMessage } from "@langchain/core/messages";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { RunnableConfig } from "@langchain/core/runnables";
import pg from "pg";
import {
  initiateComposioConnection,
  getTools,
  checkConnectionStatus,
} from "@/core/tools";

interface InvokeAgentInput {
  messages: BaseMessage[];
}

interface InvokeAgentConfig {
  configurable: {
    thread_id: string;
    userId: string;
  };
}

// Properly merge MessagesAnnotation with custom fields
const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,
  composioConnectionUrl: Annotation<string | null>({
    reducer: (x: string | null, y: string | null) => y ?? x,
    default: () => null,
  }),
  isComposioConnected: Annotation<boolean>({
    reducer: (x: boolean, y: boolean) => y ?? x,
    default: () => false,
  }),
});

async function createAgentBuilder() {
  const { Pool } = pg;

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
  });

  const checkpointer = new PostgresSaver(pool);
  await checkpointer.setup();

  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
    apiKey: process.env.OPENAI_API_KEY!,
  });

  async function checkComposioConnection(
    state: typeof AgentState.State,
    config?: RunnableConfig
  ) {
    const userId = config?.configurable?.userId;
    if (!userId) {
      return {
        isComposioConnected: false,
        messages: [
          {
            role: "assistant",
            content:
              "Error: No user ID provided for Composio connection check.",
          },
        ],
      };
    }

    try {
      const isConnected = await checkConnectionStatus(userId, "gmail");
      return { isComposioConnected: isConnected };
    } catch (error) {
      console.error("❌ Error checking Composio connection:", error);
      return { isComposioConnected: false };
    }
  }

  // Initiate Composio connection node
  async function initiateConnection(
    state: typeof AgentState.State,
    config?: RunnableConfig
  ) {
    const userId = config?.configurable?.userId;
    if (!userId) {
      return {
        messages: [
          {
            role: "assistant",
            content: "Error: No user ID provided for connection initiation.",
          },
        ],
      };
    }

    try {
      const connectionUrl = await initiateComposioConnection(userId, "gmail");
      return {
        composioConnectionUrl: connectionUrl,
        messages: [
          {
            role: "assistant",
            content: `To enable Gmail integration, please visit the following URL to authorize access:\n\n${connectionUrl}\n\nOnce you've completed the authorization, you can use Gmail-related commands.`,
          },
        ],
      };
    } catch (error) {
      console.error("Error initiating connection:", error);
      return {
        messages: [
          {
            role: "assistant",
            content:
              "Sorry, I encountered an error while trying to set up Gmail integration. Please try again later.",
          },
        ],
      };
    }
  }

  // Main LLM call with tools
  async function llmCall(
    state: typeof AgentState.State,
    config?: RunnableConfig
  ) {
    const userId = config?.configurable?.userId;
    let tools: any[] = [];

    // Get Gmail tools if connected
    if (state.isComposioConnected && userId) {
      try {
        const gmailTools = await getTools(userId, ["gmail"]);
        tools = gmailTools;
      } catch (error) {
        console.error("Error getting Gmail tools:", error);
      }
    }

    const llmWithTools = llm.bindTools(tools);

    const result = await llmWithTools.invoke([
      {
        role: "system",
        content: state.isComposioConnected
          ? "You are a helpful assistant with access to Gmail tools. You can help users read, search, and manage their Gmail messages."
          : "You are a helpful assistant. Note: Gmail integration is not currently available - if the user asks for Gmail-related tasks, suggest they authorize the connection first by asking for 'gmail setup'.",
      },
      ...state.messages,
    ]);

    return {
      messages: [result],
    };
  }

  // Tool execution node
  async function executeTools(
    state: typeof AgentState.State,
    config?: RunnableConfig
  ) {
    const userId = config?.configurable?.userId;
    if (!userId || !state.isComposioConnected) {
      return {
        messages: [
          {
            role: "assistant",
            content:
              "Gmail tools are not available. Please set up Gmail integration first.",
          },
        ],
      };
    }

    try {
      const gmailTools = await getTools(userId, ["gmail"]);
      const toolNode = new ToolNode(gmailTools);
      return await toolNode.invoke(state);
    } catch (error) {
      console.error("Error executing tools:", error);
      return {
        messages: [
          {
            role: "assistant",
            content:
              "Sorry, I encountered an error while trying to execute the Gmail tool.",
          },
        ],
      };
    }
  }

  // Conditional edge function
  function shouldContinue(state: typeof AgentState.State) {
    const messages = state.messages;
    const lastMessage = messages.at(-1);

    if (
      lastMessage &&
      "tool_calls" in lastMessage &&
      Array.isArray(lastMessage.tool_calls) &&
      lastMessage.tool_calls?.length
    ) {
      return "executeTools";
    }
    return "__end__";
  }

  // Router function to determine next step
  function routeConnection(state: typeof AgentState.State) {
    const lastMessage = state.messages.at(-1);
    const messageContent =
      typeof lastMessage?.content === "string"
        ? lastMessage.content.toLowerCase()
        : "";

    // Check if user is asking for Gmail setup
    if (
      messageContent.includes("gmail") &&
      (messageContent.includes("setup") ||
        messageContent.includes("connect") ||
        messageContent.includes("authorize"))
    ) {
      return "initiateConnection";
    }

    // If already connected, proceed to LLM
    if (state.isComposioConnected) {
      return "llmCall";
    }

    // If NOT connected and asking about Gmail, suggest connection
    if (
      !state.isComposioConnected &&
      (messageContent.includes("gmail") || messageContent.includes("email"))
    ) {
      return "initiateConnection";
    }

    // Default to LLM call
    return "llmCall";
  }

  // Build workflow
  return new StateGraph(AgentState)
    .addNode("checkConnection", checkComposioConnection)
    .addNode("initiateConnection", initiateConnection)
    .addNode("llmCall", llmCall)
    .addNode("executeTools", executeTools)
    .addEdge("__start__", "checkConnection")
    .addConditionalEdges("checkConnection", routeConnection, {
      initiateConnection: "initiateConnection",
      llmCall: "llmCall",
    })
    .addEdge("initiateConnection", "__end__")
    .addConditionalEdges("llmCall", shouldContinue, {
      executeTools: "executeTools",
      __end__: "__end__",
    })
    .addEdge("executeTools", "llmCall")
    .compile({ checkpointer });
}

export async function invokeAgentStream(
  input: InvokeAgentInput,
  config: InvokeAgentConfig
) {
  const agentBuilder = await createAgentBuilder();

  return agentBuilder.stream(input, {
    streamMode: "messages",
    ...config,
  });
}
