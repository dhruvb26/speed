'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlusIcon, SendIcon } from 'lucide-react'

export default function Chat() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-4">
      <h1 className="text-4xl text-center mb-8">
        Let's get you upto
        <span className="italic font-bold"> speed</span>
      </h1>

      <div className="flex gap-2 flex-col rounded-2xl p-2 min-h-20 w-full border border-muted max-w-2xl mx-auto bg-muted">
        <Input
          placeholder="How can we help you?"
          className="resize-none min-h-9 overflow-hidden border-none shadow-none"
        />
        <div className="flex flex-row items-end justify-between pl-2">
          <Button variant="outline" size="icon" className="rounded-full">
            <PlusIcon className="icon-button icon-xs" />
          </Button>
          <Button size="icon">
            <SendIcon className="icon-button icon-xs" />
          </Button>
        </div>
      </div>
    </div>
  )
}
