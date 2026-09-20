function Pulse({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={`animate-pulse bg-ink-850 ${className ?? ""}`}
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

export default function DashboardLoading() {
  return (
    <div className="pt-8">
      {/* Header */}
      <div className="mb-8 space-y-3">
        <Pulse className="h-4 w-44 rounded" />
        <Pulse className="h-9 w-80 rounded" delay={60} />
        <Pulse className="h-4 w-64 rounded" delay={120} />
      </div>

      {/* Stat cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Pulse
            key={i}
            className="h-[118px] rounded-2xl"
            delay={180 + i * 70}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Pulse className="h-[290px] rounded-2xl lg:col-span-2" delay={420} />
        <Pulse className="h-[290px] rounded-2xl" delay={490} />
      </div>

      {/* Lists */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Pulse className="h-[320px] rounded-2xl lg:col-span-2" delay={560} />
        <Pulse className="h-[320px] rounded-2xl" delay={630} />
      </div>
    </div>
  );
}
