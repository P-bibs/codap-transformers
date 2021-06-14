export function prettyPrintCase(record: Record<string, unknown>): string {
  const keyValuePairs = [];

  for (const key in record) {
    const value = record[key];

    if (value === null) {
      keyValuePairs.push(`${key}: <missing>`);
    } else if (typeof value === "object") {
      // @ts-expect-error - typescript erroneously raises a null error below
      if ("jsonBoundaryObject" in value) {
        keyValuePairs.push(`${key}: <boundary>`);
      } else {
        keyValuePairs.push(`${key}: <unknown object>`);
      }
    } else {
      keyValuePairs.push(`${key}: ${value}`);
    }
  }

  return "[" + keyValuePairs.join(", ") + "]";
}
