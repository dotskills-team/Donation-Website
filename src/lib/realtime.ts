// Server side of the SSE channel. Events carry no data, only a "something changed" signal,
// so subscribers (including anonymous visitors) re-fetch through the normal, permission-checked APIs.
type Sub = (chunk: string) => void;
const g = globalThis as unknown as { __rtSubs?: Set<Sub> };
const subs: Set<Sub> = (g.__rtSubs ??= new Set());

export function subscribe(fn: Sub) {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}

export function publish(type: string) {
  const chunk = `data: ${JSON.stringify({ type, t: Date.now() })}\n\n`;
  for (const s of subs) s(chunk);
}
