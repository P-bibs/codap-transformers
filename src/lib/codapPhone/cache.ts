import { DataContext, ReturnedCase } from "./types";
import { DefaultMap } from "./util";

const contextCache = new Map<string, DataContext>();
const recordsCache = new Map<string, Record<string, unknown>[]>();
const caseCache = new Map<number, ReturnedCase>();

// A map from context names to sets of case ids
const caseContextLookup = new DefaultMap<string, Set<number>>(
  () => new Set<number>()
);

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

export function setCase(
  context: string,
  id: number,
  caseData: ReturnedCase
): void {
  caseContextLookup.get(context).add(id);
  caseCache.set(id, caseData);
}

export function invalidateContext(contextName: string): void {
  contextCache.delete(contextName);
  recordsCache.delete(contextName);
}

export function invalidateCase(id: number): void {
  caseCache.delete(id);
}

export function invalidateCasesInContext(context: string): void {
  for (const id of caseContextLookup.get(context)) {
    invalidateCase(id);
  }
}
