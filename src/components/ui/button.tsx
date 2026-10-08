import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANT: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark disabled:bg-brand/50",
  secondary: "bg-surface text-ink border border-line hover:bg-brand-soft",
  ghost: "text-brand hover:bg-brand-soft",
  danger: "bg-danger text-white hover:bg-danger/90 disabled:bg-danger/50",
};
const SIZE: Record<Size, string> = { sm: "h-8 px-3 text-sm", md: "h-10 px-4 text-[15px]" };

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed",
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...props}
    />
  );
}
