'use client'

import { useRouter } from 'next/navigation'
import { SignedIn, SignedOut, SignOutButton } from '@clerk/nextjs'

interface StatusDisplayProps {
  x: number
  y: number
}

export default function StatusDisplay({ x, y }: StatusDisplayProps) {
  const router = useRouter()

  return (
    <div className="absolute bottom-8 left-8 flex flex-col font-azeret-mono gap-y-2">
      <span className="text-xs text-muted-foreground tabular-nums">
        X: {Math.round(x)}
      </span>
      <span className="text-xs text-muted-foreground tabular-nums">
        Y: {Math.round(y)}
      </span>
      <SignedOut>
        <button
          onClick={() => router.push('/sign-in')}
          className="p-0 mini-label text-muted-foreground hover:underline underline-offset-2"
        >
          sign in
        </button>
      </SignedOut>
      <SignedIn>
        <SignOutButton>
          <button className="p-0 mini-label text-2xs text-muted-foreground hover:underline underline-offset-2">
            sign out
          </button>
        </SignOutButton>
      </SignedIn>
    </div>
  )
}
