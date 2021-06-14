import { CodapLanguageType, DataSet } from "./types";
import { evalExpression } from "../utils/codapPhone";
import { codapValueToString, reportTypeErrorsForRecords } from "./util";

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

function objectCompareFn(a: unknown, b: unknown) {
  // TODO: not sure this is a meaningful comparison,
  // but it should at least give the same result every time.
  return stringCompareFn(JSON.stringify(a), JSON.stringify(b));
}

function compareFn(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") {
    return numCompareFn(a, b);
  } else if (typeof a === "string" && typeof b === "string") {
    return stringCompareFn(a, b);
  } else if (typeof a === "boolean" && typeof b === "boolean") {
    return boolCompareFn(a, b);
  } else if (typeof a === "object" && typeof b === "object") {
    return objectCompareFn(a, b);
  } else {
    throw new Error(
      `Sort encountered keys of differing types (${codapValueToString(
        a
      )} and ${codapValueToString(
        b
      )}). Keys must have the same type for all cases.`
    );
  }
}

export async function sort(
  dataset: DataSet,
  keyExpr: string,
  outputType: CodapLanguageType
): Promise<DataSet> {
  const records = dataset.records.slice();
  const keyValues = await evalExpression(keyExpr, records);

  // Check for type errors (might throw error and abort transformation)
  reportTypeErrorsForRecords(records, keyValues, outputType);

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
