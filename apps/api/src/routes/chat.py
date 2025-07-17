from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
import json
import asyncio
import logging
import sys
import os

# Add the parent directory to the path so we can import the agent module
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from agent.langgraph.agent import graph
from langchain_core.messages import HumanMessage

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatMessage(BaseModel):
    message: str
    thread_id: Optional[str] = "default"

class ChatResponse(BaseModel):
    response: str
    thread_id: str
    status: str = "success"

@router.post("/send")
async def send_message(chat_message: ChatMessage):
    """
    Send a message to the agent and get a response
    
    Args:
        chat_message: The message to send to the agent
        
    Returns:
        Agent response
    """
    try:
        # Create configuration with thread ID for conversation continuity
        config = {"configurable": {"thread_id": chat_message.thread_id}}
        
        # Send message to the agent graph
        result = await graph.ainvoke(
            {"messages": [HumanMessage(content=chat_message.message)]},
            config
        )
        
        # Extract the response from the agent
        if result and "messages" in result and result["messages"]:
            last_message = result["messages"][-1]
            response_content = last_message.content
        else:
            response_content = "I'm sorry, I couldn't process your message."
        
        return ChatResponse(
            response=response_content,
            thread_id=chat_message.thread_id,
            status="success"
        )
        
    except Exception as e:
        logging.error(f"Error processing chat message: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process message: {str(e)}"
        )

@router.post("/stream")
async def stream_chat(chat_message: ChatMessage):
    """
    Stream chat responses from the agent
    
    Args:
        chat_message: The message to send to the agent
        
    Returns:
        Streaming response with agent updates
    """
    async def generate_response():
        try:
            config = {"configurable": {"thread_id": chat_message.thread_id}}
            
            # Stream the agent's response
            async for event in graph.astream(
                {"messages": [HumanMessage(content=chat_message.message)]},
                config,
                stream_mode="values",
            ):
                if "messages" in event and event["messages"]:
                    last_message = event["messages"][-1]
                    if hasattr(last_message, 'content'):
                        chunk = {
                            "content": last_message.content,
                            "thread_id": chat_message.thread_id,
                            "type": "message"
                        }
                        yield f"data: {json.dumps(chunk)}\n\n"
            
            # Send completion signal
            completion_chunk = {
                "content": "",
                "thread_id": chat_message.thread_id,
                "type": "complete"
            }
            yield f"data: {json.dumps(completion_chunk)}\n\n"
            
        except Exception as e:
            error_chunk = {
                "content": f"Error: {str(e)}",
                "thread_id": chat_message.thread_id,
                "type": "error"
            }
            yield f"data: {json.dumps(error_chunk)}\n\n"
    
    return StreamingResponse(
        generate_response(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
        }
    )

@router.get("/health")
async def chat_health():
    """
    Check chat service health
    
    Returns:
        Health status of the chat service
    """
    try:
        return {
            "status": "healthy",
            "message": "Chat service is running",
            "endpoints": {
                "send": "/chat/send",
                "stream": "/chat/stream",
                "health": "/chat/health"
            }
        }
    except Exception as e:
        logging.error(f"Error checking chat health: {e}")
        raise HTTPException(status_code=500, detail="Chat service health check failed")

@router.get("/threads/{thread_id}")
async def get_thread_info(thread_id: str):
    """
    Get information about a specific chat thread
    
    Args:
        thread_id: The ID of the thread to get info for
        
    Returns:
        Thread information
    """
    try:
       
        return {
            "thread_id": thread_id,
            "status": "active",
            "message": f"Thread {thread_id} is ready for messages"
        }
    except Exception as e:
        logging.error(f"Error getting thread info: {e}")
        raise HTTPException(status_code=500, detail="Failed to get thread information") 