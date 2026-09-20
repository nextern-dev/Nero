import { cn, initials } from "@/lib/utils";

export function Avatar({
  user,
  size = 24,
  className,
}: {
  user: { name: string; color: string };
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-[#0A0A0B] ring-1 ring-white/10 select-none",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, ${user.color}, ${user.color}99)`,
      }}
      title={user.name}
    >
      {initials(user.name)}
    </span>
  );
}

export function AvatarStack({
  users,
  size = 24,
  max = 4,
}: {
  users: { name: string; color: string }[];
  size?: number;
  max?: number;
}) {
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;
  return (
    <span className="flex items-center">
      {shown.map((u, i) => (
        <span
          key={`${u.name}-${i}`}
          className={cn("rounded-full ring-2 ring-ink-900", i > 0 && "-ml-2")}
        >
          <Avatar user={u} size={size} />
        </span>
      ))}
      {extra > 0 && (
        <span
          className="-ml-2 inline-flex items-center justify-center rounded-full bg-ink-700 text-[10px] font-medium text-ink-200 ring-2 ring-ink-900"
          style={{ width: size, height: size }}
        >
          +{extra}
        </span>
      )}
    </span>
  );
}
