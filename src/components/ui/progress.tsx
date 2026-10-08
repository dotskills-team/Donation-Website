import { cn } from "@/lib/utils";

export function Progress({ percent, className, label }: { percent: number; className?: string; label?: string }) {
  const v = Math.max(0, Math.min(100, percent));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(v)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Progress"}
      className={cn("h-3 w-full overflow-hidden rounded-full bg-brand-soft", className)}
    >
      <div className="h-full rounded-full bg-brand transition-[width] duration-700" style={{ width: `${v}%` }} />
    </div>
  );
}
