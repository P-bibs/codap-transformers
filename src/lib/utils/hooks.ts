import { useState, useEffect } from "react";
import {
  getAllDataContexts,
  addNewContextListener,
  removeNewContextListener,
  getAllAttributes,
  getAllCollections,
  removeContextUpdateListener,
  addContextUpdateListener,
} from "../codapPhone";
import { CodapAttribute, CodapIdentifyingInfo } from "../codapPhone/types";

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

export function useAttributes(context: string | null): CodapAttribute[] {
  const [attributes, setAttributes] = useState<CodapAttribute[]>([]);

  async function refreshAttributes(context: string) {
    setAttributes(await getAllAttributes(context));
  }

  // Update if context changes
  useEffect(() => {
    if (context) {
      const updateFunc = () => {
        refreshAttributes(context);
      };
      refreshAttributes(context);
      addContextUpdateListener(context, [], updateFunc);
      return () => removeContextUpdateListener(context, updateFunc);
    }
  }, [context]);

  return attributes;
}
