// Listen for new or removed data contexts

export let newContextListeners: Array<() => void> = [];

export function addNewContextListener(listener: () => void): void {
  newContextListeners.push(listener);
}

export function removeNewContextListener(listener: () => void): void {
  newContextListeners = newContextListeners.filter((v) => v !== listener);
}

export function callAllContextListeners(): void {
  for (const f of newContextListeners) {
    f();
  }
}

// Listen for data context updates

export const contextUpdateListeners: Record<string, Array<() => void>> = {};

export function addContextUpdateListener(
  context: string,
  listener: () => void
): void {
  if (contextUpdateListeners[context] === undefined) {
    contextUpdateListeners[context] = [];
  }
  contextUpdateListeners[context].push(listener);
}

export function removeContextUpdateListener(
  context: string,
  listener: () => void
): void {
  if (contextUpdateListeners[context] !== undefined) {
    contextUpdateListeners[context] = contextUpdateListeners[context].filter(
      (f) => f !== listener
    );
  }
}

export function callUpdateListenersForContext(context: string): void {
  if (contextUpdateListeners[context] !== undefined) {
    contextUpdateListeners[context].forEach((f) => f());
  }
}
