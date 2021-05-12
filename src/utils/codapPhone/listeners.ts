// Listen for new or removed data contexts

export let newContextListeners: Array<() => void> = [];

export function addNewContextListener(listener: () => void): void {
  newContextListeners.push(listener);
}

export function removeNewContextListener(listener: () => void): void {
  newContextListeners = newContextListeners.filter((v) => v !== listener);
}

export function callAllContextListeners() {
  for (const f of newContextListeners) {
    f();
  }
}

// Listen for data context updates

export const contextUpdateListeners: Record<string, () => void | undefined> =
  {};

export function addContextUpdateListener(
  context: string,
  listener: () => void
): void {
  contextUpdateListeners[context] = listener;
}

export function removeContextUpdateListener(context: string): void {
  delete contextUpdateListeners[context];
}
