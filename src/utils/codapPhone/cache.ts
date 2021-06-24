import { DataContext, ReturnedCase } from "./types";

const contextCache = new Map<string, DataContext>();
const recordsCache = new Map<string, Record<string, unknown>[]>();
const caseCache = new Map<number, ReturnedCase>();

export function getContext(contextName: string): DataContext | undefined {
  return contextCache.get(contextName);
}

export function getRecords(
  contextName: string
): Record<string, unknown>[] | undefined {
  return recordsCache.get(contextName);
}

export function getCase(id: number): ReturnedCase | undefined {
  return caseCache.get(id);
}

export function setContext(contextName: string, context: DataContext): void {
  contextCache.set(contextName, context);
}

export function setRecords(
  contextName: string,
  dataset: Record<string, unknown>[]
): void {
  recordsCache.set(contextName, dataset);
}

export function setCase(id: number, caseData: ReturnedCase): void {
  caseCache.set(id, caseData);
}

export function invalidateContext(contextName: string): void {
  contextCache.delete(contextName);
  recordsCache.delete(contextName);
}

export function invalidateCase(id: number): void {
  console.log(`Invalidating case ${id}`);
  caseCache.delete(id);
}
