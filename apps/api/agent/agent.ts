// agent.mts - TypeScript agent with Gmail and Slack tools

import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { allTools } from "./tools.js";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { END, START, StateGraph } from "@langchain/langgraph";
import { RunnableConfig } from "@langchain/core/runnables";
import { AgentState, AgentStateInterface } from "./models.js";

const memory = new MemorySaver();


const toolNode = new ToolNode(allTools);

const model = new ChatOpenAI({ model: "gpt-4o-mini" });

const boundModel = model.bindTools(allTools);



const routeMessage = (state: AgentStateInterface) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1] as AIMessage;
  // If no tools are called, we can finish (respond to the user)
  if (!lastMessage.tool_calls?.length) {
    return END;
  }
  // Otherwise if there is, we continue and call the tools
  return "tools";
};

const callModel = async (
  state: AgentStateInterface,
  config?: RunnableConfig,
) => {
  const { messages } = state;
  const response = await boundModel.invoke(messages, config);
  return { messages: [response] };
};

const workflow = new StateGraph(AgentState)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", routeMessage)
  .addEdge("tools", "agent");

const graph = workflow.compile();

const persistentGraph = workflow.compile({ checkpointer: memory });


const config = { configurable: { thread_id: "conversation-21" } };


const runAgent = async (userInput: string) => {
  let finalMessages;
  for await (
    const { messages } of await persistentGraph.stream({ messages: [new HumanMessage(userInput)] }, {
      ...config,
      streamMode: "values",
    })
  ) {
    finalMessages = messages;
  }
  
  if (!finalMessages || finalMessages.length === 0) {
    return "I'm sorry, I couldn't process your request.";
  }
  console.log(finalMessages);
  return finalMessages[finalMessages.length - 1].content;
};

const startConversation = async () => {
  try {
    console.log("Assistant: Hello! What can I help you with today?");
    
    // Start conversation loop
    while (true) {
      // Get user input
      const userInput = await new Promise<string>((resolve) => {
        process.stdout.write("User: ");
        process.stdin.once('data', data => resolve(data.toString().trim()));
      });

      // Check for exit commands
      if (["quit", "exit", "bye"].includes(userInput.toLowerCase())) {
        console.log("Assistant: Goodbye! Have a great day!");
        break;
      }

      // Get agent response
      const response = await runAgent(userInput);
      console.log("Assistant:", response);
    }
  } catch (error) {
    console.error("Error in conversation:", error);
  } finally {
    process.exit(0);
  }
};

startConversation();

