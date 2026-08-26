/**
 * Responsive advertisement placeholder.
 * Replace the inner markup with a real ad unit (AdSense, direct placement)
 * when ad accounts are ready — the layout reservation stays the same.
 */
export function AdSlot({
  label = "Advertisement",
  size = "leaderboard",
  className = "",
}: {
  label?: string;
  size?: "leaderboard" | "rectangle" | "inline";
  className?: string;
}) {
  const heights = {
    leaderboard: "h-24 sm:h-28",
    rectangle: "h-64",
    inline: "h-28",
  } as const;

  return (
    <aside
      aria-label={label}
      className={`flex ${heights[size]} w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/60 ${className}`}
    >
      <span className="eyebrow text-muted-foreground">{label}</span>
    </aside>
  );
}
