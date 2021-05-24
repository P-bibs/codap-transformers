import { DataSet } from "./types";
import { dataItemToEnv } from "./util";
import { evaluate } from "../language";
import { Value } from "../language/ast";

function numCompareFn(a: { content: number }, b: { content: number }) {
  return a.content - b.content;
}

function stringCompareFn(a: { content: string }, b: { content: string }) {
  if (a.content === b.content) {
    return 0;
  } else if (a.content > b.content) {
    return 1;
  } else {
    return -1;
  }
}

function boolCompareFn(a: { content: boolean }, b: { content: boolean }) {
  if (a.content) {
    return b.content ? 0 : 1;
  } else {
    return b.content ? -1 : 0;
  }
}

function compareFn(a: Value, b: Value): number {
  if (a.kind === "Num" && b.kind === "Num") {
    return numCompareFn(a, b);
  } else if (a.kind === "String" && b.kind === "String") {
    return stringCompareFn(a, b);
  } else if (a.kind === "Bool" && b.kind === "Bool") {
    return boolCompareFn(a, b);
  } else {
    throw new Error(
      `Keys must have the same type for all rows. Got ${a.kind} and {b.kind}`
    );
  }
}

export function sort(dataset: DataSet, keyExpr: string): DataSet {
  const sorted = dataset.records.slice();
  sorted.sort((row1, row2) => {
    const env1 = dataItemToEnv(row1);
    const env2 = dataItemToEnv(row2);
    const key1 = evaluate(keyExpr, env1);
    const key2 = evaluate(keyExpr, env2);
    return compareFn(key1, key2);
  });

  return {
    collections: dataset.collections.slice(),
    records: sorted,
  };
}
