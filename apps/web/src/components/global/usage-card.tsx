import { getUser } from '@/actions/user'

export default async function UsageCard() {
  const user = await getUser()
  const usage = user?.usage || 0
  const usageLimit = 1000
  const usagePercentage = (usage / usageLimit) * 100

  return (
    <div className="flex flex-col gap-4 w-full border border-border rounded-lg p-4 bg-background">
      <span className="text-xs text-muted-foreground">Plan Usage</span>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground">Agent Credits</span>
          <span className="text-xs text-muted-foreground">
            {usage}/{usageLimit}
          </span>
        </div>

        <div className="w-full bg-muted rounded-full h-1">
          <div
            className="bg-foreground h-1 rounded-full transition-all duration-300"
            style={{ width: `${usagePercentage}%` }}
          />
        </div>
      </div>
    </div>
  )
}
