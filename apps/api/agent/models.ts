/**
 * TypeScript interfaces for structured agent communication and data validation
 */

import { Annotation } from "@langchain/langgraph";

export const AgentState = Annotation.Root({
  messages: Annotation<any[]>({
    reducer: (x, y) => x.concat(y),
  }),
  currentTask: Annotation<string>(),
  context: Annotation<Record<string, any>>(),
  errorCount: Annotation<number>(),
  maxRetries: Annotation<number>(),
});

export interface AgentStateInterface {
  messages: any[]; // Will be LangChain messages
  currentTask?: string;
  context: Record<string, any>;
  errorCount: number;
  maxRetries: number;
}

export interface AgentResponse {
  content: string;
  usedTools: string[];
}

export interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  sender: string;
  recipient: string;
  body: string;
  timestamp: Date;
  labels: string[];
  isRead: boolean;
}



export interface GmailAuthHeaders {
  Authorization: string;
  'Content-Type': string;
  [key: string]: string;
}

export interface GmailListParams {
  maxResults: number;
  q?: string;
}

export interface GmailMessageResponse {
  messages?: Array<{ id: string; threadId: string }>;
}

export interface GmailMessageDetails {
  id: string;
  threadId: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    parts?: Array<{
      mimeType: string;
      body: { data?: string };
    }>;
    body?: { data?: string };
  };
  labelIds: string[];
  internalDate: string;
}

