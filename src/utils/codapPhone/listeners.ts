import { notifyUndoableActionPerformed } from ".";
import { InteractiveState } from "./types";

// Listen for saved state requests.
// Each request receives the state produced by the last listener and should
// return the state it wants to pass to the next listener. The state produced
// by the last listener will be sent to CODAP.
export let interactiveStateRequestListeners: Array<
  (state: InteractiveState) => InteractiveState
> = [];

export function addInteractiveStateRequestListener(
  listener: (state: InteractiveState) => InteractiveState
): void {
  interactiveStateRequestListeners.push(listener);
}

export function removeInteractiveStateRequestListener(
  listener: (state: InteractiveState) => InteractiveState
): void {
  interactiveStateRequestListeners = interactiveStateRequestListeners.filter(
    (v) => v !== listener
  );
}

export function callAllInteractiveStateRequestListeners(): InteractiveState {
  // Pass the result of each listener as the input to the next. Then return
  // the final output.
  let state = {};
  for (const f of interactiveStateRequestListeners) {
    state = f(state);
  }
  return state;
}

// The undo stack and related functions allow pushing and popping callbacks
// that will be fired if CODAP notifies us that an undo request has been
// initiated
export let undoStack: Array<[string, () => void, () => void]> = [];
export let redoStack: Array<[string, () => void, () => void]> = [];
export const clearUndoAndRedoStacks = (): void => {
  undoStack = [];
  redoStack = [];
};
/**
 * Add an item to the undo stack. CODAP will be notified that an undoable action
 * has been performed and the callback will be saved in a stack. If CODAP tells
 * us its time to undo, the callback will be executed.
 * @param message the tooltip that CODAP will display if this undo action is next
 * @param callback the callback that will be fired if undo is pressed
 * @param redoCallback the callback to add to the redo queue
 */
export function pushToUndoStack(
  message: string,
  callback: () => void,
  redoCallback: () => void
): void {
  notifyUndoableActionPerformed(message);
  undoStack.push([message, callback, redoCallback]);
}

/**
 *  Pops a callback form the undo stack and executes it
 * @returns false if the undo stack is empty, true otherwise
 */
export function popFromUndoStackAndExecute(): boolean {
  const popped = undoStack.pop();
  if (popped) {
    // If there was a callback left, execute it
    popped[1]();
    redoStack.push(popped);
    return true;
  } else {
    // If no callback, return false
    return false;
  }
}

/**
 *  Pops a callback form the redo stack and executes it
 * @returns false if the redo stack is empty, true otherwise
 */
export function popFromRedoStackAndExecute(): boolean {
  const popped = redoStack.pop();
  if (popped) {
    // If there was a callback left, execute it
    popped[2]();
    undoStack.push(popped);
    return true;
  } else {
    // If no callback, return false
    return false;
  }
}

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

/**
 * This maps context names to a list of [dependencies, listener] pairs.
 * The dependencies indicate which other entities are required to be valid
 * for the listener to be successfully called.
 */
export const contextUpdateListeners: Record<
  string,
  Array<[string[], () => void]>
> = {};

export function addContextUpdateListener(
  context: string,
  dependencies: string[],
  listener: () => void
): void {
  if (contextUpdateListeners[context] === undefined) {
    contextUpdateListeners[context] = [];
  }
  contextUpdateListeners[context].push([dependencies, listener]);
}

export function removeContextUpdateListener(
  context: string,
  listener: () => void
): void {
  if (contextUpdateListeners[context] !== undefined) {
    contextUpdateListeners[context] = contextUpdateListeners[context].filter(
      ([, f]) => f !== listener
    );
  }
}

export function removeContextUpdateListenersForContext(context: string): void {
  delete contextUpdateListeners[context];
}

export function removeListenersWithDependency(dep: string): void {
  for (const [context, values] of Object.entries(contextUpdateListeners)) {
    const keep: [string[], () => void][] = [];
    for (const [dependencies, listener] of values) {
      if (!dependencies.includes(dep)) {
        keep.push([dependencies, listener]);
      }
    }
    contextUpdateListeners[context] = keep;
  }
}

export async function callUpdateListenersForContext(
  context: string
): Promise<void> {
  if (contextUpdateListeners[context] !== undefined) {
    for (const [, f] of contextUpdateListeners[context]) {
      await f();
    }
  }
}
