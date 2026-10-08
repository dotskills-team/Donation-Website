import { cn } from "@/lib/utils";

const base =
  "w-full rounded-md border bg-surface px-3 text-[15px] text-ink placeholder:text-muted/70 focus:border-brand disabled:bg-paper";

export function Field({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
      {hint && !error && <span className="block text-xs text-muted">{hint}</span>}
      {error && (
        <span role="alert" className="block text-xs text-danger">
          {error}
        </span>
      )}
    </label>
  );
}

export function Input({ className, invalid, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input className={cn(base, "h-10", invalid ? "border-danger" : "border-line", className)} aria-invalid={invalid} {...props} />;
}

export function Select({ className, invalid, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return <select className={cn(base, "h-10", invalid ? "border-danger" : "border-line", className)} aria-invalid={invalid} {...props} />;
}

export function Textarea({ className, invalid, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return <textarea className={cn(base, "py-2", invalid ? "border-danger" : "border-line", className)} aria-invalid={invalid} {...props} />;
}
