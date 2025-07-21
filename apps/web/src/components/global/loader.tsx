import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Loader({ className }: { className?: string }) {
  return (
    <Loader2
      strokeWidth={2.25}
      className={cn(
        'size-4 text-foreground animate-spin [animation-duration:0.5s]',
        className
      )}
    />
  )
}
