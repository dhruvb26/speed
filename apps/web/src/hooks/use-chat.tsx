'use client'

import { useState, useCallback, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { v4 as uuid } from 'uuid'
import { parseStreamChunk } from '@/utils/stream-parser'
import { env } from '@/env'
import { getChatHistory } from '@/actions/chat'
import { useToolCallStore } from '@/store/tool-call-store'
import { LangGraphMessage, Message, ParsedStreamInput } from '@/types'
import { ToolCall } from '@langchain/core/messages/tool'

interface UseChatOptions {
  threadId: string
}

function isAIMessageKwargs(kwargs: unknown): boolean {
  return (
    typeof kwargs === 'object' &&
    kwargs !== null &&
    'content' in kwargs &&
    !('tool_call_id' in kwargs)
  )
}

function isToolMessageKwargs(kwargs: unknown): boolean {
  return (
    typeof kwargs === 'object' &&
    kwargs !== null &&
    'tool_call_id' in kwargs &&
    'name' in kwargs
  )
}

export const useChat = (options: UseChatOptions) => {
  const { user } = useUser()
  const { updateToolCall, clearAllToolCalls } = useToolCallStore()

  // we always have a threadId
  const threadId = options.threadId
  const [messages, setMessages] = useState<Message[]>([])

  // these states are used for streaming the responses
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState<string>('')

  const toolCallStateRef = useRef<{
    [key: string]: { name?: string; args: string; id?: string }
  }>({})

  const convertLangGraphMessages = (
    lgMessages: LangGraphMessage[]
  ): Message[] => {
    const messages: Message[] = []

    lgMessages.forEach((lgMessage) => {
      const messageType = lgMessage.id[2]

      if (messageType === 'HumanMessage') {
        messages.push({
          id: lgMessage.kwargs.id ?? '',
          role: 'user',
          content: lgMessage.kwargs.content.toString(),
          timestamp: new Date(),
        })
      } else if (
        messageType === 'AIMessage' ||
        messageType === 'AIMessageChunk'
      ) {
        // Check if this is an AI message with tool calls
        if (isAIMessageKwargs(lgMessage.kwargs)) {
          const aiKwargs = lgMessage.kwargs

          if (aiKwargs.tool_calls && aiKwargs.tool_calls.length > 0) {
            aiKwargs.tool_calls.forEach((toolCall: ToolCall) => {
              messages.push({
                id: aiKwargs.id ?? '',
                role: 'tool_call_chunk',
                // this decides what is shown to the user
                content: `Executing tool ${toolCall.name}`,
                timestamp: new Date(),
                toolCall: {
                  id: toolCall.id ?? '',
                  name: toolCall.name,
                  args:
                    typeof toolCall.args === 'string'
                      ? toolCall.args
                      : JSON.stringify(toolCall.args, null, 2),
                },
              })
            })
          }

          if (aiKwargs.content) {
            messages.push({
              id: aiKwargs.id ?? '',
              role: 'assistant',
              content: aiKwargs.content.toString(),
              timestamp: new Date(),
            })
          }
        }
      } else if (messageType === 'ToolMessage') {
        if (isToolMessageKwargs(lgMessage.kwargs)) {
          const toolKwargs = lgMessage.kwargs
          messages.push({
            id: toolKwargs.id ?? '',
            role: 'tool_result',
            content:
              typeof toolKwargs.content === 'string'
                ? toolKwargs.content
                : JSON.stringify(toolKwargs.content, null, 2),
            timestamp: new Date(),
            toolResult: {
              // !! changing from tool_call_id to id
              id: toolKwargs.tool_call_id ?? '',
              name: toolKwargs.name ?? '',
              // pass in the content here to show in the tool call dropdown
              content:
                typeof toolKwargs.content === 'string'
                  ? toolKwargs.content
                  : JSON.stringify(toolKwargs.content, null, 2),
            },
          })
        }
      }
    })

    return messages
  }

  const loadChatHistory = useCallback(async (chatId: string) => {
    try {
      const historyResult = await getChatHistory(chatId)
      if (historyResult.success && historyResult.data) {
        const convertedMessages = convertLangGraphMessages(
          historyResult.data.messages
        )

        setMessages((prev) => {
          const serverUserMessages = new Set(
            convertedMessages
              .filter((msg) => msg.role === 'user')
              .map((msg) => msg.content.trim())
          )

          const optimisticMessages = prev.filter(
            (msg) =>
              msg.role === 'user' && !serverUserMessages.has(msg.content.trim())
          )

          return [...convertedMessages, ...optimisticMessages]
        })
      }
    } catch (error) {
      console.error('Error loading chat history:', error)
    }
  }, [])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!user?.id) return null

      const currentThreadId = threadId

      // this is an optimistic user message, it will be updated when the response is received
      const userMessage: Message = {
        id: uuid(),
        role: 'user',
        content,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])

      setIsStreaming(true)

      try {
        const response = await fetch(
          `${env.NEXT_PUBLIC_API_URL}/api/chat/agent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [{ role: 'user', content }],
              config: {
                thread_id: currentThreadId,
              },
              userId: user.id,
            }),
          }
        )

        if (!response.ok) {
          throw new Error('Failed to send message')
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body')
        }

        const decoder = new TextDecoder()
        let accumulatedContent = ''
        toolCallStateRef.current = {}

        while (true) {
          const { done, value } = await reader.read()

          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n').filter((line) => line.trim())

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6)
                const parsedInput: ParsedStreamInput = JSON.parse(jsonStr)
                const parsedChunk = parseStreamChunk({
                  chunk: parsedInput,
                  toolCallState: toolCallStateRef.current,
                })

                // Handle different chunk types and set appropriate state
                switch (parsedChunk.type) {
                  case 'assistant':
                    if (parsedChunk.content) {
                      accumulatedContent += parsedChunk.content
                      setStreamingContent(accumulatedContent)
                    }
                    break

                  case 'tool_call_chunk':
                    if (parsedChunk.toolCall) {
                      const toolCallId = parsedChunk.toolCall.id

                      // Update the tool call store with streaming data
                      updateToolCall({
                        id: toolCallId ?? '',
                        name: parsedChunk.toolCall.name || '',
                        args: parsedChunk.toolCall.args || '',
                        isStreaming: true,
                      })

                      // Create or update tool call message in messages
                      setMessages((prev) => {
                        const existingIndex = prev.findIndex(
                          (msg) =>
                            msg.role === 'tool_call_chunk' &&
                            msg.toolCall?.id === toolCallId &&
                            msg.isStreaming
                        )

                        const toolCallMessage: Message = {
                          id:
                            existingIndex >= 0
                              ? prev[existingIndex].id
                              : uuid(),
                          role: 'tool_call_chunk',
                          content: `Executing tool ${parsedChunk.toolCall?.name || ''}`,
                          timestamp: new Date(),
                          isStreaming: true,
                          toolCall: {
                            id: toolCallId,
                            name: parsedChunk.toolCall?.name || '',
                            args: parsedChunk.toolCall?.args || '',
                          },
                        }

                        if (existingIndex >= 0) {
                          // Update existing message
                          const newMessages = [...prev]
                          newMessages[existingIndex] = toolCallMessage
                          return newMessages
                        } else {
                          // Add new message
                          return [...prev, toolCallMessage]
                        }
                      })
                    }
                    break

                  case 'tool_result':
                    // Tool results will be handled by loadChatHistory at the end
                    break

                  case 'complete':
                    // Finalize streaming state
                    setIsStreaming(false)

                    // Add any accumulated content as assistant message
                    if (accumulatedContent.trim()) {
                      const assistantMessage: Message = {
                        id: uuid(),
                        role: 'assistant',
                        content: accumulatedContent,
                        timestamp: new Date(),
                      }
                      setMessages((prev) => [...prev, assistantMessage])
                    }

                    // Convert streaming tool calls to final messages
                    setMessages((prev) => {
                      return prev.map((msg) => {
                        if (msg.role === 'tool_call_chunk' && msg.isStreaming) {
                          return { ...msg, isStreaming: false }
                        }
                        return msg
                      })
                    })

                    // Clear streaming states
                    setStreamingContent('')
                    clearAllToolCalls()

                    // Load chat history to get the final state including tool results
                    // Add a small delay to give server time to process the message
                    setTimeout(() => {
                      loadChatHistory(currentThreadId)
                    }, 100)
                    break

                  case 'error':
                    console.error('Stream error:', parsedChunk.content)
                    setIsStreaming(false)
                    setStreamingContent('')
                    break

                  case 'unknown':
                    console.warn('Unknown chunk type:', parsedChunk.content)
                    break

                  default:
                    console.warn('Unhandled chunk type:', parsedChunk)
                    break
                }
              } catch (parseError) {
                console.error('Error parsing chunk:', parseError)
              }
            }
          }
        }

        return currentThreadId
      } catch (error) {
        console.error('Error sending message:', error)
        setIsStreaming(false)
        setStreamingContent('')
        throw error
      }
    },
    [user?.id, threadId, loadChatHistory]
  )

  return {
    messages,
    streamingContent,
    isStreaming,
    threadId,
    sendMessage,
    setMessages,
    loadChatHistory,
  }
}
