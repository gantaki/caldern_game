type Listener<T = unknown> = (data: T) => void;

export class EventBus {
  private listeners = new Map<string, Set<Listener>>();

  on<T = unknown>(event: string, listener: Listener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    set.add(listener as Listener);

    // Return unsubscribe function
    return () => set.delete(listener as Listener);
  }

  once<T = unknown>(event: string, listener: Listener<T>): () => void {
    const unsub = this.on<T>(event, (data) => {
      unsub();
      listener(data);
    });
    return unsub;
  }

  emit<T = unknown>(event: string, data?: T): void {
    const set = this.listeners.get(event);
    if (set) {
      for (const listener of set) {
        listener(data);
      }
    }
  }

  clear(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

// Global instance
export const events = new EventBus();
