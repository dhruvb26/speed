import { ToolCall } from '@langchain/core/messages/tool'
import { ParsedStreamChunk, ParsedStreamInput, LangGraphMessage } from '@/types'

function isAIMessage(message: LangGraphMessage): boolean {
  return (
    Array.isArray(message.id) &&
    (message.id[2] === 'AIMessage' || message.id[2] === 'AIMessageChunk')
  )
}

function isAIMessageKwargs(kwargs: unknown): boolean {
  return typeof kwargs === 'object' && kwargs !== null && 'content' in kwargs
}

function isToolMessageKwargs(kwargs: unknown): boolean {
  return (
    typeof kwargs === 'object' &&
    kwargs !== null &&
    'tool_call_id' in kwargs &&
    'name' in kwargs
  )
}

interface parseStreamChunkOptions {
  chunk: ParsedStreamInput
  toolCallState: {
    [key: string]: { name?: string; args: string; id?: string }
  }
}

export function parseStreamChunk({
  chunk,
  toolCallState,
}: parseStreamChunkOptions): ParsedStreamChunk {
  if (chunk.type === 'complete') {
    return {
      type: 'complete',
      id: chunk.message?.kwargs.id ?? '',
      timestamp: chunk.timestamp,
    }
  }

  //!! Not sure if this is how errors are handled in LangGraph
  if (chunk.type === 'error') {
    return {
      type: 'error',
      id: chunk.message?.kwargs.id ?? '',
      content: JSON.stringify(chunk.message),
      timestamp: chunk.timestamp,
    }
  }

  if (chunk.type === 'stream' && chunk.message) {
    const message = chunk.message

    // Handle ToolMessage -> this has the final result of the tool call
    if (message.id[2] === 'ToolMessage') {
      if (isToolMessageKwargs(message.kwargs)) {
        return {
          type: 'tool_result',
          id: message.kwargs.id ?? '',
          content: JSON.stringify(message.kwargs.content, null, 2),
          toolResult: {
            id: message.kwargs.tool_call_id ?? '',
            name: message.kwargs.name ?? '',
          },
          timestamp: chunk.timestamp,
        }
      }
    }

    // now ai message could be - standalone, the tool call invocation or tool call's chunk
    if (isAIMessage(message) && isAIMessageKwargs(message.kwargs)) {
      const kwargs = message.kwargs

      // standalone ai message (including empty content)
      if (
        (kwargs.tool_calls?.length === 0 || !kwargs.tool_calls) &&
        (kwargs.tool_call_chunks?.length === 0 || !kwargs.tool_call_chunks)
      ) {
        return {
          type: 'assistant',
          id: kwargs.id ?? '',
          content: kwargs.content.toString() || '',
          timestamp: chunk.timestamp,
        }
      }

      // tool call invocation
      if (kwargs.tool_calls && kwargs.tool_calls.length > 0) {
        const toolCall = kwargs.tool_calls[0] as ToolCall

        // Store tool call metadata in state for subsequent chunks using index
        // The index will be used to match tool_call_chunks
        if (kwargs.tool_call_chunks && kwargs.tool_call_chunks.length > 0) {
          for (const toolCallChunk of kwargs.tool_call_chunks) {
            const index = toolCallChunk.index?.toString() || '0'
            if (!toolCallState[index]) {
              toolCallState[index] = {
                name: toolCall.name,
                args: toolCallChunk.args ?? '', // Initialize with the first chunk
                id: toolCall.id ?? '',
              }
            } else {
              // Accumulate args
              toolCallState[index].args += toolCallChunk.args
            }
          }
        }

        const results = []

        // return all the tool call chunks
        for (const toolCallChunk of kwargs.tool_call_chunks || []) {
          const index = toolCallChunk.index?.toString() || '0'
          const accumulatedArgs = toolCallState[index]?.args || ''

          results.push({
            type: 'tool_call_chunk' as const,
            id: kwargs.id ?? '',
            toolCall: {
              id: toolCallChunk.id || toolCall.id || '', // Use chunk id or fallback to tool call id
              name: toolCallChunk.name || toolCall.name,
              args: accumulatedArgs,
            },
            timestamp: chunk.timestamp,
          })
        }

        return results[0]
      }

      // subsequent tool call chunks
      if (kwargs.tool_call_chunks && kwargs.tool_call_chunks.length > 0) {
        // Process all tool call chunks - there could be multiple with different indexes
        const results = []

        for (const toolCallChunk of kwargs.tool_call_chunks) {
          const chunkIndex = toolCallChunk.index?.toString() || '0'

          // Get stored metadata from state using index
          const storedToolCall = toolCallState[chunkIndex]

          // If this is the first chunk with full metadata, we might need to store/update it
          if (toolCallChunk.id && toolCallChunk.name && !storedToolCall) {
            toolCallState[chunkIndex] = {
              name: toolCallChunk.name,
              args: toolCallChunk.args ?? '',
              id: toolCallChunk.id ?? '',
            }
          } else if (storedToolCall) {
            // Accumulate args by appending the new chunk to existing args
            toolCallState[chunkIndex].args += toolCallChunk.args
          }

          const toolCallName = toolCallState[chunkIndex]?.name
          const toolCallId =
            toolCallChunk.id || toolCallState[chunkIndex]?.id || ''
          const accumulatedArgs = toolCallState[chunkIndex]?.args || ''

          results.push({
            type: 'tool_call_chunk' as const,
            id: kwargs.id ?? '',
            toolCall: {
              id: toolCallId ?? '',
              name: toolCallName ?? '',
              args: accumulatedArgs,
            },
            timestamp: chunk.timestamp,
          })
        }

        // Return the first result for now (we may need to handle multiple results differently)
        return results[0]
      }
    }

    return {
      type: 'unknown',
      id: message.kwargs.id ?? '',
      content: JSON.stringify(message),
      timestamp: chunk.timestamp,
    }
  }

  return {
    type: 'unknown',
    id: chunk.message?.kwargs.id ?? '',
    content: JSON.stringify(chunk),
    timestamp: chunk.timestamp,
  }
}
