import React, { useState, useEffect, useCallback } from "react";
import {
  getAllDataContexts,
  addNewContextListener,
  removeNewContextListener,
  getAllCollections,
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

export function useCollections(context: string | null): CodapIdentifyingInfo[] {
  const [collections, setCollections] = useState<CodapIdentifyingInfo[]>([]);

  async function refreshCollections(context: string) {
    setCollections(await getAllCollections(context));
  }

  // Update if context changes
  useEffect(() => {
    if (context) {
      refreshCollections(context);
    }
  }, [context]);

  return collections;
}

export function useAttributes(
  context: string | null,
  collection: string | null
): string[] {
  const [collections, setAttributes] = useState<string[]>([]);

  async function refreshAttributes(context: string, collection: string) {
    setAttributes(await getAllAttributes(context, collection));
  }

  // Update if context changes
  useEffect(() => {
    if (context && collection) {
      refreshAttributes(context, collection);
    }
  }, [context, collection]);

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
