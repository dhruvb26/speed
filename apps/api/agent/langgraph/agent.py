from pydantic_ai import Agent
from tools import gmail_tools
from langgraph.graph import StateGraph, START, END
from models import AgentState, AgentResponse
import asyncio
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import AIMessage, HumanMessage

# Create global memory instance
memory = MemorySaver()


def create_pydantic_agent():
    """Create a comprehensive helpful assistant agent with email and Slack capabilities"""
    agent = Agent(
        model="gpt-4o-mini",
        output_type=AgentResponse,
        tools=[
            gmail_tools.list_emails, 
            gmail_tools.get_email_details, 
            gmail_tools.send_email,
            # slack_tools.send_message, 
            # slack_tools.list_channels, 
            # slack_tools.get_channel_history
        ],
        system_prompt="""You are a helpful assistant that can assist with a wide variety of tasks. 
        You can answer questions, help with problem-solving, provide explanations, offer advice, 
        and engage in general conversation. You aim to be helpful, harmless, and honest in all interactions.
        
        You also have access to email and messaging capabilities:
        - Gmail: List, read, and send emails
        - Slack: Send messages, list channels, and read channel history
        
        Use these tools ONLY when the user specifically requests email or messaging functionality.
        For general questions and conversations, respond directly without using any tools.
        
        Examples of when to use tools:
        - "Check my emails" or "List my recent emails" → use Gmail tools
        - "Send an email to..." → use Gmail send tool
        - "Send a Slack message to..." → use Slack tools
        - "What channels are available?" → use Slack list channels
        
        Examples of when NOT to use tools:
        - "What's the weather?" → answer directly
        - "Help me write code" → answer directly
        - "Explain quantum physics" → answer directly""",
    )
    return agent


async def agent_node(state: AgentState):
    """Core agent processing node"""
    try:
        # Get the PydanticAI agent
        agent = create_pydantic_agent()
        
        # Build conversation context from all messages
        if state.messages:
            # Convert the full conversation history to a format PydanticAI can understand
            conversation_context = []
            for msg in state.messages:
                if isinstance(msg, HumanMessage):
                    conversation_context.append(f"User: {msg.content}")
                elif isinstance(msg, AIMessage):
                    conversation_context.append(f"Assistant: {msg.content}")
            
            # Create a comprehensive prompt with full context
            full_context = "\n".join(conversation_context)
            
            # Get the current user query (last message)
            last_message = state.messages[-1]
            if isinstance(last_message, HumanMessage):
                current_query = last_message.content
            else:
                current_query = "Continue the conversation"
            
            # Create the task with full conversation context
            task = f"""Here is our conversation so far:

{full_context}

Please respond to the most recent user message: "{current_query}"

Remember to use the context from our conversation history to provide a helpful response."""
        else:
            task = state.current_task or "What can I help you with today?"
        
        # Run the agent with full context
        result = await agent.run(task)
        
        # Return the assistant message as AIMessage for proper LangGraph handling
        # Extract content from AgentResponse properly
        if isinstance(result, AgentResponse):
            content = result.content
        elif hasattr(result, 'content'):
            content = result.content
        else:
            content = str(result)
            
        return {
            "messages": [AIMessage(content=content)]
        }
        
    except Exception as e:
        # Return error as assistant message
        return {
            "messages": [AIMessage(
                content=f"Agent error: {str(e)}"
            )]
        }


def create_langgraph_workflow():
    """Create the LangGraph workflow with start -> agent -> end"""
    
    workflow = StateGraph(AgentState)
    
    # Add the agent node
    workflow.add_node("agent", agent_node)
    
    # Define the flow: START -> agent -> END
    workflow.add_edge(START, "agent")
    workflow.add_edge("agent", END)
    
    # Compile the graph with the global memory checkpointer
    return workflow.compile(checkpointer=memory)


# Create the global graph instance
graph = create_langgraph_workflow()


async def stream_graph_updates(user_input: str, config: dict):
    """Async version of stream_graph_updates"""
    events = graph.astream(
        {"messages": [HumanMessage(content=user_input)]},
        config,
        stream_mode="values",
    )
    async for event in events:
        if "messages" in event and event["messages"] and isinstance(event["messages"][-1], AIMessage):
            last_message = event["messages"][-1]
            print("Assistant:", last_message.content)


async def main():
    """Main execution function with interactive loop"""
    config = {"configurable": {"thread_id": "1"}}
    
    while True:
        try:
            user_input = input("User: ")
            if user_input.lower() in ["quit", "exit", "q"]:
                print("Goodbye!")
                break

            await stream_graph_updates(user_input, config)
        except KeyboardInterrupt:
            print("\nGoodbye!")
            break
        except EOFError:
            # fallback if input() is not available
            user_input = "What do you know about LangGraph?"
            print("User: " + user_input)
            await stream_graph_updates(user_input, config)
            break


if __name__ == "__main__":
    asyncio.run(main())