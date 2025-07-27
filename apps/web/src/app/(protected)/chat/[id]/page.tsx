'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import {
  sendMessage,
  getChatHistory,
} from '@/actions/chat'
import type {
  LangGraphMessage,
  LangChainMessage,
} from '@/types/chat'
import { cn } from '@/lib/utils'
import Loader from '@/components/global/loader'
import { MessageForm } from '@/components/ui/message-form'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const convertLangGraphMessages = (
  lgMessages: LangGraphMessage[]
): Message[] => {
  return lgMessages
    .filter((lgMessage) => {
      // Filter out tool calls and tool messages
      const messageType = lgMessage.id && lgMessage.id[2]
      const isToolMessage = messageType === 'ToolMessage'
      const hasToolCalls = lgMessage.kwargs.tool_calls && lgMessage.kwargs.tool_calls.length > 0
      const hasContent = lgMessage.kwargs.content && lgMessage.kwargs.content.trim() !== ''
      
      // Filter out tool messages and messages that are just tool calls
      if (isToolMessage || hasToolCalls) {
        return false
      }
      
      // Only show messages with actual content
      return hasContent
    })
    .map((lgMessage) => {
      const isAI = lgMessage.id && lgMessage.id[2] === 'AIMessage'
      return {
        id: lgMessage.kwargs.id,
        role: isAI ? 'assistant' : 'user',
        content: lgMessage.kwargs.content,
        timestamp: new Date(),
      } as Message
    })
}

const convertLangChainMessages = (
  lcMessages: LangChainMessage[]
): Message[] => {
  return lcMessages
    .filter((m) => {
      // Filter out tool calls and tool messages
      const messageType = Array.isArray(m.id) && m.id[2]
      const isToolMessage = messageType === 'ToolMessage'
      const hasToolCalls = m.kwargs.tool_calls && m.kwargs.tool_calls.length > 0
      const hasContent = m.kwargs.content && m.kwargs.content.trim() !== ''
      
      // Filter out tool messages and messages that are just tool calls
      if (isToolMessage || hasToolCalls) {
        return false
      }
      
      // Only show messages with actual content
      return hasContent
    })
    .map((m) => {
      const isAI = Array.isArray(m.id) && m.id[2] === 'AIMessage'
      return {
        id: m.kwargs.id,
        role: isAI ? 'assistant' : 'user',
        content: m.kwargs.content,
        timestamp: new Date(),
      }
    })
}


export default function ChatPage() {
  const params = useParams()
  const chatId = params.id as string
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)

  const displayMessages = messages
  console.log(displayMessages)

  useEffect(() => {
    const loadChatHistory = async () => {
      setIsLoadingHistory(true)
      try {
        const historyResult = await getChatHistory(chatId)

        if (historyResult.success && historyResult.data) {
          const convertedMessages = convertLangGraphMessages(
            historyResult.data.messages
          )
          setMessages(convertedMessages)
        }
      } catch (error) {
        console.error('Error loading chat history:', error)
      } finally {
        setIsLoadingHistory(false)
      }
    }

    loadChatHistory()
  }, [chatId])

  const handleSubmit = async (userMessage: string) => {
    setIsLoading(true)

    const optimisticUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, optimisticUserMessage])

    try {
      const result = await sendMessage(userMessage, chatId)

      if (result.success && result.data) {
        const converted = convertLangChainMessages(result.data.messages)
        setMessages(converted)
      } else {
        console.error('Error sending message:', result.error)
        setMessages((prev) =>
          prev.filter((m) => m.id !== optimisticUserMessage.id)
        )
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error in chat submission:', error)
      setMessages((prev) =>
        prev.filter((m) => m.id !== optimisticUserMessage.id)
      )
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  if (isLoadingHistory) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto py-8 space-y-4 px-24 custom-scrollbar">
        {displayMessages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex text-sm',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'rounded-xl p-2',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground max-w-[80%]'
                  : 'max-w-[60%]'
              )}
            >
              <p className="whitespace-pre-wrap break-words">
                {message.content}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 px-2">
              <Loader className="text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 p-4">
        <MessageForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          className="max-w-4xl mx-auto"
        />
      </div>
    </div>
  )
}
