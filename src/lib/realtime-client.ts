type Listener = () => void;
const listeners = new Set<Listener>();
let source: EventSource | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

/** One shared EventSource per page; bursts of events are debounced into a single refetch signal. */
export function subscribeRealtime(fn: Listener) {
  listeners.add(fn);
  if (!source && typeof EventSource !== "undefined") {
    source = new EventSource("/api/realtime");
    source.onmessage = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => listeners.forEach((l) => l()), 150);
    };
  }
  return () => {
    listeners.delete(fn);
    if (listeners.size === 0 && source) {
      source.close();
      source = null;
    }
  };
}
