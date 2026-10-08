"use client";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/form";
import type { RangeKey } from "@/types";

export type RangeValue = { range: RangeKey; from?: string; to?: string };

export function rangeQuery(v: RangeValue) {
  const p = new URLSearchParams({ range: v.range });
  if (v.range === "custom") {
    if (v.from) p.set("from", v.from);
    if (v.to) p.set("to", v.to);
  }
  return p.toString();
}

const OPTIONS: { id: RangeKey; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 Days" },
  { id: "month", label: "This Month" },
  { id: "custom", label: "Custom Range" },
];

export function RangeFilter({
  value,
  onChange,
  allowAll,
}: {
  value: RangeValue;
  onChange: (v: RangeValue) => void;
  allowAll?: boolean;
}) {
  const options = allowAll ? [{ id: "all" as RangeKey, label: "All Time" }, ...OPTIONS] : OPTIONS;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex overflow-hidden rounded-md border border-line bg-surface" role="group" aria-label="Date range">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={value.range === o.id}
            onClick={() => onChange({ ...value, range: o.id })}
            className={cn(
              "px-3 py-1.5 text-sm font-medium",
              value.range === o.id ? "bg-brand text-white" : "text-ink hover:bg-brand-soft",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      {value.range === "custom" && (
        <div className="flex items-center gap-2">
          <Input type="date" aria-label="From date" className="h-9 w-40" value={value.from ?? ""} onChange={(e) => onChange({ ...value, from: e.target.value })} />
          <span className="text-muted">to</span>
          <Input type="date" aria-label="To date" className="h-9 w-40" value={value.to ?? ""} onChange={(e) => onChange({ ...value, to: e.target.value })} />
        </div>
      )}
    </div>
  );
}
