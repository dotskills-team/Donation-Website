"use client";
import { cn } from "@/lib/utils";

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string; badge?: number }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          type="button"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-[15px] font-medium",
            value === t.id ? "border-brand text-brand-dark" : "border-transparent text-muted hover:text-ink",
          )}
        >
          {t.label}
          {!!t.badge && <span className="ml-2 rounded-full bg-brand px-1.5 py-0.5 text-xs text-white">{t.badge}</span>}
        </button>
      ))}
    </div>
  );
}
