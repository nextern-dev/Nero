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

export default function BoardLoading() {
  return (
    <div className="pt-6">
      {/* Header */}
      <div className="mb-5 space-y-3">
        <Pulse className="h-3.5 w-36 rounded" />
        <div className="flex items-center gap-2.5">
          <Pulse className="h-8 w-8 rounded-lg" delay={60} />
          <Pulse className="h-7 w-56 rounded" delay={120} />
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-4 flex gap-2">
        <Pulse className="h-8 w-48 rounded-lg" delay={180} />
        <Pulse className="h-8 w-32 rounded-lg" delay={220} />
        <Pulse className="h-8 w-32 rounded-lg" delay={260} />
      </div>

      {/* Columns */}
      <div className="flex items-start gap-3 overflow-x-hidden">
        {[0, 1, 2, 3].map((c) => (
          <div
            key={c}
            className="w-[290px] shrink-0 rounded-2xl border border-ink-50/[0.05] bg-ink-900/70 p-3"
          >
            <div className="mb-3 flex items-center gap-2 px-1">
              <Pulse className="h-2 w-2 rounded-full" delay={300 + c * 80} />
              <Pulse className="h-3.5 w-20 rounded" delay={300 + c * 80} />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 3 - (c % 2) }).map((_, r) => (
                <Pulse
                  key={r}
                  className="h-[74px] rounded-xl"
                  delay={360 + c * 80 + r * 50}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
