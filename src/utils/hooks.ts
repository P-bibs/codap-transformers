import React, { useState, useEffect, useCallback } from "react";
import {
  getAllDataContexts,
  addNewContextListener,
  removeNewContextListener,
  getAllAttributes,
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
