"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { cn } from "@/lib/utils";

type Item = { id: string; kind: "success" | "error"; text: string };
type Ctx = { success: (t: string) => void; error: (t: string) => void };
const ToastCtx = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const push = useCallback((kind: Item["kind"], text: string) => {
    const id = Math.random().toString(36).slice(2);
    setItems((x) => [...x, { id, kind, text }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 4500);
  }, []);
  const value: Ctx = { success: (t) => push("success", t), error: (t) => push("error", t) };
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 bottom-3 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4" aria-live="polite">
        {items.map((i) => (
          <div
            key={i.id}
            role="status"
            className={cn(
              "pointer-events-auto max-w-sm rounded-md border px-4 py-3 text-sm shadow-lg",
              i.kind === "success" ? "border-brand/30 bg-brand-soft text-brand-dark" : "border-danger/30 bg-danger-soft text-danger",
            )}
          >
            {i.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const c = useContext(ToastCtx);
  if (!c) throw new Error("useToast must be used inside ToastProvider");
  return c;
}
