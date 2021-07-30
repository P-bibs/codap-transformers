import { codapValueToString } from "../../transformers/util";

export function prettyPrintCase(record: Record<string, unknown>): string {
  const keyValuePairs = [];

  for (const key in record) {
    const value = record[key];

    keyValuePairs.push(`${key}: ${codapValueToString(value)}`);
  }

  return "[" + keyValuePairs.join(", ") + "]";
}
