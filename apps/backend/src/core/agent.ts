import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import type { BaseMessage } from "@langchain/core/messages";
import { ToolMessage, AIMessage } from "@langchain/core/messages";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { Composio } from '@composio/core';
import { LangchainProvider } from '@composio/langchain';
import { authenticateUserForToolkit } from '../utils/composio_tools';
import pg from "pg";
import fs from "fs";
import "dotenv/config";

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new LangchainProvider(),
});

const gmailTools = await composio.tools.get("user_308BwV2pzGvbyVgD28IXAw8GTdp", { toolkits: ['GMAIL'] });
const googleDriveTools = await composio.tools.get("user_308BwV2pzGvbyVgD28IXAw8GTdp", { toolkits: ['GOOGLEDRIVE'] });
const tools = [...gmailTools, ...googleDriveTools];


interface InvokeAgentInput {
  messages: BaseMessage[];
}

interface InvokeAgentConfig {
  configurable: {
    thread_id: string;
  };
}

export async function invokeAgent(
  input: InvokeAgentInput,
  config: InvokeAgentConfig,
  userId: string
) {
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

  const llmWithTools = llm.bindTools(tools);

  // Custom tool node that handles authentication errors
  async function customToolNode(state: typeof MessagesAnnotation.State) {
    const messages = state.messages;
    const lastMessage = messages.at(-1);

    if (!lastMessage || !("tool_calls" in lastMessage) || !lastMessage.tool_calls) {
      return { messages: [] };
    }

    const toolResults: ToolMessage[] = [];

    // Execute tools using the default ToolNode first
    const defaultToolNode = new ToolNode(tools);
    const toolResult: any = await defaultToolNode.invoke(state);
    console.log(toolResult)

    // Check if any tool result contains "No connected accounts found" error
    const resultMessages = toolResult?.messages || [];
    if (Array.isArray(resultMessages) && resultMessages.length > 0) {
      for (const message of resultMessages) {
        if (message instanceof ToolMessage && 
            typeof message.content === 'string' &&
            message.content.includes("No connected accounts found")) {
          
          // Extract the entityId from the original tool call or use a default
          const entityId = userId; // This should be extracted from your user context

          // get the toolkit from the tool name
          console.log(message.content)
          const toolkit = message.name?.split("_")[0];
          
          try {
            // Call the authentication function for GMAIL toolkit
            const redirectUrl = await authenticateUserForToolkit(entityId, "GMAIL", config.configurable.thread_id);
            
            // Create a new tool message with authentication instructions
            const authMessage = new ToolMessage({
              content: `Authentication required. Please visit this URL to connect your Gmail account: ${redirectUrl}. After authentication, please try your request again.`,
              tool_call_id: message.tool_call_id,
              name: message.name || "authentication_required"
            });
            
            toolResults.push(authMessage);
          } catch (error) {
            // If authentication setup fails, return the original error with additional context
            const errorMessage = new ToolMessage({
              content: `${message.content}\n\nAdditionally, failed to set up authentication: ${error instanceof Error ? error.message : 'Unknown error'}`,
              tool_call_id: message.tool_call_id,
              name: message.name || "error"
            });
            
            toolResults.push(errorMessage);
          }
        } else {
          // For successful tool calls or other errors, return as-is
          toolResults.push(message as ToolMessage);
        }
      }
    }

    return { messages: toolResults };
  }

  // Nodes
  async function llmCall(state: typeof MessagesAnnotation.State) {
    // LLM decides whether to call a tool or not
    const result = await llmWithTools.invoke([
      {
        role: "system",
        content:
          "You are a helpful assistant.",
      },
      ...state.messages,
    ]);

    return {
      messages: [result],
    };
  }

  // Conditional edge function to route to the tool node or end
  function shouldContinue(state: typeof MessagesAnnotation.State) {
    const messages = state.messages;
    const lastMessage = messages.at(-1);

    // If the LLM makes a tool call, then perform an action
    if (
      lastMessage &&
      "tool_calls" in lastMessage &&
      Array.isArray(lastMessage.tool_calls) &&
      lastMessage.tool_calls?.length
    ) {
      return "Action";
    }
    // Otherwise, we stop (reply to the user)
    return "__end__";
  }

  // Build workflow
  const agentBuilder = new StateGraph(MessagesAnnotation)
    .addNode("llmCall", llmCall)
    .addNode("tools", customToolNode)
    // Add edges to connect nodes
    .addEdge("__start__", "llmCall")
    .addEdge("tools", "llmCall")
    .addConditionalEdges("llmCall", shouldContinue, {
      // Name returned by shouldContinue : Name of next node to visit
      Action: "tools",
      __end__: "__end__",
    })
    
    .compile({ checkpointer });

  const result = await agentBuilder.invoke(input, config);
  console.log(result)
  return result;
}
