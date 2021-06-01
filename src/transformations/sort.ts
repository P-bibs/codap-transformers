import { DataSet } from "./types";
import { evalExpression } from "../utils/codapPhone";

function numCompareFn(a: number, b: number) {
  return a - b;
}

function stringCompareFn(a: string, b: string) {
  if (a === b) {
    return 0;
  } else if (a > b) {
    return 1;
  } else {
    return -1;
  }
}

function boolCompareFn(a: boolean, b: boolean) {
  if (a) {
    return b ? 0 : 1;
  } else {
    return b ? -1 : 0;
  }
}

function compareFn(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") {
    return numCompareFn(a, b);
  } else if (typeof a === "string" && typeof b === "string") {
    return stringCompareFn(a, b);
  } else if (typeof a === "boolean" && typeof b === "boolean") {
    return boolCompareFn(a, b);
  } else {
    throw new Error(
      `Keys must have the same type for all rows. Got ${a} and ${b}`
    );
  }
}

export async function sort(
  dataset: DataSet,
  keyExpr: string
): Promise<DataSet> {
  const records = dataset.records.slice();
  const keyValues = await evalExpression(keyExpr, records);

  const sorted = records
    .map((record, i) => {
      return { record, i };
    })
    .sort(({ i: i1 }, { i: i2 }) => {
      return compareFn(keyValues[i1], keyValues[i2]);
    })
    .map(({ record }) => record);

  return new Promise((resolve) =>
    resolve({
      collections: dataset.collections.slice(),
      records: sorted,
    })
  );
}
