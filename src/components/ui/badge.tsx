import { cn } from "@/lib/utils";

const TONE = {
  green: "bg-brand-soft text-brand-dark",
  red: "bg-danger-soft text-danger",
  amber: "bg-warn-soft text-[#7a5200]",
  gray: "bg-paper text-muted border border-line",
};

export function Badge({ tone = "gray", className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof TONE }) {
  return <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", TONE[tone], className)} {...props} />;
}
