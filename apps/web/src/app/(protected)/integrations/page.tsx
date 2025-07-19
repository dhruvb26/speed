import Integrations from '@/components/ui/integrations'

export default function IntegrationsPage() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-xl font-semibold">Integrations</h1>
      <div className="flex flex-row items-center justify-start w-full">
        <Integrations />
      </div>
    </div>
  )
}
