'use client'

import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useChat } from '@/hooks/use-chat'
import { cn } from '@/lib/utils'
import { MessageForm } from '@/components/ui/message-form'
import { TextShimmer } from '@/components/ui/text-shimmer'
import { ToolCallDropdown } from '@/components/ui/tool-call-dropdown'
import Loader from '@/components/global/loader'
import { useChatStore } from '@/store/chat-store'

export default function ChatPage() {
  const params = useParams()
  const chatId = params.id as string
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isFetchingHistory, setIsFetchingHistory] = useState(false)

  const getInitialMessage = useChatStore((state) => state.getInitialMessage)
  const clearInitialMessage = useChatStore((state) => state.clearInitialMessage)

  const {
    messages,
    streamingContent,
    isStreaming,
    sendMessage,
    loadChatHistory,
  } = useChat({ threadId: chatId })

  useEffect(() => {
    if (chatId && messages.length === 0) {
      const storedMessage = getInitialMessage(chatId)
      if (storedMessage) {
        clearInitialMessage(chatId)
        sendMessage(storedMessage)
      } else {
        const fetchHistory = async () => {
          setIsFetchingHistory(true)
          await loadChatHistory(chatId)
          setIsFetchingHistory(false)
        }
        fetchHistory()
      }
    }
  }, [
    chatId,
    messages.length,
    getInitialMessage,
    clearInitialMessage,
    sendMessage,
    loadChatHistory,
  ])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const handleSubmit = async (userMessage: string) => {
    try {
      await sendMessage(userMessage)
    } catch (error) {
      console.error('Error in chat submission:', error)
      throw error
    }
  }

  const findToolResult = (toolCallId: string) => {
    return messages.find(
      (msg) => msg.role === 'tool_result' && msg.toolResult?.id === toolCallId
    )
  }

  return (
    <div className="flex flex-col h-screen max-w-7xl mx-auto">
      <div className="flex-1 overflow-y-auto py-8 space-y-4 px-24 custom-scrollbar">
        {isFetchingHistory ? (
          <div className="flex justify-center items-center h-full">
            <Loader />
          </div>
        ) : (
          <>
            {messages
              .filter((message) => message.role !== 'tool_result')
              .map((message) => {
                if (message.role === 'tool_call_chunk' && message.toolCall) {
                  const toolResultMessage = findToolResult(
                    message.toolCall.id ?? ''
                  )

                  return (
                    <div key={message.id} className="flex justify-start">
                      <ToolCallDropdown
                        toolCall={message.toolCall}
                        toolResult={toolResultMessage?.toolResult}
                        triggerContent={message.content}
                      />
                    </div>
                  )
                }

                return (
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
                )
              })}

            {isStreaming && streamingContent === '' && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 px-2">
                  <TextShimmer children="Thinking" />
                </div>
              </div>
            )}

            {isStreaming && streamingContent && (
              <div className="flex justify-start">
                <div className="rounded-xl p-2 max-w-[60%]">
                  <p className="whitespace-pre-wrap break-words text-sm">
                    {streamingContent}
                  </p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 p-4">
        <MessageForm
          onSubmit={handleSubmit}
          isLoading={isFetchingHistory}
          className="max-w-4xl mx-auto"
        />
      </div>
    </div>
  )
}
