"""
Pydantic AI compatible tools for Gmail and Slack integration
"""
import os
import base64
import requests
from typing import List, Optional, Dict, Any
from email.mime.text import MIMEText
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from slack_sdk import WebClient
from pydantic import BaseModel
from datetime import datetime
from models import EmailMessage, SlackMessage


class GmailTools:
    """Gmail API tools with proper authentication and error handling"""
    
    def __init__(self, token_path: str = "../utils/gmail/token.json"):
        self.token_path = token_path
        self.base_url = "https://gmail.googleapis.com"
    
    def _get_auth_headers(self) -> Dict[str, str]:
        """Get authentication headers for Gmail API"""
        if not os.path.exists(self.token_path):
            raise ValueError(f"Token file not found at {self.token_path}")
        
        creds = Credentials.from_authorized_user_file(self.token_path)
        
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            with open(self.token_path, 'w') as token:
                token.write(creds.to_json())
        
        return {
            "Authorization": f"Bearer {creds.token}",
            "Content-Type": "application/json"
        }
    
    def list_emails(self, max_results: int = 10, query: Optional[str] = None) -> List[EmailMessage]:
        """List emails with structured output"""
        try:
            url = f"{self.base_url}/gmail/v1/users/me/messages"
            headers = self._get_auth_headers()
            params = {"maxResults": max_results}
            
            if query:
                params["q"] = query
                
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()
            
            emails = []
            for message in data.get("messages", []):
                email_details = self.get_email_details(message["id"])
                if email_details:
                    emails.append(email_details)
            
            return emails
        except Exception as e:
            raise RuntimeError(f"Failed to list emails: {str(e)}")
    
    def get_email_details(self, message_id: str) -> Optional[EmailMessage]:
        """Get detailed email information as structured data"""
        try:
            url = f"{self.base_url}/gmail/v1/users/me/messages/{message_id}"
            headers = self._get_auth_headers()
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            payload = data.get("payload", {})
            headers_list = payload.get("headers", [])
            
            # Extract email components
            subject = ""
            sender = ""
            recipient = ""
            
            for header in headers_list:
                name = header.get("name", "").lower()
                if name == "subject":
                    subject = header.get("value", "")
                elif name == "from":
                    sender = header.get("value", "")
                elif name == "to":
                    recipient = header.get("value", "")
            
            # Extract body (simplified)
            body = self._extract_body(payload)
            
            # Convert Gmail timestamp (milliseconds) to datetime
            timestamp_ms = int(data.get("internalDate", "0"))
            timestamp = datetime.fromtimestamp(timestamp_ms / 1000) if timestamp_ms > 0 else datetime.now()
            
            return EmailMessage(
                id=message_id,
                thread_id=data.get("threadId", ""),
                subject=subject,
                sender=sender,
                recipient=recipient,
                body=body,
                timestamp=timestamp,
                labels=data.get("labelIds", []),
                is_read="UNREAD" not in data.get("labelIds", [])
            )
        except Exception as e:
            print(f"Error getting email details: {e}")
            return None
    
    def _extract_body(self, payload: Dict[str, Any]) -> str:
        """Extract email body from payload"""
        if "parts" in payload:
            for part in payload["parts"]:
                if part.get("mimeType") == "text/plain":
                    body_data = part.get("body", {}).get("data")
                    if body_data:
                        return base64.urlsafe_b64decode(body_data).decode('utf-8')
        else:
            body_data = payload.get("body", {}).get("data")
            if body_data:
                return base64.urlsafe_b64decode(body_data).decode('utf-8')
        return ""
    
    def send_email(self, to: str, subject: str, body: str) -> Dict[str, Any]:
        """Send email with proper error handling"""
        try:
            message = MIMEText(body)
            message['to'] = to
            message['subject'] = subject
            
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
            
            url = f"{self.base_url}/gmail/v1/users/me/messages/send"
            headers = self._get_auth_headers()
            data = {"raw": raw_message}
            
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise RuntimeError(f"Failed to send email: {str(e)}")


class SlackTools:
    """Slack API tools with proper authentication and error handling"""
    
    def __init__(self):
        token = os.getenv("SLACK_BOT_TOKEN")
        if not token:
            raise ValueError("SLACK_BOT_TOKEN environment variable not found")
        self.client = WebClient(token=token)
    
    def list_channels(self) -> List[Dict[str, Any]]:
        """List all channels in workspace"""
        try:
            response = self.client.conversations_list(
                types="public_channel,private_channel",
                exclude_archived=True
            )
            return response.get("channels", [])
        except Exception as e:
            raise RuntimeError(f"Failed to list channels: {str(e)}")
    
    def send_message(self, channel: str, text: str, thread_ts: Optional[str] = None) -> SlackMessage:
        """Send message to Slack channel"""
        try:
            response = self.client.chat_postMessage(
                channel=channel,
                text=text,
                thread_ts=thread_ts
            )
            
            return SlackMessage(
                channel=channel,
                text=text,
                user=response.get("message", {}).get("user"),
                timestamp=response.get("ts"),
                thread_ts=thread_ts
            )
        except Exception as e:
            raise RuntimeError(f"Failed to send message: {str(e)}")
    
    def get_channel_history(self, channel: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent messages from a channel"""
        try:
            response = self.client.conversations_history(
                channel=channel,
                limit=limit
            )
            return response.get("messages", [])
        except Exception as e:
            raise RuntimeError(f"Failed to get channel history: {str(e)}")


# Initialize tool instances
gmail_tools = GmailTools()
slack_tools = SlackTools()