export default async function MonitoringPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Live & Monitoring
      </h1>
      <p className="text-muted-foreground">
        Monitoring ID: <span className="font-mono text-foreground">{id}</span>
      </p>
    </div>
  )
}
