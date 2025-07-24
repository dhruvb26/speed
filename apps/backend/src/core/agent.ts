import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import type { BaseMessage } from "@langchain/core/messages";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import pg from "pg";

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

  const multiply = tool(
    async ({ a, b }: { a: number; b: number }) => {
      return a * b;
    },
    {
      name: "multiply",
      description: "Multiply two numbers together",
      schema: z.object({
        a: z.number().describe("first number"),
        b: z.number().describe("second number"),
      }),
    }
  );

  const add = tool(
    async ({ a, b }: { a: number; b: number }) => {
      return a + b;
    },
    {
      name: "add",
      description: "Add two numbers together",
      schema: z.object({
        a: z.number().describe("first number"),
        b: z.number().describe("second number"),
      }),
    }
  );

  const divide = tool(
    async ({ a, b }: { a: number; b: number }) => {
      return a / b;
    },
    {
      name: "divide",
      description: "Divide two numbers",
      schema: z.object({
        a: z.number().describe("first number"),
        b: z.number().describe("second number"),
      }),
    }
  );

  const tools = [add, multiply, divide];
  const toolsByName = Object.fromEntries(
    tools.map((tool) => [tool.name, tool])
  );
  const llmWithTools = llm.bindTools(tools);
  // Nodes
  async function llmCall(state: typeof MessagesAnnotation.State) {
    // LLM decides whether to call a tool or not
    const result = await llmWithTools.invoke([
      {
        role: "system",
        content:
          "You are a helpful assistant tasked with performing arithmetic on a set of inputs.",
      },
      ...state.messages,
    ]);

    return {
      messages: [result],
    };
  }

  const toolNode = new ToolNode(tools);

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
    .addNode("tools", toolNode)
    // Add edges to connect nodes
    .addEdge("__start__", "llmCall")
    .addConditionalEdges("llmCall", shouldContinue, {
      // Name returned by shouldContinue : Name of next node to visit
      Action: "tools",
      __end__: "__end__",
    })
    .addEdge("tools", "llmCall")
    .compile({ checkpointer });

  const result = await agentBuilder.invoke(input, config);

  return result;
}
