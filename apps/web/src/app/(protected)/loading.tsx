import Loader from '@/components/global/loader'

export default function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Loader className="text-foreground" />
    </div>
  )
}
