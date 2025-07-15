"""
Pydantic models for structured agent communication and data validation
"""
from typing import List, Optional, Dict, Any, Annotated
from pydantic import BaseModel, Field
from datetime import datetime

from langgraph.graph.message import add_messages


class AgentState(BaseModel):
    """Core state model for the agent conversation"""
    messages: Annotated[list, add_messages]
    current_task: Optional[str] = None
    context: Dict[str, Any] = Field(default_factory=dict)
    error_count: int = 0
    max_retries: int = 3

class AgentResponse(BaseModel):
    """Structured agent response model"""
    content: str
    used_tools: List[str] = Field(default_factory=list)
    


class EmailMessage(BaseModel):
    """Structured email message model"""
    id: str
    thread_id: str
    subject: str
    sender: str
    recipient: str
    body: str
    timestamp: datetime
    labels: List[str] = Field(default_factory=list)
    is_read: bool = False
    
    
class SlackMessage(BaseModel):
    """Structured Slack message model"""
    channel: str
    text: str
    user: Optional[str] = None
    timestamp: Optional[str] = None
    thread_ts: Optional[str] = None




