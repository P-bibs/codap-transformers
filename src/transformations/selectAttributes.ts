import { DataSet } from "./types";
import { reparent } from "./util";

/**
 * Constructs a dataset with only the indicated attributes from the
 * input dataset included, and all others removed.
 */
export function selectAttributes(
  dataset: DataSet,
  attributes: string[]
): DataSet {
  // copy records, but only the selected attributes
  const records = [];
  for (const record of dataset.records) {
    const copy: Record<string, unknown> = {};
    for (const attrName of attributes) {
      // attribute does not appear on record, error
      if (record[attrName] === undefined) {
        throw new Error(`invalid attribute name: ${attrName}`);
      }

      copy[attrName] = record[attrName];
    }
    records.push(copy);
  }

  // copy collections
  const allCollections = dataset.collections.slice();
  const collections = [];

  // filter out any attributes that aren't in the selected list
  for (const coll of allCollections) {
    coll.attrs = coll.attrs?.filter((attr) => attributes.includes(attr.name));

    // do not copy formulas: selected attributes may be separated from
    // their formula's dependencies, rendering the formula invalid.
    coll.attrs?.forEach((attr) => (attr.formula = undefined));

    // keep only collections that have at least one attribute
    if (coll.attrs === undefined || coll.attrs.length > 0) {
      collections.push(coll);
    } else {
      reparent(allCollections, coll);
    }
  }

  return {
    collections,
    records,
  };
}
