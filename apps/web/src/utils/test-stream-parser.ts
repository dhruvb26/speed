#!/usr/bin/env bun

import { parseStreamChunk, ParsedStreamInput } from './stream-parser'
import extractedMessages from '../hooks/extracted_messages.json'

// Initialize toolCallState
const toolCallState: { [key: string]: { name?: string; args: string } } = {}

// Convert extracted message to ParsedStreamInput format
function convertToStreamInput(message: any): ParsedStreamInput {
  return {
    type: 'stream',
    message: message,
    timestamp: new Date().toISOString(),
  }
}

// Process all messages
console.log('🧪 Testing Stream Parser\n')
console.log(`Processing ${extractedMessages.length} messages...\n`)

extractedMessages.forEach((message, index) => {
  console.log(`--- Message ${index + 1} ---`)
  console.log(
    'Input:',
    JSON.stringify(message.kwargs, null, 2).substring(0, 200) + '...'
  )

  const streamInput = convertToStreamInput(message)

  const result = parseStreamChunk({
    chunk: streamInput,
    toolCallState,
  })

  console.log('Result:', {
    type: result.type,
    id: result.id,
    toolCall: result.toolCall
      ? {
          id: result.toolCall.id,
          name: result.toolCall.name,
          args:
            result.toolCall.args.length > 50
              ? result.toolCall.args.substring(0, 50) + '...'
              : result.toolCall.args,
        }
      : undefined,
    toolResult: result.toolResult,
    content:
      result.content?.length && result.content.length > 50
        ? result.content.substring(0, 50) + '...'
        : result.content,
  })

  console.log(
    'ToolCallState:',
    Object.keys(toolCallState).length > 0 ? toolCallState : 'empty'
  )
  console.log('')
})

console.log('✅ Test completed!')
console.log('Final toolCallState:', toolCallState)
