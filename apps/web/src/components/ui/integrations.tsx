'use client'
import { Button } from './button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './card'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

export default function Integrations() {
  const router = useRouter()
  const { user } = useUser()

  const scopes = [
    'https://www.googleapis.com/auth/gmail.labels',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.metadata',
    'https://www.googleapis.com/auth/gmail.insert',
    'https://www.googleapis.com/auth/gmail.settings.basic',
  ].join(' ')

  const handleGmailAuth = () => {
    if (!user?.id) {
      console.error('User not authenticated')
      return
    }

    const redirectUri = `http://localhost:8787/api/auth/callback/gmail`
    const state = encodeURIComponent(JSON.stringify({ userId: user.id }))
    const gmailAuth = `https://accounts.google.com/o/oauth2/v2/auth?client_id=9403793679-382h9tsv0bgo4sslomdm99iafdlc9878.apps.googleusercontent.com&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes}&access_type=offline&prompt=consent&state=${state}`
    router.push(gmailAuth)
  }

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
        <Button size="sm" onClick={handleGmailAuth}>
          Connect
        </Button>
      </CardFooter>
    </Card>
  )
}
