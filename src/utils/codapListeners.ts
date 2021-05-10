// Listen for new or removed data contexts

export let newContextListeners: Array<() => void> = [];

export function addNewContextListener(listener: () => void) {
  newContextListeners.push(listener);
}

export function removeNewContextListener(listener: () => void) {
  newContextListeners = newContextListeners.filter((v) => v !== listener);
}

// Listen for data context updates

export let contextUpdateListeners: Record<string, () => void | undefined> = {};

export function addContextUpdateListener(
  context: string,
  listener: () => void
) {
  contextUpdateListeners[context] = listener;
}

export function removeContextUpdateListener(context: string) {
  delete contextUpdateListeners[context];
}
