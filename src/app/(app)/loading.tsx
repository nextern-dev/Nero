function Bar({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <div
      className={`animate-pulse rounded bg-ink-850 ${className ?? ""}`}
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

export default function AppLoading() {
  return (
    <div className="pt-8">
      <Bar className="mb-2 h-4 w-40" />
      <Bar className="mb-8 h-9 w-64" delay={60} />
      <div className="card space-y-4 p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Bar
            key={i}
            className="h-10 w-full"
            delay={120 + i * 70}
          />
        ))}
      </div>
    </div>
  );
}
