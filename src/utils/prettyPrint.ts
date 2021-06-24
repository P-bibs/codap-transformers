import { isBoundary, isBoundaryMap } from "../transformations/util";

export function prettyPrintCase(record: Record<string, unknown>): string {
  const keyValuePairs = [];

  for (const key in record) {
    const value = record[key];

    if (value === null) {
      keyValuePairs.push(`${key}: <missing>`);
    } else if (typeof value === "object") {
      if (isBoundary(value)) {
        keyValuePairs.push(`${key}: <boundary>`);
      } else if (isBoundaryMap(value)) {
        keyValuePairs.push(`${key}: <boundary map>`);
      } else {
        keyValuePairs.push(`${key}: <unknown object>`);
      }
    } else {
      keyValuePairs.push(`${key}: ${value}`);
    }
  }

  return "[" + keyValuePairs.join(", ") + "]";
}
