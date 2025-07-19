'use client'
import { Button } from './button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './card'
import Image from 'next/image'

export default function Integrations() {
  return (
    <Card className="w-80 h-fit flex flex-col">
      <CardHeader>
        <CardTitle className="flex flex-row items-center gap-2 font-medium text-base">
          <Image src="/icons/gmail.svg" alt="Gmail" width={24} height={24} />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Connect your Gmail account to access emails, send messages, and manage
          your inbox directly from the platform.
        </p>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button size="sm">Connect</Button>
      </CardFooter>
    </Card>
  )
}
