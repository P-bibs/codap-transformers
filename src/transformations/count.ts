import { DataSet } from "./types";
import { CodapAttribute, Collection } from "../utils/codapPhone/types";

// TODO: allow for two modes:
//  1) treat data like one table, values are counted across all cases
//  2) treat hierarchy as subtables, values are counted *within subtable*

/**
 * Count consumes a dataset and attribute name and produces a new
 * dataset that presents a summary of the frequency of difference
 * values of that attribute in the input dataset.
 *
 * The output dataset has one collection with two attributes under
 * the counted attribute name and `count`, which list all distinct values
 * of the attribute, and the number of times each value occurred, respectively.
 */
export function count(dataset: DataSet, attribute: string): DataSet {
  // find the attribute corresponding to given attribute name
  let attr: undefined | CodapAttribute;
  for (const coll of dataset.collections) {
    attr = coll.attrs?.find((attr) => attr.name === attribute);
    if (attr) {
      break;
    }
  }

  // ensure attribute exists
  if (attr === undefined) {
    throw new Error(`invalid attribute name: ${attribute}`);
  }

  // isolate values under this attribute
  const values = dataset.records.map((record) => record[attribute]);
  const uniqueValues = unique(values);

  // count occurrences of each distinct value under this attribute
  const records: Record<string, unknown>[] = uniqueValues.map((value) => {
    const record: Record<string, unknown> = {};
    record[attribute] = value;
    record["count"] = values.filter((v) => valueEquals(v, value)).length;
    return record;
  });

  // construct collection with value/count attributes only
  const collections: Collection[] = [
    {
      name: `Count (${attribute})`,
      labels: {},
      attrs: [
        // first attribute is a copy of the original
        // NOTE: formulas are not copied: a formula-based attribute being
        // counted will be removed from its dependencies in the output
        // which makes the formula invalid.
        { ...attr, formula: undefined },
        // second attribute is "count", containing all counts
        { name: "count" },
      ],
    },
  ];

  return {
    collections,
    records,
  };
}

/**
 * Determines whether or not two values from the same attribute are
 * equivalent for the purposes of counting. Attributes may consist
 * of objects so this can't just be == or ===.
 */
function valueEquals(left: unknown, right: unknown): boolean {
  // FIXME: this is SUPER slow for boundary objects
  return JSON.stringify(left) === JSON.stringify(right);
}

/**
 * Produces a version of the input list without duplicate elements.
 * @param values list to de-duplicate
 * @returns list without duplicates
 */
function unique(values: unknown[]): unknown[] {
  const soFar: unknown[] = [];

  outer: for (const v of values) {
    for (const already of soFar) {
      if (valueEquals(v, already)) {
        continue outer;
      }
    }

    soFar.push(v);
  }

  return soFar;
}
