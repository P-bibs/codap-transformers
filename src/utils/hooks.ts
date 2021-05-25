/* eslint-disable react-hooks/exhaustive-deps */

import React, { useState, useEffect, useCallback } from "react";
import {
  getAllDataContexts,
  addNewContextListener,
  removeNewContextListener,
  getAllAttributes,
  removeContextUpdateListener,
  addContextUpdateListener,
} from "./codapPhone";
import { CodapIdentifyingInfo } from "./codapPhone/types";

export function useDataContexts(): CodapIdentifyingInfo[] {
  const [dataContexts, setDataContexts] = useState<CodapIdentifyingInfo[]>([]);

  async function refreshTables() {
    setDataContexts(await getAllDataContexts());
  }

  // Initial refresh to set up connection, then start listening
  useEffect(() => {
    refreshTables();
    addNewContextListener(refreshTables);
    return () => removeNewContextListener(refreshTables);
  }, []);

  return dataContexts;
}

export function useAttributes(context: string | null): CodapIdentifyingInfo[] {
  const [collections, setAttributes] = useState<CodapIdentifyingInfo[]>([]);

  async function refreshAttributes(context: string) {
    setAttributes(await getAllAttributes(context));
  }

  // Update if context changes
  useEffect(() => {
    if (context) {
      refreshAttributes(context);
    }
  }, [context]);

  return collections;
}

interface ElementWithValue {
  value: string;
}

export function useInput<T, E extends ElementWithValue>(
  initialValue: T | string,
  extraAction: (newValue: T | string) => void
): [
  T | string,
  (e: React.ChangeEvent<E>) => void,
  React.Dispatch<React.SetStateAction<T | string>>
] {
  const [inputValue, setInputValue] = useState<T | string>(initialValue);
  const onChange = useCallback(
    (event: React.ChangeEvent<E>) => {
      setInputValue(event.target.value);
      extraAction(event.target.value);
    },
    [setInputValue, extraAction]
  );
  return [inputValue, onChange, setInputValue];
}

/**
 * Hook that registers and unregisters a listener for updates on a
 * specific data context
 */
export function useContextUpdateListener(
  contextName: string,
  callback: () => void,
  dependencies: unknown[]
): void {
  useEffect(() => {
    addContextUpdateListener(contextName, callback);
    return () => removeContextUpdateListener(contextName);
  }, [contextName, callback, ...dependencies]);
}

/**
 * Similar to `useContextUpdateListener`, but for callbacks (effects)
 * which rely on two strings being non-null. The implication is that
 * the effect is flowing data from the sourceContext to the
 * destinationContext, but only if both are non-null
 */
export function useContextUpdateListenerWithFlowEffect(
  sourceContext: string | null,
  destinationContext: string | null,
  flowCallback: () => void,
  dependencies: unknown[]
): void {
  // We use an unsafe cast from string | null to string here, but it's ok because
  // there's a check for sourceContext !== null inside the callback
  useContextUpdateListener(
    sourceContext as string,
    () => {
      if (sourceContext !== null && destinationContext !== null) {
        flowCallback();
      }
    },
    [destinationContext, flowCallback, ...dependencies]
  );
}
