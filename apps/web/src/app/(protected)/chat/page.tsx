'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { v4 as uuid } from 'uuid'
import { sendMessage } from '@/actions/chat'
import { MessageForm } from '@/components/ui/message-form'

export default function Chat() {
  const router = useRouter()
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (message: string) => {
    if (!user?.id) return

    setIsLoading(true)

    try {
      const threadId = uuid()

      const result = await sendMessage(message, threadId)

      if (result.success) {
        router.push(`/chat/${threadId}`)
      } else {
        console.error('Error sending message:', result.error)
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error in chat submission:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-4">
      <h1 className="text-4xl text-center mb-8">
        Let's get you upto
        <span className="italic font-bold"> speed</span>
      </h1>

      <MessageForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        className="min-h-20 max-w-2xl mx-auto"
      />
    </div>
  )
}
