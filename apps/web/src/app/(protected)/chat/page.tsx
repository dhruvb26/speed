'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { v4 as uuid } from 'uuid'
import { MessageForm } from '@/components/ui/message-form'
import { useChatStore } from '@/store/chat-store'

export default function Chat() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const setInitialMessage = useChatStore((state) => state.setInitialMessage)

  const handleSubmit = async (message: string) => {
    setIsLoading(true)
    const threadId = uuid()
    setInitialMessage(threadId, message)
    router.push(`/chat/${threadId}`)
    setIsLoading(false)
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
