export let changeListeners: Array<() => void> = [];

export function addCodapListener(listener: () => void) {
  changeListeners.push(listener);
}

export function removeCodapListener(listener: () => void) {
  changeListeners = changeListeners.filter(v => v !== listener);
}
